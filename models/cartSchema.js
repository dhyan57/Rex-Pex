const mongoose=require('mongoose');
const {schema}=mongoose

const cartSchema=new Schema({
    UserId:{
        type:schema.Type.ObjectId,
        ref:"User",
        required:true
    },
    items:[{
        ProductId:{
            type:schema.Type.ObjectId,
            ref:'Product',
            required:true
        },
        quantity:{
            type:Number,
            default:1
        },
        price:{
            type:Number,
            required:true
        },
        totalPrice:{
            type:Number,
            required:true
        },
        status:{
            type:String,
            default:true
        },
        cancellationReason:{
            type:String,
            default:"none"
        }
    }]
})



const Cart=mongoose.model("Cart",cartSchema)
module.exports=Cart;