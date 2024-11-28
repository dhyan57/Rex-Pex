const mongoose = require('mongoose'); // Import mongoose

const { Schema } = mongoose; // Destructure Schema from mongoose

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: { // Fixed typo in "description"
        type: String,
        required: true, // Added "true" to the required field
    },
    isListed: {
        type: Boolean,
        default: false, // Use false instead of 0 for clarity
    },
    categoryOffer: {
        type: Number,
        default: 0,
    },
    createdAt: { // Fixed typo in "createAt"
        type: Date,
        default: Date.now, // Use `Date.now` instead of `Date.new`
    },
});

const Category = mongoose.model('Category', categorySchema); // Fixed typo in "mongoose"
module.exports = Category;
