const mongoose=require('mongoose')
const {schema}=mongoose



const couponSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    expiredOn:{
        type:Date,
        reqiuired:Date.now,
    },
    offerPrice:{
        type:Number,
        required:true
    },
    minimumPrice:{
        type:Number,
        required:true
    },
    isList:{
        type:Boolean,
        default:true
    },
    userId:[{
        type:mongoose.schema.Type.ObjectId,
        ref:"User"
    }]
})


const Coupon=moongoose.model("Coupon",couponSchema)
module.exports=Coupon