const botService = require("../services/botService");
const aiService = require("../services/aiService");
const transcriptStore = require("../utils/transcriptStore");

exports.startBot = async (req, res) => {
  const { meetLink } = req.body;

  try {
    await botService.start(meetLink);
    res.json({ message: "Bot started" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.stopBot = async (req, res) => {
  try {
    await botService.stop();
    res.json({ message: "Bot stopped" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTranscript = (req, res) => {
  res.json({ transcript: transcriptStore.getTranscript() });
};

exports.summarize = async (req, res) => {
  try {
    const transcript = transcriptStore.getTranscript();
    const summary = await aiService.summarize(transcript);

    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};