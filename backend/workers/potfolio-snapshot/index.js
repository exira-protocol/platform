import { createClient } from "@supabase/supabase-js";
import cron from "node-cron";
import dotenv from "dotenv";

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to take portfolio snapshots
const takePortfolioSnapshot = async () => {
  console.log("📸 Starting portfolio snapshot process...");

  try {
    // Fetch latest portfolio values from user_portfolio_mv
    const { data: userPortfolios, error } = await supabase
      .from("user_portfolio_mv")
      .select("user_id, wallet_address, current_portfolio_value");

    if (error) {
      console.error("❌ Error fetching user portfolios:", error);
      return;
    }

    if (!userPortfolios || userPortfolios.length === 0) {
      console.log("ℹ️ No portfolio data found.");
      return;
    }

    console.log(
      `🔍 Fetched ${userPortfolios.length} user portfolios.`,
      userPortfolios
    );

    // Prepare bulk insert payload
    const timestamp = new Date().toISOString();
    const snapshots = userPortfolios.map((user) => ({
      user_id: user.user_id,
      portfolio_value: user.current_portfolio_value,
      timestamp,
      wallet_address: user.wallet_address,
    }));

    console.log("📦 Snapshot payload:", snapshots);

    // Insert into portfolio_timeseries table
    const { error: insertError } = await supabase
      .from("portfolio_timeseries")
      .insert(snapshots);

    if (insertError) {
      console.error("❌ Error inserting snapshots:", insertError);
    } else {
      console.log(
        `✅ Successfully recorded ${snapshots.length} portfolio snapshots.`
      );
    }
  } catch (err) {
    console.error("⚠️ Unexpected error:", err);
  }
};

// Schedule the worker to run every 30 minutes
// cron.schedule("*/30 * * * *", async () => {
//   await takePortfolioSnapshot();
// });
cron.schedule("*/5 * * * * *", async () => {
  await takePortfolioSnapshot();
});

console.log("🚀 Portfolio snapshot worker started. Running every 30 minutes.");
