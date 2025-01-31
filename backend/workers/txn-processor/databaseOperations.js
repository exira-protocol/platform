import { supabase } from "./config.js";

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

export async function getShareDetails(tokenMintAddress) {
  const { data, error } = await supabase
    .from("shares")
    .select("max_allowance")
    .eq("contract_solana", tokenMintAddress)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Invalid token mint address, no matching share found.");
  }

  return {
    maxAllowance: data.max_allowance,
  };
}

export async function updateMaxAllowance(tokenMintAddress, newMaxAllowance) {
  try {
    await supabase
      .from("shares")
      .update({ max_allowance: newMaxAllowance })
      .eq("contract_solana", tokenMintAddress);
    console.log(`✅ Successfully updated max allowance of share`);
  } catch (error) {
    console.error(
      `❌ Failed to update max allowance of share: ${error.message}`
    );
    throw error;
  }
}

export async function updateUSDCBalance(key, newBalance) {
  const { data, error } = await supabase
    .from("system_config")
    .upsert([{ key: key, value: newBalance.toString() }]);

  if (error) {
    console.error("Error updating USDCBalance:", error);
    return false;
  }
  console.log("USDCBalance updated successfully:", data);
  return true;
}