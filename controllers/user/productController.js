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

        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const filters = {};
        
        if (req.query.category && req.query.category !== 'all') {
            const category = await Category.findOne({ name: req.query.category });
            if (category) {
                filters.category = category._id;
            }
        }

        if (req.query.search) {
            filters.productName = { $regex: new RegExp(req.query.search, 'i') };
        }

        // Updated sorting logic
        let sortOption = {};
        switch (req.query.sort) {
            case 'price-low':
                sortOption = { salePrice: 1 };
                break;
            case 'price-high':
                sortOption = { salePrice: -1 };
                break;
            case 'new':
                sortOption = { createdAt: -1 };
                break;
            case 'az':
                // Use collation for proper alphabetical sorting
                sortOption = { productName: 1 };
                break;
            case 'za':
                sortOption = { productName: -1 };
                break;
            default:
                sortOption = {};
        }

        const totalProducts = await Product.countDocuments(filters);

        // Add collation to the query for case-insensitive sorting
        const products = await Product.find(filters)
            .populate('category')
            .sort(sortOption)
            .collation({ locale: 'en', strength: 2 }) // Add this line for proper string sorting
            .skip(skip)
            .limit(limit)
            .lean();

        const categories = await Category.find().lean();
        const totalPages = Math.ceil(totalProducts / limit);

        res.render("shop", {
            products,
            categories,
            currentPage: page,
            totalPages,
            category: req.query.category || 'all',
            search: req.query.search || '',
            sort: req.query.sort || 'default'
        });

    } catch (error) {
        console.error("Error fetching shop data:", error);
        res.redirect("/pageerror");
    }
};



module.exports={
    productDetails,
    shop
}