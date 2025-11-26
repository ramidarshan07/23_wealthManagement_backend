const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Payment method name is required'],
        trim: true,
        unique: true,
        minlength: [2, 'Payment method name must be at least 2 characters'],
        maxlength: [50, 'Payment method name cannot exceed 50 characters']
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);

