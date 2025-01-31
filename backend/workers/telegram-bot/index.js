require("dotenv").config();
const axios = require("axios");
const express = require("express");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

// Load environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const PORT = process.env.PORT || 4000;

// Initialize Express server
const app = express();
app.use(express.json());

// Logger configuration
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: "logs/telegram-bot-%DATE%.log",
      datePattern: "YYYY-MM-DD-HH",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "24h",
    }),
    new winston.transports.Console(),
  ],
});

// Function to send message to Telegram
async function sendTelegramMessage(message) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: `📢 *Alert* 📢\n\n${message}`,
      parse_mode: "Markdown",
    };

    const response = await axios.post(url, payload);
    logger.info("✅ Telegram message sent successfully:", response.data);
  } catch (error) {
    logger.error("❌ Failed to send Telegram message:", error.message);
  }
}

// API Endpoint for workers to send alerts
app.post("/send-alert", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Directly send message to Telegram
    await sendTelegramMessage(message);
    logger.info("Message sent directly to Telegram:", message);
    res.json({ success: true, message: "Alert sent successfully." });
  } catch (error) {
    logger.error("Error in /send-alert endpoint:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/health", async (req, res) => {
  try {
    const testMessage = "✅ Health Check: Telegram Bot Worker is operational!";
    await sendTelegramMessage(testMessage);

    res.json({ success: true, message: "Telegram bot is working properly." });
  } catch (error) {
    logger.error("❌ Health check failed:", error.message);
    res.status(500).json({ error: "Telegram bot is not working properly." });
  }
});

// Start Express server
app.listen(PORT, () => {
  logger.info(`🚀 Telegram Bot Worker running on port ${PORT}`);
});
