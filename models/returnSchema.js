    const mongoose = require('mongoose');
    const { Schema } = mongoose;

    const returnSchema = new Schema(
    {
        userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
        },
        orderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Order'
        },
        reason: {
        type: String,
        required: true,
        trim: true
        },
        refundAmount: {
        type: Number,
        default: 0
        },
        returnStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
        }
    },
    { timestamps: true } 
    );

    const Return = mongoose.model('Return', returnSchema);
    module.exports = Return;