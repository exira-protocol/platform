require("dotenv").config();
const axios = require("axios");
const express = require("express");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const { createClient } = require("redis");

// Load environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
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

// Initialize Redis client
const redisClient = createClient({ url: REDIS_URL });
redisClient.on("error", (err) => logger.error("Redis Error:", err));

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    logger.info("Connected to Redis successfully.");
  } catch (error) {
    logger.error("Redis connection failed:", error);
    process.exit(1);
  }
})();

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

    // Push message to Redis queue
    await redisClient.rPush("telegram_alerts", message);
    logger.info("Message added to Redis queue:", message);
    res.json({ success: true, message: "Alert queued successfully." });
  } catch (error) {
    logger.error("Error in /send-alert endpoint:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Worker to process the Redis queue and send messages
async function processQueue() {
  while (true) {
    try {
      const message = await redisClient.lPop("telegram_alerts");
      if (message) {
        logger.info("Processing alert from queue:", message);
        await sendTelegramMessage(message);
      }
    } catch (error) {
      logger.error("Error processing message queue:", error.message);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Poll every 5s
  }
}

// Start processing queue in the background
processQueue();

// Start Express server
app.listen(PORT, () => {
  logger.info(`🚀 Telegram Bot Worker running on port ${PORT}`);
});
