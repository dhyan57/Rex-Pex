const User = require("../../models/userSchema")
const nodemailer=require("nodemailer")
const bcrypt=require("bcrypt")
const env=require("dotenv").config()
const session=require("express-session")


const securePassword =async(password)=>{
    try {
        const passwordHash=await bcrypt.hash(password,10)
        return passwordHash
    } catch (error) {
        
    }
}


function generateOtp(){
    
    return Math.floor(100000+Math.random()*900000).toString();
}


async function sendVerificationEmail(email,otp){
    try {
        const transporter=nodemailer.createTransport({
            service:'gmail',
            port:587, 
            secure:false,
            requireTLS:true,
            auth:{
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })

        const info=await transporter.sendMail({
            from:process.env.NODEMAILER_EMAIL,
            to :email,
            subject:"Verify your account",
            text:`Your OTP is ${otp}`,
            html:`<b>Your OTP: ${otp}</b>`
        })

        return info.accepted.length>0



    } catch (error) {
        console.error("Error sendng email",error)
        return false;
    }
}




const getForgotPassPage=async(req,res)=>{
    try {
        res.render("forgot-password")
    } catch (error) {
        res.render("pageerror")
    }
}
const forgotEmailValid=async(req,res)=>{
    try {
        const {email}=req.body
        const findUser=await User.findOne({email:email})
        if(findUser){
            const otp=generateOtp()
            const emailSent = await sendVerificationEmail(email, otp);
            if (emailSent) {
                req.session.otp=otp
                req.session.email=email
                res.render("forgotPassword-otp")
                console.log("OTP:",otp)
            }else{
                res.json({success:false,message:"failed to send otp.please try again"})
            }
        }else{
            res.render("forgot-password",{
                message:"user this email alrready exist"
            })
        }
        
    } catch (error) {
        res.render("pageerror")
    }
}


const verifyForgotPassOtp =async(req,res)=>{
    try {
        const enteredOtp=req.body.otp
        if(enteredOtp===req.session.otp){
            res.json({success:true,redirectUrl:"/reset-password"})
        }else{
            res.json({success:false,message:"OTP not matching"})
        }
    } catch (error) {
        res.status(500).json({success:false,message:"An error occured.Please try again"})
    }

}


const getResetPassPage=async(req,res)=>{
    try {
        res.render("reset-password")
    } catch (error) {
        res.redirect("/pageerror")
    }
}


const resendOtp=async(req,res)=>{
    try {
        const otp = generateOtp()
        req.session.otp=otp
        const email=req.session.email
        const emailSent=await sendVerificationEmail(email,otp)
        if(emailSent){
            console.log("resend OTP:",otp)
            res.status(200).json({success:true,message:"Resend OTP successful"})
        }
    } catch (error) {
        console.error("error in resend otp",error)
        res.status(500).json({success:false,message:"Internal server error"})
    }
}



const postNewPassword=async(req,res)=>{
    try {
        const  {newPass1,newPass2}=req.body
        const email=req.session.email
        if(newPass1===newPass2){
            const passwordHash=await securePassword(newPass1)
            await User.updateOne({
                email:email
            },{
                $set:{password:passwordHash}
            })
            res.redirect("/login"); 
        }else{
            res.render("reset-password",{message:'passwords don not match'})
        }
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}




const userProfile=async(req,res)=>{
    try {
        const userId=req.session.user
        const userData=await User.findById(userId)
        res.render('profile',{
            user:userData,

        })
    } catch (error) {
        console.error("Error for retrive profile data",error)
    res.redirect("/pageerror")
    }
}







module.exports={
    getForgotPassPage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetPassPage,
    resendOtp,
    postNewPassword,
    userProfile
}