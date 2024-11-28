const mongoose=require('mongoose')
const {schema}=mongoose


const addressSchema=new schema({
userId:{
    type:Schema.Type.ObjectId,
    ref:"user",
    required:true
},
address:[{
    addressType:{
        type:String,
        required:tru
    },
    name:{
        type:String,
        required:true
    },
    city:{
        type:String,
        required:true
    },
    landMark:{
        type:String,
        required:true
    },
    state:{
        type:String,
        required:true
    },
    pincode:{
        type:Number,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    altPhone:{
        type:String,
        required:true
    }
}]
})
const Address=mongoose.model("Address",addressSchema)
module.exports=Address