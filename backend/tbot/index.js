require("dotenv").config();
const axios = require("axios");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTestMessage() {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: "✅ *Stock Alert Bot Connected!* 🚀\n\nThis is a test message.",
      parse_mode: "Markdown",
    };

    const response = await axios.post(url, payload);
    console.log("✅ Telegram message sent:", response.data);
  } catch (error) {
    console.error("❌ Failed to send Telegram message:", error.message);
  }
}

sendTestMessage();
