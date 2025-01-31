const functions = require("@google-cloud/functions-framework");
const axios = require("axios");

const SOLANA_RPC_URL = "https://api.devnet.solana.com";

// 🔍 Fetch Transaction Details from Solana RPC
async function fetchTransaction(signature) {
  console.log(`📡 Querying Solana RPC for transaction: ${signature}`);

  try {
    const response = await axios.post(SOLANA_RPC_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "getTransaction",
      params: [signature, "json"],
    });

    console.log(
      "📜 Raw Transaction Response:",
      JSON.stringify(response.data, null, 2)
    );

    return response.data.result;
  } catch (error) {
    console.error("❌ Error fetching transaction:", error.message);
    throw new Error("Failed to fetch transaction from Solana RPC.");
  }
}

// 📌 Process Transaction Endpoint
functions.http("processTransaction", async (req, res) => {
  console.log("🔥 Received transaction processing request");

  try {
    const { signature } = req.body;
    if (!signature) {
      console.error("❌ Error: Missing transaction signature.");
      return res
        .status(400)
        .json({ error: "Transaction signature is required." });
    }

    const transaction = await fetchTransaction(signature);
    if (!transaction) {
      console.error("❌ Transaction not found.");
      return res.status(404).json({ error: "Transaction not found." });
    }

    if (transaction.meta.err !== null) {
      console.log("Meta.err is not null. Some error occured");
      res.status(402).json({ error: "Transaction failed with an error" });
    }

    // ⏳ Extract Timestamp
    const blockTime = transaction.blockTime
      ? new Date(transaction.blockTime * 1000).toISOString()
      : "Unknown";
    console.log(`🕒 Block Time: ${blockTime}`);

    // 🔢 Slot (Block Number)
    const slot = transaction.slot || "Unknown";
    console.log(`📌 Slot (Block Number): ${slot}`);

    // 💰 Transaction Fee
    const fee = transaction.meta?.fee || 0;
    console.log(`💸 Fee: ${fee}`);

    // 📤 Sender & 📥 Receiver
    const sender = transaction.transaction.message.accountKeys[0]; // Sender
    const receiver = transaction.meta?.postTokenBalances[0]?.owner || "Unknown";
    console.log(`📤 From: ${sender}`);
    console.log(`📥 To: ${receiver}`);

    // 🔗 Smart Contract Address
    const contractAddress =
      transaction.meta?.postTokenBalances[1]?.mint || "Unknown";
    console.log(`🔗 Contract Address: ${contractAddress}`);

    // 🏷️ Token Mint Address
    const tokenMintAddress =
      transaction.meta?.preTokenBalances[0]?.mint || "Unknown";
    console.log(`🏷️ Token Mint Address: ${tokenMintAddress}`);

    // 📈 Confirmations (Placeholder - Use WebSocket for real-time)
    const confirmations = "N/A"; // Solana RPC does not directly provide confirmations
    console.log(`✅ Confirmations: ${confirmations}`);

    // 🔍 Determine Transaction Type (Transfer, Mint, Burn)
    let transactionType = "Unknown";
    if (
      transaction.meta?.logMessages.some((log) =>
        log.includes("TransferChecked")
      )
    ) {
      transactionType = "Transfer";
    } else if (
      transaction.meta?.logMessages.some((log) => log.includes("Mint"))
    ) {
      transactionType = "Mint";
    } else if ( 
      transaction.meta?.logMessages.some((log) => log.includes("Burn"))
    ) {
      transactionType = "Burn";
    }
    console.log(`🔄 Transaction Type: ${transactionType}`);

    // 💵 Correctly Calculate Amount Transferred
    const preBalance =
      transaction.meta?.preTokenBalances[0]?.uiTokenAmount.uiAmount || 0;
    const postBalance =
      transaction.meta?.postTokenBalances[0]?.uiTokenAmount.uiAmount || 0;
    const amountTransferred = postBalance - preBalance;
    console.log(`💵 Amount Transferred: ${amountTransferred}`);

    console.log(`✅ Transaction processed successfully: ${signature}`);

    return res.status(200).json({
      signature,
      sender,
      receiver,
      amountTransferred,
      fee,
      contractAddress,
      tokenMintAddress,
      blockTime,
      slot,
      confirmations,
      transactionType,
    });
  } catch (error) {
    console.error("❌ Error processing transaction:", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ✅ Health Check Endpoint
functions.http("healthCheck", (req, res) => {
  console.log("🟢 Health check successful.");
  res.send("OK");
});
