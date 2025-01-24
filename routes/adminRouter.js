const express= require("express")
const router = express.Router()
const AdminController = require('../controllers/admin/adminContrllers')
const {userAuth,adminAuth}=require("../middlewares/auth")
const customerController = require("../controllers/admin/customerController")
const categoryController = require('../controllers/admin/categoryController');
const brandController=require("../controllers/admin/brandController")
const productController=require("../controllers/admin/productController")
const orderControllers=require("../controllers/admin/orderControllers")  
const couponControllers=require("../controllers/admin/couponController")
const multer=require("multer")
const storage=require("../helpers/multer")
const Product = require("../models/productSchema")
const uploads=multer({storage:storage})

//Error Management
router.get('/pageerror',AdminController.pageerror)
//Login Management
router.get('/login',AdminController.loginPage)
router.post('/login',AdminController.login)
router.get('/dashboard',adminAuth,AdminController.loadDashboard)
router.get('/logout',AdminController.logout)

//customer Management
router.get("/users", adminAuth, customerController.customerInfo);
router.get("/blockCustomer", adminAuth, customerController.customerBlocked);
router.get("/unblockCustomer", adminAuth, customerController.customerunBlocked);

//category Management
router.get("/category",adminAuth,categoryController.categoryInfo);
router.post("/addCategory",adminAuth,categoryController.addCategory);
router.post("/addCategoryOffer",adminAuth,categoryController.addCategoryOffer)
router.post("/removeCategoryOffer",adminAuth,categoryController.removeCategoryOffer)
router.post("/listCategory", adminAuth, categoryController.getListCategory);
router.post("/unlistCategory", adminAuth, categoryController.getUnlistCategory);
router.get("/editCategory", adminAuth, categoryController.getEditCategory);
router.post("/editCategory", adminAuth, categoryController.editCategory);

//Brand Management
router.get("/brands",brandController.getBrandPage)
router.post("/addBrand",uploads.single("image"),brandController.addBrand)
router.get("/blockBrand",adminAuth,brandController.blockBrand)
router.get("/unBlockBrand",adminAuth,brandController.unBlockBrand)
router.get("/deleteBrand",adminAuth,brandController.deleteBrand)

//products Management
router.get("/addProducts",adminAuth,productController.getProductAddPage)
router.post("/addProducts",adminAuth,uploads.array("images", 4),productController.addProducts);
router.get("/products", adminAuth, productController.getAllProducts);
router.get("/blockProduct",adminAuth,productController.blockProduct)
router.get("/unblockProduct",adminAuth,productController.unblockProduct)
router.get("/editProduct",adminAuth,productController.getEditProduct)
router.post("/editProduct/:id",adminAuth,uploads.array("images", 4),productController.editProduct)
router.post("/deleteImage",adminAuth,productController.deleteSingleImage)
router.post('/addProductOffer',adminAuth,productController.addProductOffer);
router.post('/removeProductOffer',adminAuth,productController.removeProductOffer);


router.get('/stockManagement',productController.getStocks)
router.post('/update-stock',productController.updateStock)



//order mamagement
router.get('/orders',adminAuth,orderControllers.getAllorders)
router.post('/update-order-status',orderControllers.updateOrderStatus);
router.get('/getReturnRequest',adminAuth,orderControllers.getReturnPage)
router.post('/returnDataUpdate',adminAuth,orderControllers.returnRequest);
router.get('/orderDetails',orderControllers.getOrderDetail)



// coupon manegement 
router.get('/add-coupon',couponControllers.getCoupon)
router.post('/add-coupon',couponControllers.addCoupon)
router.get('/delete-coupon/:id',couponControllers.deleteCoupon)



//slese report

router.get('/salesReportPDF',orderControllers.pdfGenerate)
router.get('/salesReportExcel',orderControllers.excelGenerate)
router.get('/saleReport',orderControllers.getSaleReport)
router.get('/saleReport',orderControllers.getSaleReport)
router.get('/filterSales',orderControllers.getSaleReportFilter)
router.get('/salesReportPDF',orderControllers.pdfGenerate)
router.get('/salesReportExcel',orderControllers.excelGenerate)



// router.get("/salesReport",orderControllers.getSalesReport)





module.exports = router 





