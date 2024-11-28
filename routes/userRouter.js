const express=require('express')
const router=express.Router()
const userController=require('../controllers/user/userController')

const passport=require("passport")

router.get("/", userController.LoadHomepage) 
router.get('/signup',userController.Loadsignup)
router.post('/signup',userController.signup)
router.get("/pageNotFound",userController. pageNotFound)
router.post("/verify-otp", userController.verifyOtp);
router.post('/resendOtp',userController.resendOtp)
router.get("/auth/google",passport.authenticate('google',{scope:['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    res.redirect('/')
})
router.get('/login',userController.LoadLogin)
router.post('/login',userController.login)
router.get('/logout',userController.logout)




module.exports=router