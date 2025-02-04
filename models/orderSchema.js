const mongoose = require('mongoose');
const {Schema}=mongoose
const {v4:uuidv4 } = require('uuid');


const orderSchema=new Schema({
    orderId:{
        type:String,
        default:()=>uuidv4(),
        unique:true
    },
    user:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },

    orderedItems:[{
        product:{
            type:Schema.Types.ObjectId,
            ref:'Product',
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            default:0
        }
    }],
    totalPrice:{
        type:Number,
        required:true

    },
    discount:{
        type:Number,
        default:0
    },
    finalAmount:{
        type:Number,
        required:true
    },
    address:{
        type:Schema.Types.ObjectId,
        ref:'Address',
        required:true
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'Online','Wallet'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Processing', 'Completed', 'Failed'],
        default: 'Pending'
    },
    invoiceDate:{  
        type:Date
    },
    status:{
        type:String,
        required:true,
        enum:['pending','processing','Shipped','Delivered','Cancelled','Return Requeest','Returned']

    },
    deliveryCharge:{
        type:Number,
        require:true

    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    couponCode:{
        type:String,
        require:true

    },
    couponApplied:{
        type:Boolean,
        default:false
    },
    cancelleationReson:{
        type:String,
        default:'',

    }
},{ timestamps: true })
const Order= mongoose.model('Order',orderSchema)
module.exports=Order