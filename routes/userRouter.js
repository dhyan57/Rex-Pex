const express=require('express')
const router=express.Router()
const userController=require('../controllers/user/userController')
const productController=require ('../controllers/user/productController')
const profileControllers=require("../controllers/user/profileController")


const passport=require("passport")
const { userAuth } = require('../middlewares/auth')

router.get("/", userController.LoadHomepage) 
router.get('/signup',userController.Loadsignup)
router.post('/signup',userController.signup)
router.get("/pageNotFound",userController. pageNotFound)
router.post("/verify-otp", userController.verifyOtp);
router.post('/resendOtp',userController.resendOtp)
router.get("/auth/google/",passport.authenticate('google',{scope:['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    req.session.user = req.user._id;
    res.redirect('/')
})
router.get('/login',userController.LoadLogin)
router.post('/login',userController.login)
router.get('/logout',userController.logout)


//product management
router.get("/productDetails",userAuth,productController.productDetails)
router.get("/forgot-password",profileControllers.getForgotPassPage)
router.post("/forgot-email",profileControllers.forgotEmailValid)
router.post("/verify-passForgot-otp",profileControllers.verifyForgotPassOtp)
router.get("/reset-password",profileControllers.getResetPassPage)
router.post("/resend-otp",profileControllers.resendOtp)
router.post("/reset-password",profileControllers.postNewPassword)
router.get("/userProfile",userAuth,profileControllers.userProfile)












module.exports=router