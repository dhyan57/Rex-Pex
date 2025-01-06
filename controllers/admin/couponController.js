
const Coupon =require('../../models/couponSchema')

const getCoupon= async (req,res)=>{
    try {
        const coupons=await Coupon.find().sort({createdOn:-1});
        res.render('addCoupon',{coupons})
    } catch (error) {
        console.error(error);
        res.redirect('/pageNotFound')

    }
}
const addCoupon=async (req,res)=>{
    try {
        const  { name, expireOn, offerPrice, minimumPrice,maximumPrice }=req.body;
        const exist=await Coupon.find({name})
        if(exist&& exist.length!=0){
            console.log(exist);
            return res.status(400).json({message:'already added'})
        }
        const newCoupon= new Coupon({
            name,
            expiredOn:expireOn,
            offerPrice,
            minimumPrice,
            maximumPrice,
            
        })
        await newCoupon.save()
        res.status(200).json({ message: 'Coupon added successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
        
    }
}
const deleteCoupon=async (req,res)=>{
    try {
        const id=req.params.id;
        await Coupon.findByIdAndDelete(id)
        res.redirect('/admin/add-coupon')
    } catch (error) {
        console.error(error);
        
    }
}











module.exports={
    getCoupon,
    addCoupon,
    deleteCoupon

}