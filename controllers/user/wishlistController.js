const User=require('../../models/userSchema')
const Cart=require('../../models/cartSchema')
const Product =require('../../models/productSchema')
const Wishlist =require('../../models/wishlistSchema')






const addToWishlist= async (req,res)=>{
    try {
        const userId=req.session.user;
        const productId=req.query.id;
        if(!userId&&!productId){
            console.log('userId or productId is missing');
            return res.redirect('/')
        }
        
        const wishlist = await Wishlist.findOne({ userId, "products.productId": productId });
        console.log(wishlist);
        

        if (wishlist) {
            
            return res.status(200).json({ success: false, message: "Product is already in your wishlist!" });
        }

        
        await Wishlist.updateOne(
            { userId },
            { $addToSet: { products: { productId } } },
            { upsert: true }  
        );

        res.status(200).json({ success: true, message: "Product added to wishlist!" });


    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error adding product to wishlist" });
        
    }
}
const getWishlist=async (req, res) => {
    try {
        const userId = req.session.user; 
        if (!userId) {
            return res.redirect('/login');
        }

        const wishlist = await Wishlist.findOne({ userId }).populate('products.productId');

        if (!wishlist || wishlist.products.length === 0) {
            return res.render('wishlist', { wishlistItems: [] });
        }

        console.log(wishlist.products);

        const wishlistItems = wishlist.products.map(item => ({
            id: item.productId._id,
            name: item.productId.productName,
            description: item.productId.description,
            price: item.productId.salePrice,
            stock: item.productId.quantity> 0 ? 'In Stock' : 'Out of Stock',
            image: item.productId.productImage[0],  
            stockStatus: item.productId.quantity > 0,
        }));

        console.log(wishlistItems);

        res.render('wishlist', { wishlistItems, user: userId });
    } catch (error) { 
        console.error('Error fetching wishlist:', error);
        res.status(500).send('Internal server error');
    }
};
const removeWishlist=async (req, res) => {
    try {
        console.log('remove from wishlst');
        const userId = req.session.user;
        if(!userId){
            console.log('user  not found');
            res.status(400).redirct('/login')
        }
        const productId = req.query.id;

        await Wishlist.updateOne(
            { userId },
            { $pull: { products: { productId } } }
        );

        res.json({ success: true, message: 'Product removed from wishlist' });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}









module.exports={
    addToWishlist,
    getWishlist,
    removeWishlist

}