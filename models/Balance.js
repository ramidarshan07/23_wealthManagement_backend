const mongoose = require('mongoose');

const balanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    currentBalance: {
        type: Number,
        default: 0,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Balance', balanceSchema);

