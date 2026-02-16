const mongoose = require("mongoose");

const Game2048Schema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  highScore: {
    type: Number,
    default: 0,
  },
  lastPlayed: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Game2048", Game2048Schema);
