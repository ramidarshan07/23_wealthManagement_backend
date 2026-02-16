const mongoose = require("mongoose");

const SnakeGameSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  highScores: {
    120: { type: Number, default: 0 }, // Easy
    80: { type: Number, default: 0 },  // Medium
    50: { type: Number, default: 0 },  // Hard
    30: { type: Number, default: 0 },  // Extreme
  },
  lastPlayed: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SnakeGame", SnakeGameSchema);
