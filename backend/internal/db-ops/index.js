import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchUserPortfolio(wallet_address) {
  const { data, error } = await supabase
    .from("user_portfolio_mv") // Materialized View
    .select("*")
    .eq("wallet_address", wallet_address); // Filter by wallet address if needed

  if (error) {
    console.error("Error fetching user portfolio:", error);
    return null;
  }

  console.log("User Portfolio Data:", data);
  return data;
}

async function refreshUserPortfolio() {
  let address = "6QmJgL1jjS8mNoj6ZHTxvsfMU1ZPV5tMQaDbFyRz7yb1";
  const response = await supabase.rpc("refresh_user_portfolio_mv_incremental", {
    wallet_address: address,
  });
  console.log("Refresh User Portfolio Response:", response);
}

// fetchUserPortfolio("");
refreshUserPortfolio();
