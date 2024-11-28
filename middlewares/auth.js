const User=require("../models/userSchema")





const userAuth=(req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data&&!data.isBlocked){
                next();
            }else{
                res.redirect("/login")
            }
        })
        .catch(error=>{
            console.log("Erroe in user authmiddleware")
            res.ststus(500).send("Internal server error")
        })
    
    }else{
        res.redirect("/login")
    }
}





const adminAuth=(req,res,next)=>{
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data){
            next()
        }else{
            res.redirect("/admin/login")
        }
    })
    .catch(error=>{
        console.log("error ii adminauth middleware",error)
        res.status(500).send("Internal server error")
    })
}


module.exports={
    userAuth,
    adminAuth
}