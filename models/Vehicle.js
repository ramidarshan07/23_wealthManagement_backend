const mongoose = require('mongoose');

const vehicleLogSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    fuelAmount: {
        type: Number,
        required: true
    },
    fuelCapacity: {
        type: Number,
        required: true
    },
    km: {
        type: Number,
        required: true
    },
    tripA: {
        type: Number,
        required: true
    },
    tripB: {
        type: Number,
        required: true
    },
    average: {
        type: Number,
        required: true
    },
    range: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const vehicleSchema = new mongoose.Schema({
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
    number: {
        type: String,
        required: true,
        trim: true
    },
    purchaseDate: {
        type: Date,
        required: true
    },
    logs: {
        type: [vehicleLogSchema],
        default: []
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
