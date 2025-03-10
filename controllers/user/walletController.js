const Wallet=require('../../models/walletSchema')
const env = require('dotenv').config()
const crypto = require('crypto');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const loadWallet = async (req, res) => {
    try {
        const userId = req.session.user; // Logged-in user ID
        if (!userId) {
            return res.redirect('/login');
        }

        // Pagination setup
        const page = parseInt(req.query.page) || 1; // Current page (default is 1)
        const limit = parseInt(req.query.limit) || 5; // Number of transactions per page
        const skip = (page - 1) * limit;

        // Fetch wallet details
        const wallet = await Wallet.findOne({ userId }).sort({createdAt:-1}).populate('transactions.orderId').lean();

        if (!wallet) {
            return res.render('wallet', {
                balance: 0,
                transactions: [],
                currentPage: page,
                totalPages: 0,
                limit,
                keyId:process.env.RAZORPAY_KEY_ID

            });
        }

        // Pagination logic
        const totalTransactions = wallet.transactions.length; // Total transactions
        const paginatedTransactions = wallet.transactions
            .slice()
            .reverse()
            .slice(skip, skip + limit); // Apply skip and limit

        const totalPages = Math.ceil(totalTransactions / limit); // Total pages

        // Render the wallet page with paginated data
        res.render('wallet', {
            balance: wallet.balance || 0,
            transactions: paginatedTransactions,
            currentPage: page,
            totalPages,
            limit,
            keyId:process.env.RAZORPAY_KEY_ID,
            user:userId
        });
    } catch (error) {
        console.error('Error loading wallet page:', error);
        res.redirect('/pageNotFound');
    }
};


const createWallet = async (req, res) => {
    try {
        const amount = req.body.amount * 100;  // Convert to paise
        const options = {
            amount: amount,
            currency: "INR",
            receipt: "order_rcptid_11", // Use dynamic receipt id
            payment_capture: 1
        };

        razorpay.orders.create(options, (err, order) => {
            if (err) {
                return res.status(500).json({ message: 'Error creating order', error: err });
            }
            // Save the amount to session or pass it to the front end
            req.session.amount = amount;  // Store amount in session (you can use other ways to store it)
            res.json({ orderId: order.id, amount: order.amount });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error creating order', error: error });
    }
}


const verifyWallet = async (req, res) => {
    try {
        const { paymentId, orderId, signature } = req.body;
        
        const userId = req.session.user._id;
        const amount = req.session.amount/100;  // Retrieve the stored amoun
        console.log(userId)

        // Generate the HMAC signature for verification
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(orderId + "|" + paymentId);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature === signature) {

            // Prepare the transaction object
            const transaction = {
                type: 'Deposit',
                amount: amount,
                status: 'Completed',
                date: new Date()
            };

            // Update wallet balance and transactions
            Wallet.findOneAndUpdate(
                { userId },
                {
                    $inc: { balance: amount }, // Increment the balance
                    $push: { transactions: transaction } // Add transaction to array
                },{
                    upsert: true,
                    new: true
                }
            )
                .then(() => {
                    req.session.amount = null; // Clear the session amount after success
                    res.status(200).send({ message: 'Payment successful' });
                })
                .catch((err) => {
                    res.status(500).send({ message: 'Error updating wallet', error: err });
                });
        } else {
            res.status(400).send({ message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Step 8: Unexpected error occurred:', error);
        res.status(500).send({ message: 'Error verifying payment', error: error });
    }
};




module.exports={
    loadWallet,
    verifyWallet,
    createWallet
}