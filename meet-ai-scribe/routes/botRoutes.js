const express = require("express");
const router = express.Router();

const {
  startBot,
  stopBot,
  getTranscript,
  summarize
} = require("../controllers/botController");

router.post("/start", startBot);
router.post("/stop", stopBot);
router.get("/transcript", getTranscript);
router.post("/summarize", summarize);

module.exports = router;