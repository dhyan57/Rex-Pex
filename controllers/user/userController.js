
const User = require('../../models/userSchema')
const nodemailer=require("nodemailer")
const env=require('dotenv').config()







const LoadHomepage=async(req,res)=>{
    try{
        const userId=req.session.user
        console.log(userId)
        if(userId){
            const userData=await User.findOne({ _id:userId })
            res.render("home",{user:userData})
        }else{
            return res.render("home")
        }

    }catch(error){
        console.log("home page not found")
        res.status(500).send("server error")
    }
}


const pageNotFound =async (req,res)=>{
    try {
        res.render("page-404")

    } catch (error) {
        res.redirect("/pageNotFound")
    }
}



const Loadsignup =async (req,res)=>{
    try {
        return res.render('signup')
        
    } catch (error) {
        console.log("home page not found",error)
        res.status(500).send("server error")
    }
}




function generateOtp(){
    console.log('hendn')
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

const signup = async (req, res) => {
    console.log('Signup handler called');
    try {
        const { name, phone, email, password, cpassword } = req.body;
        console.log('Request body:', req.body);

        if (password !== cpassword) {
            return res.render('signup', { message: "Passwords do not match" });
        }

        const findUser = await User.findOne({ email });
        if (findUser) {
            console.log("already have an email")
            return res.render('signup', { message: "Email already exists" });
        }

        console.log('Before generating OTP');
        const otp = generateOtp();
        console.log('Generated OTP:', otp);

        const emailSent = await sendVerificationEmail(email, otp);
        if (!emailSent) {
            return res.json("email-error");
        }

        console.log('Email sent:', emailSent);

        req.session.userOtp = otp;
        req.session.userData = { name, phone, email, password };

        res.render("verify-otp");
        console.log("OTP sent", otp);

    } catch (error) {
        console.error("Signup error:", error);
        res.redirect("/pageNotFound");
    }
};



const securePassword =async(password)=>{
    try {
        const passwordHash=await bcrypt.hash(password,10)
        return passwordHash
    } catch (error) {
        
    }
}


const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        console.log("Entered OTP:", otp);

        if (otp === String(req.session.userOtp)) { 
            const user = req.session.userData;

            // Validate session data
            if (!user || !user.name || !user.email || !user.phone || !user.password) {
                return res.status(400).json({
                    success: false,
                    message: "Session data is incomplete. Please try signing up again.",
                });
            }

            const passwordHash = await securePassword(user.password);

            const saveUserData = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHash,
            });

            await saveUserData.save();
            req.session.user = saveUserData._id;
            
            res.json({ success: true, redirectUrl: "/" });
        } else {
            res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
        }
    } catch (error) {
        console.error("Error Verifying OTP", error);
        res.status(500).json({ success: false, message: "An error occurred." });
    }
};



const resendOtp = async (req, res) => {
    try {
        const { email } = req.session.userData;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email not found in session." });
        }

        // Generate OTP
        const otp = generateOtp(); // Define or import this function
        req.session.userOtp = otp;

        // Send Verification Email
        const emailSent = await sendVerificationEmail(email, otp); // Pass necessary arguments
        if (emailSent) {
            console.log("Resend OTP:", otp); // Avoid logging in production
            return res.status(200).json({ success: true, message: "OTP Resent Successfully" });
        } else {
            return res.status(500).json({ success: false, message: "Failed to resend OTP. Please try again." });
        }
    } catch (error) {
        console.error("Error resending OTP:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error. Please try again." });
    }
};


const LoadLogin=async(req,res)=>{
    try {
        if(!req.session.user){
            return res.render('login')
        }else{
            res.redirect('/')
        }
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}


const bcrypt = require('bcrypt'); // Ensure bcrypt is imported

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user in the database
        const findUser = await User.findOne({ isAdmin: 0, email: email });
        if (!findUser) {
            return res.render('login', { message: "User not found" });
        }

        // Check if user is blocked
        if (findUser.isBlocked) {
            return res.render("login", { message: "User is blocked by admin" });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, findUser.password);
        if (!passwordMatch) {
            return res.render('login', { message: "Password does not match" });
        }

        // Save user ID in session
        req.session.user = findUser;

        // Redirect to homepage on success
        res.redirect('/');
    } catch (error) {
        console.error("Login error:", error.stack || error);
        res.render("login", { message: "Login failed. Please try again later." });
    }
};


const logout=async(req,res)=>{
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log("session destroy error",err.message)
                return res.redirect("/pagenotFound")
            }
            return res.redirect("/login")
        })
    } catch (error) {
        console.log("logout error",error)
        res.redirect("/pagenotFound")
    }
}




module.exports={
    LoadHomepage,
    pageNotFound,
    Loadsignup,
    signup,
    securePassword,
    verifyOtp,
    resendOtp,
    LoadLogin,
    login,
    logout
} 