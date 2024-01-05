const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const {check, validationResult } = require('express-validator');
//@route  GET api/profile/me
//@desc  Get current users profile
//@access Private
router.get('/me', auth , async (req,res) => {
    try{
     const profile = await Profile.findOne({ user: req.user.id}).populate('user',['name','avatar']);
     if(1){
        return res.status(400).json({msg: 'There is no profile for the above user'});

     }
     res.json(profile);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
//@route  POST api/profile/me
//@desc  Create or update user profile
//@access Private
router.post('/',[auth,[
    check('status','Status is required').not().isEmpty(),
    check('skills','Skills is required').not().isEmpty()
]],async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }

    const {
        company,
         website,
         location,
         bio,
         status,
         githubusername,
         skills,
         youtube,
         facebook,
         instagram,
         twitter,
         linkedin
    } = req.body;

    //Build profile object
     const profileFields = {};
     profileFields.user = req.user.id;
      if(company) profileFields.company = company;
      if(website) profileFields.website = website;
      if(location) profileFields.location = location;
      if(bio) profileFields.bio = bio;
      if(status) profileFields.status = status;
      if(githubusername) profileFields.githubusername = githubusername;
      if(skills){
        // console.log(123);
        profileFields.skills = skills.split(',').map(skill => skill.trim());

      }

      //Build social object
      profileFields.social = {};
      if(youtube) profileFields.social.youtube = youtube;
      if(twitter) profileFields.social.twitter = twitter;
      if(facebook) profileFields.social.facebook = facebook;
      if(linkedin) profileFields.social.linkedin = linkedin;
      if(instagram) profileFields.social.instagram = instagram;
      
      try{
       let profile =await Profile.findOne({user: req.user.id});
       if(profile){
        //Update
        profile = await Profile.findOneAndUpdate({user: req.user.id},{ $set: profileFields},{new:true});
        return res.json(profile);
       }
       //Create
       profile = new Profile(profileFields);
       await profile.save();
       res,json(profile);
      }catch(err){
        console.error(err.message);
        res.status(500).send('Server error');
      }
})
//@route  GET api/profile
//@desc  Get all profiles
//@access Public



router.get('/', async(req,res)=>{
    try {
        const profiles = await Profile.find().populate('user',['name','avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

//@route  GET api/profile/user/user_id
//@desc  Get profile by user id
//@access Public



router.get('/user/:user_id', async(req,res)=>{
    try {
        const profile = await Profile.findOne({ user: req.params.user_id}).populate('user',['name','avatar']);
        if(!profile) return res.status(400).json({msg: "There is no profile exists for the above user"});
        res.json(profile);
    } catch (err) {
        if(err.kind == 'ObjectId'){
            return res.status(400).json({msg: "There is no profile exists for the above user"});
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})

//@route  DELETE api/profile
//@desc   DeLETE profile,user & posts
//@access Private 



router.delete('/',auth, async(req,res)=>{
    try {
        // Delete profile 
        //Remove users posts
        await Profile.findOneAndDelete({user: req.user.id});

        //Remove user
        await User.findOneAndDelete({_id: req.user.id});

        res.json({msg:'User removed successfully'});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})


// @route  PUT api/profile/experience
// @desc  Add experience profile
// @access Private
router.put('/experience',[auth,[
    check('title','Title is required').not().isEmpty(),
    check('company','Company is required').not().isEmpty(),
    check('from','From date is required').not().isEmpty(),
]],async(req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({errors: errors.array()});
    const{title,company,location,from,to,current,description} = req.body;
    const newExp = {
        title,company,location,from,to,current,description
    };
    try {
        const profile = await Profile.findOne({user: req.user.id });
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);



    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    } 
})

//@route  DELETE api/profile/experience/:exp_id
//@desc   DeLETE experience 
//@access Private 
router.delete('/experience/:exp_id',auth,async(req,res)=>{
    try {
        const profile = await Profile.findOne({user: req.user.id });

        //Get the remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
         profile.experience.splice(removeIndex,1);
         await profile.save();
         res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
})



// @route  PUT api/profile/education
// @desc  Add education
// @access Private
router.put('/education',[auth,[
    check('school','School is required').not().isEmpty(),
    check('degree','Degree is required').not().isEmpty(),
    check('from','From date is required').not().isEmpty(),
    check('fieldofstudy','Field of Study is required').not().isEmpty(),
]],async(req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({errors: errors.array()});
    const{school,degree,fieldofstudy,from,to,current,description} = req.body;
    const newEdu = {
        school,degree,fieldofstudy,from,to,current,description
    };
    try {
        const profile = await Profile.findOne({user: req.user.id });
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);



    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    } 
})

//@route  DELETE api/profile/education/:exp_id
//@desc   DeLETE education
//@access Private 
router.delete('/education/:edu_id',auth,async(req,res)=>{
    try {
        const profile = await Profile.findOne({user: req.user.id });

        //Get the remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
         profile.education.splice(removeIndex,1);
         await profile.save();
         res.json(profile);

         
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
})
module.exports = router;
