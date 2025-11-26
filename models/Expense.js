const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be positive']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    paymentMethod: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentMethod',
        required: [true, 'Payment method is required']
    },
    amountType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AmountType',
        required: [true, 'Amount type is required']
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

// Index for efficient queries
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });
expenseSchema.index({ userId: 1, paymentMethod: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
