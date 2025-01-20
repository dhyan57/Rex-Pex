const Product = require("../../models/productSchema");
const User = require("../../models/userSchema")
const Category = require("../../models/categorySchema")





const productDetails = async (req, res) => {
    try {

        const userId = req.session.user;
        const userData = await User.findById(userId)
        const productId = req.query.id;
        const category = await Category.find({ isListed: true }, { _id: 1 })
        const product = await Product.findOne({ _id: productId }).populate('category')
        console.log("product", product)
        const findCategory = product.category;

        const categoryOffer = findCategory?.categoryOffer || 0;
        const productOffer = product.productOffer || 0;
        const totalOffer = categoryOffer + productOffer;

        const recommendedProduct = await Product.find({ category: findCategory, _id: { $ne: productId } })

        res.render("product-details", {
            user: userData,
            product,
            quantity: product.quantity,
            totalOffer,
            category: findCategory,
            recommendedProduct
        });

    } catch (error) {
        console.error("Error for fetching Product details", error)
        res.redirect("/pageNotFound")
    }
}


const shop = async (req, res) => {
    try {
        const user = req.session.user;
        console.log("shopuser", user)
        if (!user) {
            return res.redirect('/login');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        const filters = {};

        // Filter by category if specified
        if (req.query.category && req.query.category !== 'all') {
            const category = await Category.findOne({ name: req.query.category, isListed: true });
            if (category) {
                filters.category = category._id;
            }
        }

        // Filter by search query if specified
        if (req.query.search) {
            filters.productName = { $regex: new RegExp(req.query.search, 'i') };
        }

        // Determine sorting logic
        let sortOption = {};
        switch (req.query.sort) {
            case 'price-low':
                sortOption.salePrice = 1; // Ascending price
                break;
            case 'price-high':
                sortOption.salePrice = -1; // Descending price
                break;
            case 'new':
                sortOption.createdAt = -1; // Newest first
                break;
            case 'az':
                sortOption.productName = 1; // A-Z
                break;
            case 'za':
                sortOption.productName = -1; // Z-A
                break;
            default:
                sortOption = {}; // Default sorting
        }

        // Fetch listed categories
        const categories = await Category.find({ isListed: true }).lean();
        const mappedCategories = categories.map(category => category._id.toString());
        console.log("categories", mappedCategories);

        // Count total products based on filters
        const totalProducts = await Product.countDocuments(filters);

        // Fetch products with collation for proper sorting when needed
        const products = await Product.find(filters)
            .populate('category')
            .sort(sortOption)
            .collation(req.query.sort === 'az' || req.query.sort === 'za' ? { locale: 'en', strength: 2 } : undefined)
            .skip(skip)
            .limit(limit)
            .lean();

        console.log("products", products);

        // Filter products to ensure only those with valid categories are included
        const mappedProducts = products.filter(product =>
            mappedCategories.includes(product.category._id.toString())
        );

        console.log("mappedProducts", mappedProducts);

        // Calculate total pages for pagination
        const totalPages = Math.ceil(totalProducts / limit);

        // Render the shop page with products and additional information
        res.render("shop", {
            user: user,
            products: mappedProducts,
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





module.exports = {
    productDetails,
    shop
}