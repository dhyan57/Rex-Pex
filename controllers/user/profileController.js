const User = require("../../models/userSchema")
const Address=require("../../models/addressSchema")
const Order=require("../../models/orderSchema")
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


async function sendVerificationEmail(email, otp) {
    try {
        if (!email) {
            console.error("No recipient email provided.");
            return false;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            },
        });

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify your account",
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP: ${otp}</b>`,
        });

        console.log("Email sent info:", info);
        return info.accepted.length > 0;

    } catch (error) {
        console.error("Error sending email:", error.message);
        console.error(error.stack);
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
    console.log("resend otp");
    
    try {
        const otp = generateOtp()
        req.session.otp=otp
        const email=req.session.userData.email
        console.log(email);
        console.log(req.session);
        
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
        const userData=await User.findById(userId);
        const addressData=await Address.findOne({userId:userId})
        res.render('profile',{
            user:userData,
            address:addressData

        })
    } catch (error) {
        console.error("Error for retrive profile data",error)
    res.redirect("/pageerror")
    }
}



const address = async (req, res) => {
    try {
        const user = req.session.user;
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = 3 // Number of addresses per page
        const skip = (page - 1) * limit;

        // Fetch the total count of addresses
        const totalAddresses = await Address.findOne({ userId: user });
        if (!totalAddresses) {
            return res.render("address", {
                user: user,
                address: [],
                currentPage: 1,
                totalPages: 1,
            }); 
        }
        const addressData = totalAddresses.address.slice(skip, skip + limit);
        const totalPages = Math.ceil(totalAddresses.address.length / limit);
        console.log("totalAddresses:", addressData);
        res.render("address", {
            user: user,
            address: addressData,
            currentPage: page,
            totalPages: totalPages,
        });
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
};


const addAddress=async(req,res)=>{
    try {
        const user=req.session.user;
    
        res.render("add-Address",{user:user})
    } catch (error) {
        res.redirect("/pageerror")
    }
}

const postAddAddress=async(req,res)=>{
    try {
        const userId=req.session.user
        const userData=await User.findOne({_id:userId})
        const {addressType,name,city,landMark,state,pincode,phone,altPhone}=req.body
        const userAddress=await Address.findOne({userId:userData._id})
        if(!userAddress){
            const newAddress=new Address({
                userId:userData._id,
                address:[{addressType,name,city,landMark,state,pincode,phone,altPhone}]
            })
            await newAddress.save();
        }else{
            userAddress.address.push({addressType,name,city,landMark,state,pincode,phone,altPhone})
            await userAddress.save()
        }
        res.redirect("/userProfile")
    } catch (error) {
        console.log("post address error",error.message);
        res.redirect("/pageNotFound");
    }
}


const editAddress=async(req,res)=>{
    try {
        const addressId=req.query.id;
        console.log(addressId);
        
        const user=req.session.user
        const currentAddress=await Address.findOne({
            userId:user
        
        })
        console.log(currentAddress);
        
        if(!currentAddress){
            return res.redirect ("/pageNotFound")
        }
        const addressData=currentAddress.address.find((item)=>{
            return item._id.toString()===addressId.toString() 
        })
        console.log('addressData');
        console.log(addressData);
        
        if(!addressData){
            return res.redirect("/pageNotFound")
        }
        res.render("edit-address",{address:addressData,user:user})

    } catch (error) {
        console.error("Error in edit address",error)
        res.redirect("/pageNotFound")
    }
};




const postEditAddress = async (req, res) => {
    try {
        const data = req.body
        const addressId = req.query.id;
        const user = req.session.user
        const findAddress = await Address.findOne({ 'address._id': addressId })
        if (!findAddress) {
            res.redirect('pageerror')
        }
        await Address.updateOne({ 'address._id': addressId }, {
            $set: {
                'address.$': {
                    _id: addressId,
                    addressType: data.addressType,
                    name: data.name,
                    city: data.city,
                    landMark: data.landMark,
                    state: data.state,
                    pincode: data.pincode,
                    phone: data.phone,
                    altPhone: data.altPhone


                }
            }
        })
        res.redirect('address')
    } catch (error) {

    }
}
const deleteAddress= async (req,res)=>{
    try {
        const addressId=req.query.id;
        const findAddress=await  Address.findOne({ 'address._id': addressId })
        if(!findAddress){
            return res.status(404).send('address is not found')


        }

        await Address.updateOne({'address._id':addressId},{$pull:{address:{_id:addressId}}})

        res.redirect('/address')

    } catch (error) {
        console.error('error delete address');
        res.redirect('/admin/pageerror')
        
    }
}









module.exports={
    getForgotPassPage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetPassPage,
    resendOtp,
    postNewPassword,
    userProfile,
    address,
    addAddress,
    postAddAddress,
    editAddress,
    postEditAddress,
    deleteAddress,
}