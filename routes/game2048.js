const express = require("express");
const Game2048 = require("../models/Game2048");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Get user's high score
router.get("/highscore", authenticate, async (req, res) => {
  try {
    let gameData = await Game2048.findOne({ userId: req.user._id });
    if (!gameData) {
      gameData = await Game2048.create({ userId: req.user._id, highScore: 0 });
    }
    res.json({ success: true, highScore: gameData.highScore });
  } catch (error) {
    console.error("Error fetching high score:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update user's high score
router.post("/highscore", authenticate, async (req, res) => {
  try {
    const { score } = req.body;
    let gameData = await Game2048.findOne({ userId: req.user._id });

    if (!gameData) {
      gameData = new Game2048({ userId: req.user._id, highScore: score });
    } else {
      if (score > gameData.highScore) {
        gameData.highScore = score;
      }
    }
    gameData.lastPlayed = Date.now();
    await gameData.save();

    res.json({ success: true, highScore: gameData.highScore });
  } catch (error) {
    console.error("Error updating high score:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
