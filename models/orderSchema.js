const mongoose=require('mongoose');
const {schema}=mongoose
const {v4:uuidv4}=require('uuid')

const orderScchema=new schema({
    orderId:{
        type:String,
        default:()=>uuidv4(),
        unique:true
    },
    orderItems:[{
        Product:{
            type:Schema.Type.OrderId,
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
        type:Schema.Type.ObjectId,
        ref:'User',
        required:true
    },
    invoiceDate:{
        type:Date,
    },
    status:{
        type:String,
        required:true,
        enum:["Pending",'Processing','Shipped','Delivered','Cancalled','Return Request','Returned ']
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    couponApplied:{
        type:Boolean,
        default:false
    }
})



const Order=moongoose.model("Order",orderSchema)
module.exports=Order