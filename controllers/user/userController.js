
const User = require('../../models/userSchema')
const Category = require('../../models/categorySchema')
const Product = require('../../models/productSchema')

const nodemailer=require("nodemailer")
const env=require('dotenv').config()
const bcrypt = require('bcrypt');




function generateReferalCode(length) {
    let result = '';
    const characters = 'abcdef0123456789';
    
        for (let i = 0; i < length; i++) {
        result += characters[Math.floor(Math.random() * characters.length)];
        }
    
        return result;
    
    }


const LoadHomepage=async(req,res)=>{
    try{
        // const user = req.user;
        const userId=req.session.user
        
        
        
        
        const category=await Category.find({isListed:true})
        let productData=await Product.find({
            isBlocked:false,
            category:{$in:category.map(category=>category._id)},quantity:{$gt:0}
        })
        // if (req.isAuthenticated()) {
        //     return res.render("home",{user:userId,productData})
        // }

        productData.sort((a,b)=>new Date(a.createdOn)-new Date(b.createOn)).reverse()
        




        if(userId){
            const userData=await User.findOne({ _id:userId })
            res.render("home",{user:userData,productData})
        }else{
            return res.render("home",{productData})
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
        try {
        const { name, phone, email, password, cpassword,referal } = req.body;
    
        if (password != cpassword) {
            return res.render("signup", { message: "Passwords do not match" });
        }
    
        const findUser = await User.findOne({ email });
        if (findUser) {
            return res.render("signup", {
            message: "User with this email already exists",
            });
        }
    
        const otp = generateOtp();
        console.log(email)
        const emailSent = await sendVerificationEmail(email, otp);
    
        if (!emailSent) {
            return res.json("email-error");
        }
        
        req.session.userOtp = otp;
        req.session.userData = { name, phone, email, password ,referal};
    
        res.render("verify-otp");
        console.log("OTP sent", otp);
        } catch (error) {
        console.error("Signup eror", error);
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
        console.log("Session OTP:", req.session.userOtp);
        console.log(otp,'otp')
        console.log(otp == String(req.session.userOtp))

        if (otp == String(req.session.userOtp)) { 
            console.log("OTP verified");
            
            const user = req.session.userData;

            
            if (!user || !user.name || !user.email || !user.phone || !user.password) {
                return res.status(400).json({
                    success: false,
                    message: "Session data is incomplete. Please try signing up again.",
                });
            }

            const passwordHash = await securePassword(user.password);
            const referalCode = generateReferalCode(8);

            let refererBonus = 120;
            let newUserBonus = 100;
            if (user.referal) {
                const refererUser = await User.findOne({ referalCode: user.referal });
        
                if (refererUser) {
                    await Wallet.findOneAndUpdate(
                        { userId: refererUser._id },
                        {
                        $inc: { balance: refererBonus },
                        $push: {
                            transactions: {
                            type: "Referal",
                            amount: refererBonus,
                            description: "Referral bonus for referring a new user"
                            }
                        }
                        },
                        { upsert: true }
                    );
                    }
                }

            const saveUserData = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHash,
                referalCode
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
        console.log("Resending OTP");
        
        const { email } = req.session.userData;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email not found in session." });
        }

        
        const otp = generateOtp();
        
        req.session.userOtp = otp;

        
        const emailSent = await sendVerificationEmail(email, otp);
        if (emailSent) {
            console.log("Resend OTP:", otp);
            console.log(req.session.userOtp);
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
        if (req.session.user) {
            const user = await User.findById(req.session.user);
            if (user && user.isBlocked) {
              req.session.user = null;
              return res.render("login", { message: "User is blocked" });
            }
            return res.redirect("/");
          } else {
            return res.render("login", { message: '' });
          }
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}




const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        
        const findUser = await User.findOne({ isAdmin: 0, email: email });
        if (!findUser) {
            return res.render('login', { message: "User not found" });
        }

        
        if (findUser.isBlocked) {
            return res.render("login", { message: "User is blocked by admin" });
        }

        
        const passwordMatch = await bcrypt.compare(password, findUser.password);
        if (!passwordMatch) {
            return res.render('login', { message: "Password does not match" });
        }
        
        req.session.user = findUser;
        
        
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

const getFilterData = async (req, res) => {
    const { category = 'all', search = '', sort = 'default', page = 1, limit = 8 } = req.query;

    try {
        let query = { isBlocked: false };
        
        // Handle category filter
        if (category !== 'all') {
            const categoryId = await Category.findOne({ name: category });
            if (categoryId) {
                query.category = categoryId._id;
            }
        }

        // Handle search
        if (search.trim()) {
            query.productName = { $regex: new RegExp(search, 'i') };
        }

        let sortCriteria = {};

        // Handle different sort options
        switch (sort) {
            case 'price-low':
                sortCriteria = { salePrice: 1 };
                break;
            case 'price-high':
                sortCriteria = { salePrice: -1 };
                break;
            case 'az':
                // For case-insensitive A-Z sorting
                sortCriteria = { productName: 1 };
                break;
            case 'za':
                // For case-insensitive Z-A sorting
                sortCriteria = { productName: -1 };
                break;
            case 'new':
                sortCriteria = { createdAt: -1 };
                break;
            default:
                sortCriteria = { createdAt: -1 };
        }

        const skip = (Number(page) - 1) * Number(limit);

        // Fetch products with populated category
        let products = await Product.find(query)
            .populate('category')
            .sort(sortCriteria)
            .skip(skip)
            .limit(Number(limit));

        // If sorting is alphabetical, do an additional JS sort for proper case-insensitive ordering
        if (sort === 'az' || sort === 'za') {
            products.sort((a, b) => {
                const nameA = a.productName.toLowerCase();
                const nameB = b.productName.toLowerCase();
                return sort === 'az' 
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);
            });
        }

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / Number(limit));

        res.json({
            success: true,
            products,
            totalPages,
            currentPage: Number(page),
            totalProducts
        });

    } catch (error) {
        console.error('Error in getFilterData:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching products',
            error: error.message
        });
    }
};

module.exports = {
    getFilterData
};





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
    logout,
    getFilterData
} 