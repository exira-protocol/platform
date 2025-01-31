dotenv.config();

export async function sendAlert(message) {
  try {
    const response = await axios.post(process.env.TELEGRAM_WORKER_URL, {
      message: message,
    });

    console.log("✅ Alert sent successfully:", response.data);
  } catch (error) {
    console.error("❌ Failed to send alert:", error.message);
  }
}
