const User=require('../../models/userSchema')
const Order =require('../../models/orderSchema')
const Product =require('../../models/productSchema')
const Address = require('../../models/addressSchema')
const Coupon = require('../../models/couponSchema')
const Wallet=require('../../models/walletSchema')
const Return=require('../../models/returnSchema')
const PDFDocument = require('pdfkit');
const path = require('path');
const { exists } = require('../../models/categorySchema')

const getOrders= async (req,res)=>{
    try {
        const userId=req.session.user;
        const user = await User.findById(userId);
        if(!userId){
            console.log('user not found');
            return res.redirect('/login')
        }
        const page =parseInt(req.query.page)||1
        const limit =parseInt(req.query.limit)||5
        const skip=(page-1)*limit
        const totalOrders=await Order.countDocuments({user:userId})


        const orders=await Order.find({user:userId}).sort({createdOn:-1}).skip(skip).limit(limit);
        const totalPages=Math.ceil(totalOrders/limit);

        res.render('orderList', {
            orders,
            user,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            limit,
            message: orders.length > 0 ? null : 'No orders found',
        });
    } catch (error) {
        console.error("Error loading orders page", error);
        res.status(500).redirect('/page-not-found');

        
    }
}



const getOrderDetails= async (req,res)=>{
    try {
        const orderId=req.query.id;
        
        const userId=req.session.user;
        if(!userId){
            console.log('user not found');
            return res.redirect('/login')
        }
        const user=await User.findById(userId);
        const order= await Order.findById(orderId)
        const address=await Address.findOne({'address._id':order.address},{'address.$':1})
        const products=await Promise.all(
            order.orderedItems.map(async (item)=>{
                return await Product.findOne({_id:item.product})
            })
        );
        res.render('viewOrderDetails',{order,products,address:address.address[0],user})


    } catch (error) {
        console.error(error);
        res.redirect('/pageNotFound')
        
    }
}



const getOrderCancel= async (req,res)=>{
    try {
        const userId=req.session.user;
        if(!userId){
            console.log('user not found');
            return res.redirect('/login')
        }

        const id=req.query.id;
        const reason=req.query.reason;
        const order = await Order.findById(id);
        if (!order) {
            console.log('Order not found');
            return res.redirect('/orders');
        }
        if (order.paymentMethod === 'Online' && order.paymentStatus === 'Completed') {
            const refundAmount = order.finalAmount;
            console.log(refundAmount);
            

            

            // Update the user's wallet
            const wallet = await Wallet.findOneAndUpdate(
                { userId },
                {
                    $inc: { balance: refundAmount }, // Increment wallet balance
                    $push: {
                        transactions: {
                            type: 'Refund',
                            amount: refundAmount,
                            orderId: id,
                            description: `Refund for cancelled order #${id}`,
                            status: 'Completed', // Assuming the refund is instant
                        },
                    },
                    lastUpdated: new Date(),
                },
                { new: true, upsert: true } // Create wallet if not present
            );
            

            console.log(`Refund of ₹${refundAmount} added to wallet for user ${userId}`);
        }else if(order.paymentMethod=='COD'){
            await Order.findByIdAndUpdate(id,{$set:{paymentStatus:'Failed'}})
        }
        for(let i=0;i<order.orderedItems.length;i++){
            const product=await Product.findById(order.orderedItems[i].product)
            product.quantity+=order.orderedItems[i].quantity
            await product.save()
        }
        


        await Order.findByIdAndUpdate(id,{$set:{status:'Cancelled',cancelleationReson:reason}})
        res.redirect('/orders')
    } catch (error) {
        console.error(error);
        res.redirect('/pageNotFound')

        
    }
}
const applyCoupon=async (req,res)=>{
    const {couponCode,totalPrice}=req.body;
    console.log(req.body);
    
    try {
        const userId=req.session.user
        if (!couponCode || !totalPrice) {
            return res.status(400).json({ success: false, message: "Missing coupon code or price" });
        }
        
        const coupon =await Coupon.findOne({name:couponCode,expiredOn:{$gt:Date.now()}})
        if(!coupon){
            return res.json({success:false,meassge:'invalid or expired coupon'})
        }
        if(coupon.minimumPrice>totalPrice){
            return res.json({ success: false, message: `minimum price to apply coupon ${coupon.minimumPrice}` });

        }
        if(coupon.userId.includes(userId)){
            return res.json({ success: false, message: "coupon is already used by you" });

        }
        const discount = parseFloat(coupon.offerPrice);
        if (isNaN(discount)) {
            return res.status(400).json({ success: false, message: "Invalid discount value" });
        }
        const discountAmount = (totalPrice * discount) / 100;
        const finalTotal = totalPrice - discountAmount;
        res.status(200).json({
            success: true,
            discountAmount: discountAmount.toFixed(2),
            finalTotal: finalTotal.toFixed(2),
            message: "Coupon applied successfully!"
        });
    } catch (error) {
        console.error(error);
        
    }
}


    const removeCoupon = async (req, res) => {
        try {
    
        const { totalPrice } = req.body;
    
        const discountAmount = 0;
        const finalTotal = totalPrice;
    
        return res.json({
            success: true,
            discountAmount,
            finalTotal,
        });
    
        } catch (error) {
        console.error("Error removing coupon", error);
        res.status(500);
        }
    }


    const downloadInvoice = async (req, res) => {
        try {
        const { id } = req.query;
        const order = await Order.findById(id).populate('orderedItems.product');
        const addressDoc = await Address.findOne({ userId: req.session.user });
        if (!order) {
            return res.status(404).send("Order not found");
        }
        const address = addressDoc.address.find((addr) => addr._id.toString() === order.address.toString());

        if (!address) {
            return res.status(404).send("Address not found");
        }

        const doc = new PDFDocument({ margin: 50 });

        const filename = `invoice-${order.orderId}.pdf`;

        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');
        doc.pipe(res);

        generateHeader(doc);
        doc.moveDown();

        generateCustomerInformation(doc, order, address);
        doc.moveDown();

        generateInvoiceTable(doc, order);
        doc.moveDown();

        generateFooter(doc, order);

        doc.end();
    } catch (error) {
        console.error("Error generating invoice:", error);
        res.status(500).send("Error generating invoice");
    }
};

const generateHeader = (doc) => {
    // const logoPath = path.join(__dirname, '../public/evara-frontend/assets/imgs/theme/logo.jpg');
    doc
        // .image('C:/ameer ali/ecommerce project/public/evara-frontend/assets/imgs/theme/logo.jpg', 50, 45, { width: 50 })
        .fillColor('#444444')
        .fontSize(20)
        .text('REX_PEX', 110, 57)
        .fontSize(10)
        .text('REX_PEX', 200, 50, { align: 'right' })
        .moveDown();

    doc.strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, 90)
        .lineTo(550, 90)
        .stroke();
};

const generateCustomerInformation = async (doc, order, address) => {
    const customerInfoTop = 100;

    console.log(address.name);

    doc
        .fontSize(16)
        .text('Invoice', 50, customerInfoTop)
        .fontSize(10)
        .text(`Invoice No.: ${order.orderId}`, 50, customerInfoTop + 30)
        .text(`Invoice Date: ${order.createdOn.toLocaleDateString()}`, 50, customerInfoTop + 45)
        .text(`Due Date: ${order.createdOn.toLocaleDateString()}`, 50, customerInfoTop + 60)

        .text('Bill To:', 300, customerInfoTop + 30)
        .font('Helvetica-Bold')
        .text(address.name, 300, customerInfoTop + 45)
        .font('Helvetica')
        .text(address.landMark, 300, customerInfoTop + 60)
        .text(`${address.city}, ${address.state} - ${address.pincode}`, 300, customerInfoTop + 75)
        .text(`Phone: ${address.phone}`, 300, customerInfoTop + 90)
        .moveDown();

    doc.strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, customerInfoTop + 110)
        .lineTo(550, customerInfoTop + 110)
        .stroke();
};

const generateInvoiceTable = (doc, order) => {
    let i;
    const invoiceTableTop = 330;
    const tableTop = 250;

    doc
        .fontSize(10)
        .text('Item', 50, tableTop)
        .text('Description', 150, tableTop)
        .text('Unit Price', 280, tableTop, { width: 90, align: 'right' })
        .text('Quantity', 370, tableTop, { width: 90, align: 'right' })
        .text('Line Total', 470, tableTop, { width: 90, align: 'right' });

    doc
        .strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

    let position = 0;
    order.orderedItems.forEach((item, index) => {
        position = tableTop + 30 + (index * 30);

        doc
            .fontSize(10)
            .text(`${index + 1}`, 50, position)
            .text(item.product.productName, 150, position)
            .text("₹"+item.product.salePrice.toLocaleString(), 280, position, { width: 90, align: 'right' })
            .text(item.quantity.toString(), 370, position, { width: 90, align: 'right' })
            .text("₹"+(item.quantity * item.product.salePrice).toLocaleString(), 470, position, { width: 90, align: 'right' });
    });

    const subtotalPosition = position + 30;
    doc.strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, subtotalPosition)
        .lineTo(550, subtotalPosition)
        .stroke();

    doc
        .fontSize(10)
        .text('Subtotal:', 380, subtotalPosition + 15)
        .text("Rs."+order.totalPrice.toLocaleString(), 470, subtotalPosition + 15, { width: 90, align: 'right' })
        .text('Discount:', 380, subtotalPosition + 30)
        .text("Rs."+order.discount.toLocaleString(), 470, subtotalPosition + 30, { width: 90, align: 'right' })
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Total:', 380, subtotalPosition + 45)
        .text("Rs."+order.finalAmount.toLocaleString(), 470, subtotalPosition + 45, { width: 90, align: 'right' });
};

const generateFooter = (doc, order) => {
    doc
        .fontSize(10)
        .text('Payment Status:   ', 50, 700)
        .fillColor(order.paymentStatus === 'PAID' ? '#008000' : '#FF0000')
        .text(order.paymentStatus, 120, 700)
        .fillColor('#444444')
        .text('Shipment Status:   ', 50, 715)
        .text(order.status, 120, 715)
        .fontSize(10)
        .text('Thank you for your business. For any queries, please contact support@yourcompany.com', 50, 750, { align: 'center' });
};

const returnRequest=async (req,res)=>{
    try {
        const userId= req.session.user;
        const {orderId,reason}= req.body;
        const order=await Order.findById(orderId);
        if(!order){
            return res.status(400).json({message:'order not found'})
        }
        const exists=await Return.findOne({orderId});
        if(exists){
            return res.status(400).json({message:'order is already apply for return request'})
        }
        const refundAmount=order.finalAmount;
        const newReturn=new Return({
            userId,
            orderId,
            reason,
            refundAmount,



        })
        await newReturn.save();
        return res.status(200).json({message:'return request is successfully applied'})



    } catch (error) {
        console.log('error on return ');
        console.error(error);
        return res.status(400).json({message:'not found'})

        
    }
}
const getCoupons=async (req,res)=>{
    try {
        const user = req.session.user;
        if(!user){
        return res.redirect('/login');
        }
        const currentDate = new Date(); 

        const coupons = await Coupon.find({
        isList: true,
        userId: { $ne: user },
        expiredOn:{$gt:currentDate}
        });
        console.log("coupons",coupons);
        
        res.render('couponList',{coupons,user:userId});
    } catch (error) {
        
    }
}

module.exports={
    getCoupons,
    getOrders,
    getOrderDetails,
    getOrderCancel,
    applyCoupon,
    removeCoupon,
    downloadInvoice,
    returnRequest
}