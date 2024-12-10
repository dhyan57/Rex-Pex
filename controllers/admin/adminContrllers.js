const User = require('../../models/userSchema');
const mongoose=require('mongoose')
const bcrypt=require('bcrypt')

const pageerror=async(req,res)=>{
    res.render("admin-error")
} 

const loginPage = async (req,res)=>{
    try {
        return res.render('admin-login')
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:'loggin failed'})
        
    }
}


const login=async(req,res)=>{
    try {
        const {email,password}=req.body
        const admin=await User.findOne({email,isAdmin:true})
        if(admin){
            const passwordMatch=bcrypt.compare(password,admin.password)
            if(passwordMatch){
                req.session.admin=true
                return res.redirect("/admin/dashboard")
            }else{
                return res.redirect("/admin/login")
            }
        }
    } catch (error) {
        console.log("login error",error)
    return  res.redirect ("/pageerror")
    }
}

const loadDasboard=async(req,res)=>{
    if(req.session.admin){
    try {
        res.render("dashboard")
    }catch (error) {
        req.redirect("/pageNotFount")
    }
}
}


const logout=async(req,res)=>{
    try {
        req.session.destroy(err=>{
            if(err){
            console.log("error destroying sessio",err)
            return res.redirect("/pageerror")
        }
        res.redirect("/admin/login")
        })
    } catch (error) {
        console.log(("ubexpected error during logout",error))
        res.redirect("/pageerror")
    }
}







module.exports={
    loginPage,
    login,
    loadDasboard,
    pageerror,
    logout
}