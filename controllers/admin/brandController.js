const Brand = require("../../models/brandSchema");
const Product = require("../../models/productSchema");

const getBrandPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const brandData = await Brand.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit);
        const totalBrands = await Brand.countDocuments();
        const totalPages = Math.ceil(totalBrands / limit);
        const reverseBrand = brandData.reverse(); 
        const currentPage = page; 
        res.render("brands", {
            data: reverseBrand,
            currentPage: currentPage, 
            totalPages: totalPages,
            totalBrands: totalBrands,
        });
    } catch (error) {
        console.error("Error fetching brand page:", error);
        res.redirect("/pageerror");
    }
};

const addBrand = async (req, res) => {
    console.log("addbrand");
    try {
        
        
        const brand = req.body.name;
        const findBrand = await Brand.findOne({ brandName: brand });

        if (findBrand) {
            return res.status(400).send("Brand already exists");
        }

        if (!req.file) {
            console.error("File upload failed");
            return res.status(400).send("Brand image is required");
        }

        const image = req.file.filename;
        const newBrand = new Brand({
            brandName: brand,
            brandImage: image,
        });

        await newBrand.save();
        res.redirect("/admin/brands");
    } catch (error) {
        console.error("Error adding brand:", error);
        res.redirect("/pageerror");
    }
};



const blockBrand=async(req,res)=>{
    try {
        const id=req.query.id;
        console.log(id);
        
        await Brand.updateOne({_id:id},{$set:{isBlocked:true}});
        console.log("savedd");
        
        res.redirect("/admin/brands")
    } catch (error) {
        
    }
}

const unBlockBrand=async(req,res)=>{
    try {
        const {id}=req.query;
        await Brand.updateOne({_id:id},{$set:{isBlocked:false}});
        res.redirect("/admin/brands")

    } catch (error) {
        res.redirect("/pageerror"); 
        
    }
}


const deleteBrand=async(req,res)=>{
    try {
        const {id}=req.query
        if(!id){
            return res.status(400).redirect("/pageerror")
        }
        await Brand.deleteOne({_id:id});
        res.redirect("/admin/brands")
    } catch (error) {
        console.error("Error deleting brand:",error)
        res.status(500).redirect("/pageerror")
    }
}













module.exports = {
    getBrandPage,
    addBrand,
    blockBrand,
    unBlockBrand,
    deleteBrand

}

