const express=require('express')
const router=express.Router()
const userController=require('../controllers/user/userController')
const productController=require ('../controllers/user/productController')
const profileControllers=require("../controllers/user/profileController")
const cartControllers=require('../controllers/user/cartControllers')
const wishlistControllers=require('../controllers/user/wishlistController')
const checkOutControllers = require('../controllers/user/checkOutController');
const orderControllers = require('../controllers/user/orderController');
const walletControllers=require('../controllers/user/walletController');

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



router.get("/productDetails",userAuth,productController.productDetails)

//profile management
router.get("/forgot-password",profileControllers.getForgotPassPage)
router.post("/forgot-email",profileControllers.forgotEmailValid)
router.post("/verify-passForgot-otp",profileControllers.verifyForgotPassOtp)
router.get("/reset-password",profileControllers.getResetPassPage)
router.post("/resend-otp",profileControllers.resendOtp)
router.post("/reset-password",profileControllers.postNewPassword)
router.get("/userProfile",userAuth,profileControllers.userProfile)


//adddress management
router.get("/address",userAuth,profileControllers.address)
router.get("/addAddress",userAuth,profileControllers.addAddress)
router.post("/addAddress",userAuth,profileControllers.postAddAddress)
router.get("/editAddress",userAuth,profileControllers.editAddress)
router.post('/editAddress',userAuth,profileControllers.postEditAddress)
router.get('/deleteAddress',userAuth,profileControllers.deleteAddress)

//cart management
router.post('/addToCart',userAuth,cartControllers.addToCart)
router.get('/showCart',userAuth,cartControllers.getShowCart)
router.get('/removeCart',userAuth,cartControllers.removeCart)
router.post('/updateQuantity',userAuth,cartControllers.updateQuantity)
router.get('/showCart/clearCart',userAuth,cartControllers.clearCart)




//checkout
router.get('/checkout',userAuth,checkOutControllers.checkout)
router.post('/postCheckOut',userAuth,checkOutControllers.PostCheckOut)
router.post('/place-order-initial',userAuth,checkOutControllers.placeOrderInitial)
router.post('/verify-payment',userAuth,checkOutControllers.verifyPayment)
router.get('/order-confirmation',userAuth,checkOutControllers.orderConfirm)
router.post('/create-order',checkOutControllers.createOrder);
router.post('/place-order',checkOutControllers.placeOrder);

//shop
router.get('/shop',userAuth,productController.shop)
router.get('/getFilteredData',userController.getFilterData)



//order mamagement
router.get('/orders',userAuth,orderControllers.getOrders)
router.get('/order-details',userAuth,orderControllers.getOrderDetails)
router.post('/return-request',userAuth,orderControllers.returnRequest)
router.get('/cancel-order',userAuth,orderControllers.getOrderCancel)
router.get('/download-invoice',userAuth,orderControllers.downloadInvoice)
router.post('/apply-coupon',userAuth,orderControllers.applyCoupon)
router.post('/remove-coupon',userAuth,orderControllers.removeCoupon);
router.get('/coupons',userAuth,orderControllers.getCoupons)



//wishlist management
router.get('/addtoWishlist',userAuth,wishlistControllers.addToWishlist)
router.get('/wishlist',userAuth,wishlistControllers.getWishlist)
router.delete('/removeFromWishlist',userAuth,wishlistControllers.removeWishlist)


//wallet management

router.get('/wallet',userAuth, walletControllers.loadWallet);
router.post('/create-wallet',userAuth,walletControllers.createWallet)
router.post('/verify-wallet',userAuth,walletControllers.verifyWallet)


module.exports=router