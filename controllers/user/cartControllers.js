const User=require("../../models/userSchema")
const Cart=require('../../models/cartSchema')
const Product =require('../../models/productSchema')
const Category =require('../../models/categorySchema')
const Address=require('../../models/addressSchema')




const addToCart = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.status(401).json({ message: "Please login to continue" });
        }

        // Extract and validate input
        const quantity = parseInt(req.body.quantity || 1, 10);
        const productId = req.body.productId || req.query.productId;
        
        if (!productId) {
            return res.status(400).json({ message: "Product ID is required" });
        }

        // Find product and validate stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({ message: "Insufficient stock" });
        }

        const itemTotalPrice = product.salePrice * quantity;

        // Find or create cart
        let cart = await Cart.findOne({ userId: userId });  // Assuming userId is the ID string
        if (!cart) {
            cart = new Cart({
                userId: userId,
                items: [{
                    productId,
                    quantity,
                    price: product.salePrice,
                    totalPrice: itemTotalPrice
                }]
            });
        } else {
            const existingItem = cart.items.find(item => 
                item.productId.toString() === productId.toString()
            );

            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                
                // Validate total quantity doesn't exceed limits
                if (newQuantity > 5) {
                    return res.status(400).json({ 
                        message: "Maximum quantity limit (5) exceeded" 
                    });
                }
                
                if (newQuantity > product.quantity) {
                    return res.status(400).json({ 
                        message: "Requested quantity exceeds available stock" 
                    });
                }

                existingItem.quantity = newQuantity;
                existingItem.totalPrice = newQuantity * product.salePrice;
            } else {
                cart.items.push({
                    productId,
                    quantity,
                    price: product.salePrice,
                    totalPrice: itemTotalPrice
                });
            }
        }

        await cart.save();
        
        return res.status(200).json({
            success: true,
            message: "Product added to cart successfully",
            cart: {
                totalItems: cart.items.length,
                items: cart.items
            }
        });

    } catch (error) {
        console.error("Error adding to cart:", error);
        return res.status(500).json({
            success: false,
            message: "Error adding product to cart",
            error: error.message
        });
    }
};


const getShowCart=async (req,res)=>{
    try {
        const userId=req.session.user;
        if(!userId){
            return res.redirect('/login')
        }
        const user = await User.findById(userId._id)
        const cartData= await Cart.findOne({userId:userId._id}).populate('items.productId')
        
        
        if(!cartData){
            return res.render('cart',{cart:null,products:[],totalAmt:0,user:user})
        }
        
        const totalAmt=cartData.items.reduce((sum,item)=>sum+item.totalPrice,0)
        
        res.render('cart',{cart:cartData,products:cartData.items,totalAmt,user:user})


    } catch (error) {
        console.error(error); 
        res.redirect('/pageerror');

    }
}


const removeCart=async(req,res)=>{
    try {
        const user =req.session.user;
        console.log("user",user)
        
        const id=req.query.id;
        

        if(!id){
            return res.status(400).redirect("/pageerror")
        }
        const cart=await Cart.findOne({userId:user._id})
        console.log("cart",cart)
        const prodId=cart.items.findIndex(item=>item.productId.toString()===id)
        console.log("prodId",prodId)
        if(prodId||prodId==0){
            cart.items.splice(prodId,1)
            await cart.save()
        }
        await Cart.deleteOne({_id:id})
        res.redirect("/showCart")
        
    } catch (error) {
        res.status(500).redirect("/pageerror")
    }
}


const updateQuantity = async (req, res) => {
    const { productId, change } = req.body;
    try {

        const userId = req.session.user;
        if (!userId) {
            return res.json({ success: false, message: "User not logged in" });
        }

        const cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return res.json({ success: false, message: "Cart not found" });
        }

        const item = cart.items.find((item) => item.productId.toString() === productId);
        if (item) {
            item.quantity += change;
            item.totalPrice = item.quantity * item.price;

            if (item.quantity <= 0) {
                cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
            }

            cart.totalPrice = cart.items.reduce((total, item) => total + item.totalPrice, 0);
            await cart.save();

            res.json({
                success: true,
                newQuantity: item.quantity,
                newSubtotal: item.totalPrice,
                totalPrice: cart.totalPrice,
            });
        } else {
            res.json({ success: false, message: "Item not found in cart" });
        }

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Failed to update quantity" });
    }
};


const clearCart = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.redirect('/login')
        }
        
        // Changed findById to findOne
        const cart = await Cart.findOne({ userId: userId._id })
        
        if (cart) {
            cart.items = [];
            await cart.save()
            return res.redirect('/showCart') // Added return
        } else {
            return res.redirect('/') // Added return
        }

    } catch (error) {
        console.error(error);
        return res.render('page-404') // Added return
    }
}   

module.exports = {
    addToCart,
    getShowCart,
    removeCart,
    updateQuantity,
    clearCart
};



