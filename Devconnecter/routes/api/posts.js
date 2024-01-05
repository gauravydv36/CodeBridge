const express = require('express');
const router = express.Router();
const {check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Posts = require('../../models/Posts');
//@route  POST api/posts
//@desc  Create a post
//@access Private

router.post('/',[auth,[
    check('text','Text is necessary').not().isEmpty()
]],async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({errors: errors.array()});
    try {
        const user = await User.findById(req.user.id).select('-password');
        const newPost = new Post({
            text:req.body.text,
            name:user.name,
            avatar:user.avatar,
            user:req.user.id
        });
        const post = await newPost.save();
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route  GET api/posts
//@desc  Get all posts
//@access Private
router.get('/',auth,async(req,res)=>{
    try {
        const posts = await Posts.find().sort({date: -1});
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route  GET api/posts/:id
//@desc  Get post by id
//@access Private
router.get('/:id',auth,async(req,res)=>{
    try {

        const post = await Posts.findById(req.params.id);
        if(!post) return res.status(404).json({msg:'Post not found'});
        res.json(post);
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId') return res.status(404).json({msg:'Post not found'});
        res.status(500).send('Server Error');
    }
});


//@route  Delete api/posts/:id
//@desc  Delete a post
//@access Private
router.delete('/:id',auth,async(req,res)=>{
    try {
        const post = await Posts.findById(req.params.id);
        if(!post) return res.status(404).json({msg:'Post not found'});
        //Check on user
        if(post.user.toString() !== req.user.id){
            return res.status(401).json({msg:"User not authorised"});
        }
        await post.deleteOne();
        res.json({msg: 'Post removed successfully'});
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId') return res.status(404).json({msg:'Post not found'});
        res.status(500).send('Server Error');
    }
});

//@route  PUT api/posts/like/:id
//@desc  Like a post
//@access Private
router.put('/like/:id',auth,async(req,res)=>{
try {
    const post = await Posts.findById(req.params.id);
    if(!post) return res.status(404).json({msg:'Post not found'});

    //Check if the post has already been liked
    if(post.likes.filter(like => like.user.toString()  === req.user.id).length > 0){
        return res.status(400).json({msg: "Post already liked"});
    }
    post.likes.unshift({user: req.user.id});
    await post.save();
    res.json(post.likes);
} catch (err) {
    console.error(err.message);
    if(err.kind === 'ObjectId') return res.status(404).json({msg:'Post not found'});
    res.status(500).send('Server Error');
}
});


//@route  PUT api/posts/like/:id
//@desc  UnLike a post
//@access Private
router.put('/unlike/:id',auth,async(req,res)=>{
    try {
        const post = await Posts.findById(req.params.id);
        if(!post) return res.status(404).json({msg:'Post not found'});
    
        //Check if the post has already been liked
        if(post.likes.filter(like => like.user.toString()  === req.user.id).length === 0){
            return res.status(400).json({msg: "Post has not been liked"});
        }

        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
        post.likes.splice(removeIndex,1);
        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        if(err.kind === 'ObjectId') return res.status(404).json({msg:'Post not found'});
        res.status(500).send('Server Error');
    }
    });


    //@route  POST api/posts/comment/:id
//@desc  Comment on apost
//@access Private

router.post('/comment/:id',[auth,[
    check('text','Text is necessary').not().isEmpty()
]],async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({errors: errors.array()});
    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Posts.findById(req.params.id);
        const newComment = {
            text:req.body.text,
            name:user.name,
            avatar:user.avatar,
            user:req.user.id
        };
        post.comments.unshift(newComment);
        post.save();
        // const post = await newPost.save();
        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route  Delete api/posts/comment/:id/:comment_id
//@desc  Comment on apost
//@access Private
router.delete('/comment/:id/:comment_id',auth,async(req,res)=>{
    try {
        const post = await Posts.findById(req.params.id);
        //PULL Out comment
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);
        //Make sure comment exists
          if(!comment) return res.status(404).json({msg:'Comment not found'});
          //Check user 
          if(comment.user.toString() !== req.user.id) return res.status(401).json({msg: "User not authorised"});
          const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
          post.comments.splice(removeIndex,1);
          await post.save();
          res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
module.exports = router;