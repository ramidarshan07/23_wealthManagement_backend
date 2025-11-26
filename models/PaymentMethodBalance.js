const mongoose = require('mongoose');

const paymentMethodBalanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentMethodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentMethod',
        required: true
    },
    balance: {
        type: Number,
        default: 0,
        required: true
    }
}, {
    timestamps: true
});

// Compound index to ensure one balance per user per payment method
paymentMethodBalanceSchema.index({ userId: 1, paymentMethodId: 1 }, { unique: true });

module.exports = mongoose.model('PaymentMethodBalance', paymentMethodBalanceSchema);

