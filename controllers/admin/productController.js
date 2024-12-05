const Product = require("../../models/productSchema")
const Category = require("../../models/categorySchema")
const Brand = require("../../models/brandSchema")
const User = require("../../models/userSchema")
const fs = require("fs")
const path = require("path");
const sharp = require("sharp")



const getProductAddPage = async (req, res) => {
    try {
        const category = await Category.find({ isListed: true })
        const brand = await Brand.find({ isBlocked: false })
        res.render("product-add", {
            cat: category,
            brand: brand
        })
    } catch (error) {
        res.redirect("/pageerror")
    }
}


const addProducts = async (req, res) => {
    try {
        const products = req.body;

    
        const productExists = await Product.findOne({
            productName: products.productName,
        });
        if (productExists) {
            return res
                .status(400)
                .json({ error: "Product already exists. Try another name." });
        }

        
        const images = [];

        if (req.files && req.files.length > 0) {
            console.log('start');
            console.log(req.files);

            for (let file of req.files) {

                const originalImagePath = file.path;
                const resizedImagePath = path.join(
                    "public",
                    "uploads",
                    "re-image",
                    `modified-${file.filename}`
                );

                
                await sharp(originalImagePath)
                    .resize({ width: 440, height: 440 })
                    .toFile(resizedImagePath);

                images.push(file.filename);
            }
        }

        
        const category = await Category.findOne({ name: products.category });
        if (!category) {
            return res.status(400).json({ error: "Invalid category name" });
        }

        
        const newProduct = new Product({
            productName: products.productName,
            description: products.description,
            brand: products.brand,
            category: category,
            regularPrice: products.regularPrice,
            salePrice: products.salePrice,
            createdOn: new Date(),
            quantity: products.quantity,
            size: products.size,
            color: products.color,
            productImage: images,
            status: "Available",
        });

        await newProduct.save();
        return res.redirect("/admin/addProducts");
    } catch (error) {
        console.error("Error saving product:", error);
        return res.redirect("/admin/pageerror");
    }
};


const getAllProducts = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = req.query.page || 1;
        const limit = 4;


        const productData = await Product.find({}).limit(limit * 1).populate('category','name')
            .skip((page - 1) * limit)
            
            .exec();
        const count = await Product.find({}).countDocuments();

        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isBlocked: false });

        if (category && brand) {
            res.render("products", {
                data: productData,
                currentPage: page,
                totalPage: page,
                totalPages: Math.ceil(count / limit),
                cat: category,
                brand: brand,
            })
        } else {
            res.render("page-404")
        }



    } catch (error) {
        console.log(error)
        res.redirect("/pageerror")
    }
}


const blockProduct=async(req,res)=>{
    try {
        let id=req.query.id;
        await Product.updateOne({id:id},{$set:{isBlocked:true}})
        res.redirect("/admin/products")
    } catch (error) {
        res.redirect("/pageerror ")
    }
}



const unblockProduct=async(req,res)=>{
    try {
        let id=req.query.id
        await Product.updateOne({id:id},{$set:{isBlocked:false}})
        res.redirect("/admin/Products")
        
    } catch (error) {
        res.redirect("/pageerror ")
    }
}


const getEditProduct=async(req,res)=>{
    try {
        const id=req.query.id
        const product=await Product.findOne({_id:id})
        const category=await Category.find({})
        console.log("Cateegory: ", category)
        const brand=await Brand.find({})
        console.log("brand: ", brand)
        res.render("edit-product",{
            product:product,
            cat:category,
            brand:brand,
        })
    } catch (error) {
        res.redirect("/pageerror")
    }
}





// const editProduct=async(req,res)=>{
//     try {
//         const id=req.params.id;
//         const product=await Product.findOne({id:id})  
//         const data=req.body;
//         const existingProduct=await Product.findOne({
//             productName:data.productName,
//             _id:{$ne:id}
//         })

//         if(existingProduct){
//             return res.status(400).json({error:"product with this name already exist. Please try with another name"})
//         }

//         const images=[]

//         if(req.files&&req.fils.length>0){
//             for(let i=0;i<req.files.length;i++){
//                 images.push(req.files[i].filename)
//             }
//         }
//         const updateFields={
//                 productName:data.productName,
//                 description:data.description,
//                 brand:data.brand,
//                 category:product.category,
//                 regularPrice:data.regularPrice,
//                 salePrice:data.salePrice,
//                 quantity:data.quantity,
//                 size:data.size,
//                 color:data.color
//         }
//         if(req.files.length>0){
//             updateFields.$push={productImage:{$each:images}};
//         }
//         await product.findByIdAndUpdate(id,updateFields,{new:true});
//         res.redirect("/admin/Products")

//     } catch (error) {
//         console.error(error);
//         res.redirect("/pageerror")
//     }
// }



// const editProduct = async (req, res) => {
//     try {
//         const id = req.params.id;
//         const product = await Product.findOne({ id: id });
//         const data = req.body;
//         const existingProduct = await Product.findOne({
//             productName: data.productName,
//             _id: { $ne: id }
//         });

//         if (existingProduct) {
//             return res.status(400).json({ error: "Product with this name already exists. Please try with another name." });
//         }

//         const images = [];
//         if (req.files && Array.isArray(req.files) && req.files.length > 0) {
//             for (let i = 0; i < req.files.length; i++) {
//                 images.push(req.files[i].filename);
//             }
//         }

//         const updateFields = {
//             productName: data.productName,
//             description: data.description,
//             brand: data.brand,
//             category: product.category,
//             regularPrice: data.regularPrice,
//             salePrice: data.salePrice,
//             quantity: data.quantity,
//             size: data.size,
//             color: data.color
//         };

//         if (images.length > 0) {
//             updateFields.$push = { productImage: { $each: images } };
//         }

//         await Product.findByIdAndUpdate(id, updateFields, { new: true });
//         res.redirect("/admin/Products");
//     } catch (error) {
//         console.error(error);
//         res.redirect("/pageerror");
//     }
// };


const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Product.findOne({_id: id });

        // Check if product exists
        if (!product) {
            return res.status(404).json({ error: "Product not found." });
        }

        const data = req.body;

        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: { $ne: id }
        });

        if (existingProduct) {
            return res.status(400).json({ error: "Product with this name already exists. Please try with another name." });
        }

        const images = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                images.push(req.files[i].filename);
            }
        }

        const updateFields = {
            productName: data.productName,
            description: data.description,
            brand: data.brand,
            category: product.category, // This is safe now
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
            size: data.size,
            color: data.color
        };

        if (images.length > 0) {
            updateFields.$push = { productImage: { $each: images } };
        }

        await Product.findByIdAndUpdate(id, updateFields, { new: true });
        res.redirect("/admin/Products");
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
};




const deleteSingleImage =async(req,res)=>{
    try {
        const {imageNameToServer,productIdToServer}=req.body
        const product=await Product.findByIdAndUpdate(productIdToServer,{$pull:{productImage:imageNameToServer}})
        const imagePath=path.join("public","uploads","re-image",imageNameToServer);
        if(fs.existsSync(imagePath)){
            await fs.unlinkSync(imagePath);
            console.log(`Image ${imageNameToServer} deleted successfully`)
        }else{
            console.log(`Image ${imageNameToServer} not found`)

        }
        res.send({status:true})
    } catch (error) {
        res.redirect("/pageeroor")
    }
}



module.exports = {
    getProductAddPage,
    addProducts,
    getAllProducts,
    blockProduct,
    unblockProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage

}