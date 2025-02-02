import { supabase } from "./config.js";

export async function addToUSDCTxn(transaction, note, status = "failed", type) {
  try {
    await supabase.from("usdc_txns").insert([
      {
        hash: transaction.transaction.signatures[0],
        timestamp: new Date(transaction.blockTime * 1000).toISOString(),
        rawdata: transaction,
        note,
        status,
        chain: "Solana",
        createdAt: new Date().toISOString(),
        wallet_address: transaction.transaction.message.accountKeys[0],
        type,
      },
    ]);
    console.log(`✅ Successfully archived transaction`);
  } catch (error) {
    console.error(`❌ Failed to archive transaction: ${error.message}`);
    throw error;
  }
}

export async function addToTokenTxn(transaction, note, status) {
  try {
    await supabase.from("token_txns").insert([
      {
        hash: transaction.transaction.signatures[0],
        timestamp: new Date(transaction.blockTime * 1000).toISOString(),
        rawdata: transaction,
        note,
        status,
        chain: "Solana",
        createdAt: new Date().toISOString(),
        wallet_address: transaction.transaction.message.accountKeys[0],
      },
    ]);
    console.log(`✅ Successfully archived token transaction`);
  } catch (error) {
    console.error(`❌ Failed to archive token transaction: ${error.message}`);
    throw error;
  }
}

export async function getUserId(walletAddress) {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (error || !data) {
    console.warn(
      `⚠️ User not found for wallet address: ${walletAddress}, using default ID: 404`
    );
    return 404;
  }
  return data.id;
}

export async function getShareDetails(tokenMintAddress) {
  const { data, error } = await supabase
    .from("shares")
    .select("id, in_USD")
    .eq("contract_solana", tokenMintAddress)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Invalid token mint address, no matching share found.");
  }

  return { shareId: data.id, pricePerShare: data.in_USD };
}

export async function insertTransaction(transactionData) {
  const { error } = await supabase
    .from("transactions")
    .insert([transactionData]);

  if (error) {
    console.error(`❌ Failed to store transaction: ${error.message}`);
    throw new Error("Failed to store transaction in database.");
  }
}

export async function addMessageToQueue(payload) {
  const { data, error } = await supabase.schema("pgmq_public").rpc("send", {
    queue_name: "solana_transactions", // Your queue name
    message: payload, // Message payload
    sleep_seconds: 0, // Optional delay before the message is visible
  });

  if (error) {
    console.error("Error adding message to queue:", error);
    return false;
  }

  console.log("Message added to queue successfully:", data);
  return true;
}

export async function getUSDCBalanceFromSysConfig(listenAddress) {
  const { data, error } = await supabase
    .from("system_config")
    .select("value")
    .eq("key", listenAddress)
    .single();

  if (error) {
    console.error("Error fetching USDC balance:", error);
    return;
  }

  console.log("USDC balance fetched successfully:", data);
  return data.value;
}
