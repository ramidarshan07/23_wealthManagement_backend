const express = require("express");
const SnakeGame = require("../models/SnakeGame");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Get user's high scores
router.get("/highscores", authenticate, async (req, res) => {
  try {
    let gameData = await SnakeGame.findOne({ userId: req.user._id });
    if (!gameData) {
      gameData = await SnakeGame.create({ userId: req.user._id });
    }
    res.json({ success: true, highScores: gameData.highScores });
  } catch (error) {
    console.error("Error fetching snake high scores:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update user's high score for a specific difficulty
router.post("/highscore", authenticate, async (req, res) => {
  try {
    const { score, difficulty } = req.body;
    let gameData = await SnakeGame.findOne({ userId: req.user._id });

    if (!gameData) {
      gameData = new SnakeGame({ userId: req.user._id });
      gameData.highScores[difficulty] = score;
    } else {
      if (score > (gameData.highScores[difficulty] || 0)) {
        gameData.highScores[difficulty] = score;
      }
    }
    
    // Mark the difficulty field as modified so Mongoose saves it (since it's a nested object)
    gameData.markModified('highScores');
    gameData.lastPlayed = Date.now();
    await gameData.save();

    res.json({ success: true, highScores: gameData.highScores });
  } catch (error) {
    console.error("Error updating snake high score:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
