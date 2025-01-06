const Product=require("../../models/productSchema");
const User=require("../../models/userSchema")
const Category = require("../../models/categorySchema")





const productDetails=async(req,res)=>{
    try {
        
        const userId=req.session.user;
        const userData=await User.findById(userId)
        const productId=req.query.id;
        const product=await Product.findById(productId).populate('category')
        const findCategory=product.category;
        
        const categoryOffer=findCategory?.categoryOffer||0;
        const productOffer=product.productOffer||0;
        const totalOffer=categoryOffer+productOffer;

        const recommendedProduct=await Product.find({category:findCategory,_id:{$ne:productId}})
        
        res.render("product-details",{
            user:userData,
            product,
            quantity:product.quantity,
            totalOffer,
            category:findCategory,
            recommendedProduct
        });
        
    } catch (error) {
        console.error("Error for fetching Product details",error)
        res.redirect("/pageNotFound")
    }
}



const shop = async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) {
            return res.redirect('/login');
        }
        const products = await Product.find().populate('category');
        const categories = await Category.find();

        console.log("categories:", categories)

        res.render("shop", { products, categories });
    } catch (error) {
        console.error("Error fetching shop data:", error);
        res.redirect("/pageerror");
    }
};







module.exports={
    productDetails,
    shop
}