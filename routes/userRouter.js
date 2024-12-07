const express=require('express')
const router=express.Router()
const userController=require('../controllers/user/userController')
const productController=require ('../controllers/user/productController')


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



module.exports=router