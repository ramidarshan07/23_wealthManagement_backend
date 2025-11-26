const mongoose = require('mongoose');

const amountTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Amount type name is required'],
        trim: true,
        unique: true,
        minlength: [2, 'Amount type name must be at least 2 characters'],
        maxlength: [50, 'Amount type name cannot exceed 50 characters']
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AmountType', amountTypeSchema);

