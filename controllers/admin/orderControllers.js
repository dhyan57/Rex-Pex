
const User=require('../../models/userSchema')
const Order =require('../../models/orderSchema')
const Product =require('../../models/productSchema')
const Address = require('../../models/addressSchema')
const PDFDocument = require('pdfkit');
const Return = require('../../models/returnSchema')
const Wallet = require('../../models/walletSchema')
const ExcelJS = require('exceljs');

const getAllorders=async (req,res)=>{
    try {
        const limit=5;
        const page=Math.max(1,parseInt(req.query.page)||1)
        const orders=(await Order.find().sort({createdOn:-1}).populate('user').populate('orderedItems.product').limit(limit).skip((page-1)*limit));
        const count=await Order.countDocuments()
        res.render('orders',{orders,totalPages:Math.ceil(count/limit),currentPage:page})
    } catch (error) {
        console.error(error);
        res.redirect('admin/pageerror')
        
    }
}
const updateOrderStatus = async (req, res) => {
    const { orderId, newStatus } = req.body;
    try {
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = newStatus;
        if(order.paymentMethod=='COD' && newStatus=='Delivered'){
            order.paymentStatus='Completed'
        } 
        await order.save();

        res.json({ success: true, message: 'Order status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
};



const getSaleReport=async (req,res)=>{
    try {
        const {page=1,limit=10,startDate,endDate}=req.query;
        const filter={};

        if(startDate||endDate){
            filter.createdOn={};
            if(startDate)filter.createdOn.$gte=new Date(startDate);
            if(endDate)filter.createsOn.$lte=new Date(endDate)
        }

        const orders=await Order.find(filter).populate('user').populate('orderedItems.product').sort({createdOn:-1}).skip((page-1)*limit).limit(parseInt(limit))
        
        const totalSales= await Order.aggregate([{$match:filter},{$group:{_id:null,total:{$sum:'$finalAmount'}}}]);
        const totalDiscount=await Order.aggregate([{$match:filter},{$group:{_id:null,total:{$sum:'$discount'}}}]);
        const uniqueCustomers=await Order.distinct('user',filter);
        const totalOrders=await Order.countDocuments(filter);
        

        res.render('salesReport',{
            orders,
            totalSales:totalSales[0]?.total||0,
            totalDiscount:totalDiscount[0]?.total || 0,
            uniqueCustomers: uniqueCustomers.length,
            count: totalOrders,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalOrders / limit),
            limit: parseInt(limit)
        })




    } catch (error) {
        
    }
}

const getReturnPage= async (req,res)=>{
    try {
        const limit =2;
        
        const page= Math.max(1,parseInt(req.query.page))||0
        const skip= (page-1)/limit
        const returnData=await Return.find().populate('userId').populate('orderId').sort({createdAt:-1}).limit(limit).skip(skip);

        console.log(returnData);
        const count =await Return.countDocuments();
        res.render('returnOrder',{returns:returnData,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        })

    } catch (error) {
        console.error(error);
        res.redirect('/pageeorror')
    }
}
const returnRequest= async (req,res)=>{
    try {
        const status=req.body.status;
        const returnId=req.query.id;

        const returnData = await Return.findById(returnId);
        if(!returnData){
            return res.json({message:'retun id not fount'})

        }
        const orderId=returnData.orderId;
        const userId=returnData.userId;
        const amount=returnData.refundAmount;
        console.log(orderId);

        if(status=='approved'){
            const wallet=await Wallet.findOneAndUpdate({userId},{$inc:{balance:amount},$push:{transactions:{type:'Refund',amount,orderId,description:'Refund for your returned product'}}})
            returnData.returnStatus ='approved';
            await returnData.save();
            await Order.findByIdAndUpdate(orderId,{$set:{status:'Returned'}})

        }else if(status=='rejected'){
            returnData.returnStatus =status;
            await returnData.save();
            await Order.findByIdAndUpdate(orderId,{$set:{status:'Return Requeest'}})

        }else{
            return res.status(400).json({message:'something wend wrong'})
        }
        res.redirect('/admin/getReturnRequest')


    } catch (error) {
        res.redirect('/admin/pageerror')
        
    }
}

const pdfGenerate = async (req, res) => {
    try {
        const { start, end } = req.query;
        const filter = {};

        if (start || end) {
            filter.createdOn = {};
            if (start) filter.createdOn.$gte = new Date(start);
            if (end) filter.createdOn.$lte = new Date(end);
        }

        // Fetch orders with populated fields
        const orders = await Order.find(filter)
            .populate('user')
            .populate('orderedItems.product')
            .lean()  // Convert to plain JavaScript objects
            .exec();

        if (!orders || orders.length === 0) {
            return res.status(404).send('No orders found for the given period.');
        }

        // Calculate totals with null checks
        const totalSales = orders.reduce((sum, order) => sum + (order.finalAmount || 0), 0);
        const totalOrders = orders.length;
        const totalDiscount = orders.reduce((sum, order) => sum + (order.discount || 0), 0);
        const totalCustomers = new Set(
            orders
                .filter(order => order.user && order.user.name)
                .map(order => order.user.name)
        ).size;

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=salesReport.pdf');
        doc.pipe(res);

        // Title
        doc.fontSize(20).font('Helvetica-Bold')
            .text('Sales Report', { align: 'center', underline: true })
            .moveDown(1);

        // Sales Summary
        doc.fontSize(12).font('Helvetica-Bold')
            .text('Sales Summary', { underline: true })
            .font('Helvetica')
            .moveDown(0.5);

        doc.fontSize(10)
            .text(`Generated on: ${new Date().toLocaleDateString()}`)
            .text(`Total Sales: Rs. ${totalSales.toFixed(2)}`)
            .text(`Total Orders: ${totalOrders}`)
            .text(`Total Discount: Rs. ${totalDiscount.toFixed(2)}`)
            .text(`Total Customers: ${totalCustomers}`)
            .moveDown(1);

        // Table Setup
        const headers = ['Sl No', 'User Name', 'Products', 'Quantity', 'Date', 'Discount', 'Final Amount'];
        const columnWidths = [30, 80, 120, 50, 60, 60, 70];
        const ROW_HEIGHT = 50;
        const tableTop = doc.y;

        // Draw table header
        doc.font('Helvetica-Bold').fontSize(10);
        doc.lineWidth(0.5);
        doc.fillColor('#E0E0E0').rect(30, tableTop, 540, ROW_HEIGHT).fill();
        doc.fillColor('black');

        // Header Cells
        let xPos = 30;
        headers.forEach((header, i) => {
            doc.text(header, xPos, tableTop + 10, {
                width: columnWidths[i],
                align: 'center'
            });
            xPos += columnWidths[i];
        });

        // Header Underline
        doc.moveTo(30, tableTop + ROW_HEIGHT)
            .lineTo(570, tableTop + ROW_HEIGHT)
            .stroke();

        // Table Rows
        doc.font('Helvetica').fontSize(9);
        let currentY = tableTop + ROW_HEIGHT;

        // Process each order with error handling
        orders.forEach((order, index) => {
            try {
                // Check for new page
                if (currentY > doc.page.height - 100) {
                    doc.addPage();
                    currentY = 30;
                }

                // Row background
                const rowColor = index % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
                const rowY = currentY;

                doc.fillColor(rowColor)
                    .rect(30, rowY, 540, ROW_HEIGHT)
                    .fill();
                doc.fillColor('black');

                // Calculate total quantity with null check
                const totalQuantity = order.orderedItems
                    ? order.orderedItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
                    : 0;

                // Prepare product details with null checks
                const productDetails = order.orderedItems
                    ? order.orderedItems
                        .filter(item => item && item.product)
                        .map(item => `${item.product?.productName || 'Unknown Product'} (x${item.quantity || 0})`)
                        .join(', ')
                    : 'No products';

                // Reset x position for new row
                xPos = 30;

                // Row data with null checks
                const rowData = [
                    `${index + 1}`,
                    order.user?.name || 'Unknown User',
                    productDetails || 'No products',
                    totalQuantity.toString(),
                    order.createdOn ? new Date(order.createdOn).toLocaleDateString() : 'No date',
                    `Rs. ${(order.discount || 0).toFixed(2)}`,
                    `Rs. ${(order.finalAmount || 0).toFixed(2)}`
                ];

                // Fill row data
                rowData.forEach((data, i) => {
                    doc.text(data, xPos, rowY + 10, {
                        width: columnWidths[i],
                        align: i === 2 ? 'left' : 'center'  // Left align products, center align others
                    });
                    xPos += columnWidths[i];
                });

                currentY += ROW_HEIGHT;

            } catch (err) {
                console.error(`Error processing order ${index + 1}:`, err);
                // Add error row
                xPos = 30;
                doc.fillColor('#FFEBEE').rect(30, currentY, 540, ROW_HEIGHT).fill();
                doc.fillColor('red').text(
                    `Error processing order ${index + 1}`,
                    xPos, currentY + 10,
                    { width: 540, align: 'center' }
                );
                doc.fillColor('black');
                currentY += ROW_HEIGHT;
            }
        });

        // Footer
        doc.fontSize(8)
            .text(
                `Report generated on ${new Date().toLocaleString()}`,
                30,
                doc.page.height - 50,
                { align: 'center' }
            );

        doc.end();

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating PDF',
            error: error.message
        });
    }
};


const excelGenerate = async (req, res) => {
    try {
        const { start, end } = req.query;
        const filter = {};
        
        if (start || end) {
            filter.createdOn = {};
            if (start) filter.createdOn.$gte = new Date(start);
            if (end) filter.createdOn.$lte = new Date(end);
        }

        // Fetch orders with populated fields
        const orders = await Order.find(filter)
            .populate('user')
            .populate('orderedItems.product', 'productName')
            .lean()  // Convert to plain JavaScript objects
            .exec();

        // Calculate totals with null checks
        const totalSales = orders.reduce((sum, order) => sum + (order.finalAmount || 0), 0);
        const totalOrders = orders.length;
        const totalDiscount = orders.reduce((sum, order) => sum + (order.discount || 0), 0);
        const totalCustomers = new Set(
            orders
                .filter(order => order.user && order.user.name)
                .map(order => order.user.name)
        ).size;

        // Create workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        // Define columns
        worksheet.columns = [
            { header: 'Sl No', key: 'Sno', width: 5 },
            { header: 'User Name', key: 'name', width: 15 },
            { header: 'Products', key: 'Product', width: 50 },
            { header: 'Quantity', key: 'Quantity', width: 5 },
            { 
                header: 'Date', 
                key: 'Date', 
                width: 15, 
                style: { 
                    alignment: { horizontal: 'center' },
                    numFmt: 'dd/mm/yyyy'
                } 
            },
            { 
                header: 'Discount Amount', 
                key: 'Discount', 
                width: 12, 
                style: { numFmt: '#,##0.00' }
            },
            { 
                header: 'Final Amount', 
                key: 'Final', 
                width: 12, 
                style: { numFmt: '#,##0.00' }
            },
        ];

        // Add data rows with error handling
        orders.forEach((order, index) => {
            try {
                const productDetails = order.orderedItems
                    .filter(item => item.product && item.product.productName)
                    .map(item => `${item.product.productName || 'Unknown Product'} (x${item.quantity || 0})`)
                    .join(', ') || 'No products';

                const totalQuantity = order.orderedItems
                    .reduce((sum, item) => sum + (item.quantity || 0), 0);

                worksheet.addRow({
                    Sno: index + 1,
                    name: order.user?.name || 'Unknown User',
                    Product: productDetails,
                    Quantity: totalQuantity,
                    Date: order.createdOn || new Date(),
                    Discount: order.discount || 0,
                    Final: order.finalAmount || 0
                });
            } catch (err) {
                console.error(`Error processing order ${index + 1}:`, err);
                // Add row with error indication
                worksheet.addRow({
                    Sno: index + 1,
                    name: 'Error processing order',
                    Product: 'Data error',
                    Quantity: 0,
                    Date: new Date(),
                    Discount: 0,
                    Final: 0
                });
            }
        });

        // Add empty rows
        worksheet.addRow({});
        worksheet.addRow({});

        // Add summary rows
        const summaryRows = [
            { name: 'Total Sales', value: totalSales },
            { name: 'Total Orders', value: totalOrders },
            { name: 'Total Discount', value: totalDiscount },
            { name: 'Total Customers', value: totalCustomers }
        ];

        summaryRows.forEach(({ name, value }) => {
            worksheet.addRow({
                name,
                Product: value,
            });
        });

        // Style improvements
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Set response headers
        res.setHeader(
            'Content-Disposition', 
            'attachment; filename=sales-report.xlsx'
        );
        res.setHeader(
            'Content-Type', 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        // Write workbook to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Excel generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating Excel file',
            error: error.message
        });
    }
};



const getSaleReportFilter=async (req, res) => {
    const { dateRange, startDate, endDate ,page=1,limit=10} = req.query;
    const filter = {};

    // Date range logic
    if (startDate || endDate) {
        filter.createdOn = {};
        if (startDate) filter.createdOn.$gte = new Date(startDate);
        if (endDate) filter.createdOn.$lte = new Date(endDate);
    } else if (dateRange) {
        const today = new Date();
        if (dateRange === 'today') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            filter.createdOn = { $gte: startOfDay, $lt: endOfDay };
        } else if (dateRange === 'week') {
            filter.createdOn = { $gte: new Date(today.setDate(today.getDate() - 7)) };
        } else if (dateRange === 'month') {
            filter.createdOn = { $gte: new Date(today.setMonth(today.getMonth() - 1)) };
        } else if (dateRange === 'year') {
            filter.createdOn = { $gte: new Date(today.setFullYear(today.getFullYear() - 1)) };
        }
    }

    // Fetch orders based on the filter
    const skip = (page - 1) * limit;
    const orders = await Order.find(filter).sort({createdOn:-1})
        .populate('user orderedItems.product')
        .skip(skip)
        .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({ orders, totalPages });
}




const  getOrderDetail= async (req,res)=>{
    try {
        const orderId=req.query.id;
        const order= await Order.findById(orderId)
        
        const user=await User.findById(order.user);
        
        
        const address=await Address.findOne({'address._id':order.address},{'address.$':1})
        const products=await Promise.all(
            order.orderedItems.map(async (item)=>{
                return await Product.findOne({_id:item.product})
            })
        );
        res.render('orderDetails',{order,products,address:address.address[0],user})


    } catch (error) {
        console.error(error);
        res.redirect('/pageNotFound')
        
    }
}



// const getSalesReport = async (req,res) => {
//     try {
//         const page= (req.query.page) || 1;
//         const limit = 10;
//         const skip = (page-1)*limit;
//         const orderData = await Order.find().populate("userId").populate("orderedItems.product").sort({createdOn:-1}).skip(skip).limit(limit);
//         console.log(orderData)
//         const count = await Order.countDocuments();
//         const totalPages =Math.ceil(count/limit);
//         if(orderData){
//             res.render("salesreport",{orders:orderData,activePage:"sales-report",count:count,totalPages,page})
//         }
//     } catch (error) {
//         console.log(error)
//     }
// }







module.exports={
    getReturnPage,
    getAllorders,
    updateOrderStatus,   
    getSaleReport,
    returnRequest,
    pdfGenerate,
    excelGenerate,
    getSaleReportFilter,
    getOrderDetail

}

