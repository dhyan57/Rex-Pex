const Product=require("../../models/productSchema");
const User=require("../../models/userSchema")
const Category=require("../../models/categorySchema")





const productDetails=async(req,res)=>{
    try {
        
        const userId=req.session.User;
        const userData=await User.findById(userId)
        const productId=req.query.id;
        const product=await Product.findById(productId).populate('category')
        const findCategory=product.category;
        const categoryOffer=findCategory?.categoryOffer||0;
        const productOffer=product.productOffer||0;
        const totalOffer=categoryOffer+productOffer 
        res.render("product-details",{
            user:userData,
            product:product,
            quantity:product.quantity,
            totalOffer:totalOffer,
            category:findCategory
        })
        
    } catch (error) {
        console.error("Error for fetching Product details",error)
        res.redirect("/pageNotFound")
    }
}






module.exports={
    productDetails
}