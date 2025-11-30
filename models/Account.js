const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: [0, 'Amount must be positive']
    },
    type: {
        type: String,
        enum: ['borrow', 'repay', 'lent', 'received'],
        required: true
    },
    paymentChannel: {
        type: String,
        trim: true,
        default: 'Cash'
    },
    note: {
        type: String,
        trim: true,
        default: ''
    },
    date: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const accountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    accountType: {
        type: String,
        enum: ['borrowed', 'lent'],
        default: 'borrowed'
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    },
    transactions: {
        type: [transactionSchema],
        default: []
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Account', accountSchema);


