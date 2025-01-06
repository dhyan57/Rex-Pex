const User=require("../../models/userSchema")
const Cart=require('../../models/cartSchema')
const Product =require('../../models/productSchema')
const Category =require('../../models/categorySchema')
const Address=require('../../models/addressSchema')




const addToCart = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.status(404).redirect("/login");
        }

        const quantity = req.body.quantity || 1;
        const productId = req.body.productId || req.query.productId;
        console.log("productId",productId);
        console.log("productId,quantity",quantity);
        
        
        console.log(req.body,userId)
        const quantityNumber = parseInt(quantity, 10); 
        console.log(quantityNumber);
        
        const product = await Product.findOne({_id:productId});
        console.log(product);  
        const productPrice = product.salePrice;
        const productQuantity = product.quantity;
        if(productQuantity<quantityNumber){
            return res.status(400).json({message:"Product out of stock"});
        }

        console.log("productQuantity",productQuantity);
        
        const itemTotalPrice = productPrice * quantityNumber;
        console.log(itemTotalPrice);
        
        let cart = await Cart.findOne({ userId: userId._id });
 
        if (!cart) {
            cart = new Cart({
                userId:userId._id,
                items: [{
                    productId,
                    quantity: quantityNumber,
                    price: productPrice,
                    totalPrice: itemTotalPrice
                }]
            });
        } else {
            const itemIndex = cart.items.findIndex(item => item.productId.equals(productId));

            if (itemIndex > -1) {
                if(product.quantity > cart.items[itemIndex].quantity && cart.items[itemIndex].quantity < 5 ){
                    cart.items[itemIndex].quantity += quantityNumber;
                cart.items[itemIndex].totalPrice = cart.items[itemIndex].quantity * productPrice;

                }else{
                    return  res.status(500).json({message:"Product limit reached"});
                }
                
            } else {
                cart.items.push({
                    productId,
                    quantity: quantityNumber,
                    price: productPrice,
                    totalPrice: itemTotalPrice
                });
            }
        }
        
        let dataSave = await cart.save();
        if(dataSave){
            console.log("data save");
        
        }else{
            console.log("not save")
        }
        return res.status(200).json({success:true});
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).send("Error adding to cart");
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
        console.log('cartdata',cartData)
        
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
        
        const id=req.query.id;
        console.log(id);

        if(!id){
            return res.status(400).redirect("/pageerror")
        }
        const cart=await Cart.findOne({userId:user._id})
        const prodId=cart.items.findIndex(item=>item.productId.toString()===id)
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


const clearCart= async (req,res)=>{
    try {
        const userId=req.session.user;
        if(!userId){
            return res.redirect('/login')
        }
        const cart=await Cart.findOne({userId:userId})
        if(cart){
            cart.items=[];
            await cart.save()
            res.redirect('/showCart')
        
        }else{
            res.redirect('/')
        }



    } catch (error) {
        console.error(error);
        res.render('page-404')
        
    }
}










module.exports = {
    addToCart,
    getShowCart,
    removeCart,
    updateQuantity,
    clearCart

    
};



