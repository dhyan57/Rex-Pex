const mongoose=require("mongoose")
const {schema}=mongoose


const wishlistSchema=new Schema({
    UserId:{
        type:Schema.Type.ObjectId,
        ref:"User",
        required:true
    },
    products:[{
        productId:{
            type:schema.Type.ObjectId,
            ref:"product",
            required:true
        },
        addedOn:{
            type:Date,
            default:Date.now
        }
    }]
})

const Wishlist=mongoose.model("Wishlist",wishlistSchema)
module.exports=Wishlist;