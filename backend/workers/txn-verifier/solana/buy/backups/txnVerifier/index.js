import {
  mplTokenMetadata,
  TokenStandard,
  transferV1,
} from "@metaplex-foundation/mpl-token-metadata";
import { keypairIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const connection = new Connection("https://api.devnet.solana.com");
const umi = createUmi(connection).use(mplTokenMetadata());

const a1 = "J6GT31oStsR1pns4t6P7fs3ARFNo9DCoYjANuNJVDyvN";
const a1PKey =
  "4ciGA36faeNiPRghC4orxhPDh3GcFx9BnMHHT9gFZfR7btyr9kMFqrDgNEP8XE28ta5AkucCS2LUGzUaW3udeNge";
const mintSignerPublicKey = "53XrQrcaY6wb8T3YPByY3MMP5EEZJQRaXqnYznBgvMmX";
const tokenAccount = "3yFiRp3jh3vUrfJiRmB71kqTfnccVpmkgQsoGnnN3JdV";

const keypair = Keypair.fromSecretKey(bs58.decode(a1PKey));
umi.use(keypairIdentity(keypair));

// ========================================
const functions = require("@google-cloud/functions-framework");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

// 🔗 Supabase Configuration
const SUPABASE_URL = "https://ojmwlspqbvzqpdnmgjel.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbXdsc3BxYnZ6cXBkbm1namVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzEzMjE5NSwiZXhwIjoyMDUyNzA4MTk1fQ.3JTVmxVjMXIxplQV1uj-kNgEdKa58hO-eEmh_ttX138"; // Securely store this in production
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("🔗 Initialized Supabase client");

const SOLANA_RPC_URL = "https://api.devnet.solana.com";

// 🎯 Approved Receiver Addresses & Corresponding Share IDs
const APPROVED_RECEIVERS = {
  J6GT31oStsR1pns4t6P7fs3ARFNo9DCoYjANuNJVDyvN: 2,
  DiaUrAaTkuftHRkEJePworE2uT9ZhcFi1WqkAx53UxHv: 3,
  Ez1Y8ygX8TRwCbDEnu3r24hrjuDvxxy6qc15EKQgPvD5: 4,
};

// 🎯 Approved Token Mint Address
const APPROVED_TOKEN_MINT = "53XrQrcaY6wb8T3YPByY3MMP5EEZJQRaXqnYznBgvMmX";

// 🔍 Fetch Transaction from Solana RPC
async function fetchTransaction(signature) {
  console.log(`🔍 Fetching transaction with signature: ${signature}`);
  const maxRetries = 3;
  const retryInterval = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt} to fetch transaction...`);

      const response = await axios.post(SOLANA_RPC_URL, {
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [signature, "json"],
      });

      if (response.data.result) {
        console.log(
          `✅ Successfully fetched transaction data on attempt ${attempt} for signature: ${signature}`
        );
        return response.data.result;
      } else {
        console.warn(
          `⚠️ Transaction not found on attempt ${attempt}. Retrying in ${
            retryInterval / 1000
          } seconds...`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error fetching transaction (Attempt ${attempt}): ${error.message}`
      );
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryInterval)); // Wait before retrying
    }
  }

  console.error(`🚨 Failed to fetch transaction after ${maxRetries} attempts.`);
  throw new Error(
    "Failed to fetch transaction from Solana RPC after multiple retries."
  );
}

// 🚨 Archive Transaction with Error Note
async function addToUSDCTxn(transaction, note) {
  console.log(
    `🚨 Archiving failed transaction: ${transaction.transaction.signatures[0]}`
  );
  console.log(`📝 Archive note: ${note}`);

  try {
    await supabase.from("usdc_txns").insert([
      {
        hash: transaction.transaction.signatures[0],
        timestamp: new Date(transaction.blockTime * 1000).toISOString(),
        rawdata: transaction,
        note,
        status: "failed",
        chain: "Solana",
        createdAt: new Date().toISOString(),
        wallet_address: transaction.transaction.message.accountKeys[0], // Sender
      },
    ]);
    console.log(`✅ Successfully archived transaction`);
  } catch (error) {
    console.error(`❌ Failed to archive transaction: ${error.message}`);
    throw error;
  }
}

// 🛑 Validate `meta.err`
async function validateMetaErr(transaction) {
  console.log(`🔍 Validating transaction meta.err`);
  if (transaction.meta.err !== null) {
    console.warn(
      `⚠️ Transaction meta.err detected: ${JSON.stringify(
        transaction.meta.err
      )}`
    );
    await addToUSDCTxn(transaction, "Transaction failed due to meta.err.");
    throw new Error("Transaction failed with an error.");
  }
  console.log(`✅ Transaction meta.err validation passed`);
}

// 🕒 Validate Transaction Timestamp
async function validateTransactionTime(transaction) {
  console.log(`🕒 Validating transaction timestamp`);
  const txnTime = transaction.blockTime * 1000;
  const currentTime = Date.now();
  const timeDiff = currentTime - txnTime;

  console.log(`📊 Transaction time: ${new Date(txnTime).toISOString()}`);
  console.log(`📊 Current time: ${new Date(currentTime).toISOString()}`);
  console.log(`📊 Time difference: ${timeDiff}ms`);

  if (timeDiff > 60 * 1000) {
    console.warn(`⚠️ Transaction too old: ${timeDiff}ms > 60000ms`);
    await addToUSDCTxn(transaction, "Transaction is more than 1 minute old.");
    throw new Error("Transaction is too old and cannot be processed.");
  }
  console.log(`✅ Transaction timestamp validation passed`);
}

// 🔄 Determine Transaction Type
async function determineTransactionType(sender, receiver, transaction) {
  console.log(`🔄 Determining transaction type`);
  console.log(`📊 Sender: ${sender}`);
  console.log(`📊 Receiver: ${receiver}`);

  if (APPROVED_RECEIVERS.hasOwnProperty(sender)) {
    console.log(`✅ Identified as Sell transaction - sender is approved`);
    return "Sell";
  } else if (APPROVED_RECEIVERS.hasOwnProperty(receiver)) {
    console.log(`✅ Identified as Buy transaction - receiver is approved`);
    return "Buy";
  } else {
    console.warn(
      `⚠️ Invalid transaction - neither sender nor receiver is approved`
    );
    await addToUSDCTxn(
      transaction,
      "Invalid transaction: Neither sender nor receiver is approved."
    );
    throw new Error(
      "Transaction rejected: Sender and receiver are both unapproved."
    );
  }
}

// 🔄 Validate Duplicate Transaction Hash
async function validateDuplicateHash(transaction) {
  const txnHash = transaction.transaction.signatures[0];
  console.log(`🔍 Checking for duplicate transaction hash: ${txnHash}`);

  const { data } = await supabase
    .from("usdc_txns")
    .select("hash")
    .eq("hash", txnHash);

  if (data.length > 0) {
    console.warn(`⚠️ Duplicate transaction detected: ${txnHash}`);
    await addToUSDCTxn(transaction, "Duplicate transaction detected.");
    throw new Error("Duplicate transaction found.");
  }
  console.log(`✅ No duplicate transaction found`);
}

// ✅ Validate Token Mint Address
async function validateTokenMintAddress(transaction) {
  const tokenMintAddress =
    transaction.meta?.preTokenBalances[0]?.mint || "Unknown";
  console.log(`🔍 Validating token mint address: ${tokenMintAddress}`);
  console.log(`📊 Expected token mint address: ${APPROVED_TOKEN_MINT}`);

  if (tokenMintAddress !== APPROVED_TOKEN_MINT) {
    console.warn(`⚠️ Invalid token mint address: ${tokenMintAddress}`);
    await addToUSDCTxn(transaction, "Invalid token mint address.");
    throw new Error("Transaction token mint address is not approved.");
  }
  console.log(`✅ Token mint address validation passed`);
}

// ✅ Validate Transaction Structure
function validateTransactionStructure(transaction) {
  console.log(`🔍 Validating transaction structure`);
  try {
    if (!transaction || typeof transaction !== "object") {
      console.error(`❌ Transaction data is invalid or malformed`);
      throw new Error("Transaction data is invalid or malformed.");
    }

    const requiredFields = [
      "transaction",
      "meta",
      "transaction.signatures",
      "transaction.message.accountKeys",
      "meta.postTokenBalances",
      "meta.preTokenBalances",
      "blockTime",
    ];

    for (const field of requiredFields) {
      console.log(`📊 Checking field: ${field}`);
      const parts = field.split(".");
      let value = transaction;
      for (const part of parts) {
        if (!value || !value.hasOwnProperty(part)) {
          console.error(`❌ Missing required field: ${field}`);
          throw new Error(`Missing expected field: ${field}`);
        }
        value = value[part];
      }
    }
    console.log(`✅ Transaction structure validation passed`);
  } catch (error) {
    console.error(
      `❌ Transaction structure validation failed: ${error.message}`
    );
    throw new Error(
      "Transaction structure is invalid. Possible malicious transaction."
    );
  }
}

// 🔍 Get `user_id` from `users` table
async function getUserId(walletAddress) {
  console.log(`🔍 Getting user ID for wallet address: ${walletAddress}`);

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
  console.log(`✅ Found user ID: ${data.id}`);
  return data.id;
}

// 🔍 Get share details
async function getShareDetails(tokenMintAddress) {
  console.log(
    `🔍 Getting share details for token mint address: ${tokenMintAddress}`
  );

  const { data, error } = await supabase
    .from("shares")
    .select("id, price")
    .eq("contract_solana", tokenMintAddress)
    .maybeSingle();

  if (error || !data) {
    console.error(
      `❌ No matching share found for token mint address: ${tokenMintAddress}`
    );
    throw new Error("Invalid token mint address, no matching share found.");
  }

  console.log(`✅ Found share details - ID: ${data.id}, Price: ${data.price}`);
  return { shareId: data.id, pricePerShare: data.price };
}

// 🚨 Validate Amount Transferred
async function validateAmountTransferred(amountTransferred) {
  console.log(`🔍 Validating amount transferred: ${amountTransferred}`);

  if (amountTransferred <= 0) {
    console.error(`❌ Invalid amount transferred: ${amountTransferred}`);
    await addToUSDCTxn(
      transaction,
      "Invalid transaction: Amount transferred must be greater than zero."
    );
    throw new Error(
      "Invalid transaction: Amount transferred must be greater than zero."
    );
  }
  console.log(`✅ Amount transferred validation passed`);
}

// ✅ Validate Receiver Address
async function validateReceiver(transaction) {
  const receiver = transaction.meta?.postTokenBalances[0]?.owner || "Unknown";

  if (!(receiver in APPROVED_RECEIVERS)) {
    await addToUSDCTxn(transaction, "Invalid receiver address.");
    throw new Error("Transaction receiver is not approved.");
  }

  return APPROVED_RECEIVERS[receiver]; // Returns the Share ID
}

async function addToTokenTxn(transaction, note, status) {
  console.log(
    `🚨 Archiving failed transaction: ${transaction.transaction.signatures[0]}`
  );
  console.log(`📝 Archive note: ${note}`);

  try {
    await supabase.from("token_txns").insert([
      {
        hash: transaction.transaction.signatures[0],
        timestamp: new Date(transaction.blockTime * 1000).toISOString(),
        rawdata: transaction,
        note: note,
        status: status,
        chain: "Solana",
        createdAt: new Date().toISOString(),
        wallet_address: transaction.transaction.message.accountKeys[0], // Sender
      },
    ]);
    console.log(`✅ Successfully archived transaction`);
  } catch (error) {
    console.error(`❌ Failed to archive transaction: ${error.message}`);
    throw error;
  }
}

const transferTokens = async (toAddress, amount) => {
  try {
    const transferIx = await transferV1(umi, {
      mint: mintSignerPublicKey,
      tokenOwner: umi.identity.publicKey,
      destinationOwner: toAddress,
      amount: BigInt(amount),
      tokenStandard: TokenStandard.Fungible,
      token: tokenAccount,
    }).sendAndConfirm(umi);

    console.log("Transfer Raw", transferIx);
    const signature = base58.deserialize(transferIx.signature)[0];
    console.log("Transfer", signature);
    const transaction = await fetchTransaction(signature);
    await addToTokenTxn(transaction, "", "success");
    return signature;
  } catch (error) {
    console.error("Transfer Error", error);
    const transaction = await fetchTransaction(signature);
    await addToTokenTxn(
      transaction,
      "Transfer of tokens failed. Reason: " + error,
      "failed"
    );
    throw new Error("Transfer failed.");
  }
};

// 🚀 Main Processing Function
functions.http("processTransaction", async (req, res) => {
  console.log(`🚀 Starting transaction processing`);
  try {
    const { signature } = req.body;
    if (!signature) {
      console.error(`❌ No transaction signature provided`);
      return res
        .status(400)
        .json({ error: "Transaction signature is required." });
    }

    console.log(`📝 Processing transaction with signature: ${signature}`);

    const transaction = await fetchTransaction(signature);
    if (!transaction) {
      console.error(`❌ Transaction not found for signature: ${signature}`);
      return res.status(404).json({ error: "Transaction not found." });
    }

    // 🛑 Run All Validations
    console.log(`🔍 Starting validation chain`);
    await validateTransactionStructure(transaction);
    await validateMetaErr(transaction);
    await validateTransactionTime(transaction);
    await validateDuplicateHash(transaction);
    await validateReceiver(transaction);
    await validateTokenMintAddress(transaction);
    console.log(`✅ All validations passed successfully`);

    const sender = transaction.transaction.message.accountKeys[0];
    const receiver = transaction.meta?.postTokenBalances[0]?.owner || "Unknown";
    console.log(`📊 Sender: ${sender}`);
    console.log(`📊 Receiver: ${receiver}`);

    // 💵 Calculate Amount Transferred
    const amountTransferred =
      (transaction.meta?.preTokenBalances[0]?.uiTokenAmount.uiAmount || 0) -
      (transaction.meta?.postTokenBalances[0]?.uiTokenAmount.uiAmount || 0);

    console.log(
      `Post Token Balances: ${transaction.meta?.postTokenBalances[0]?.uiTokenAmount.uiAmount}`
    );
    console.log(
      `Pre Token Balances: ${transaction.meta?.preTokenBalances[0]?.uiTokenAmount.uiAmount}`
    );
    console.log(`💵 Amount transferred: ${amountTransferred}`);

    // 🛑 Validate Amount Transferred
    await validateAmountTransferred(amountTransferred);

    // 📌 Extract Key Transaction Details
    const tokenMintAddress =
      transaction.meta?.preTokenBalances[0]?.mint || "Unknown";
    console.log(`📌 Token mint address: ${tokenMintAddress}`);

    // 🔍 Get Additional Details
    const userId = await getUserId(sender);
    const { shareId, pricePerShare } = await getShareDetails(tokenMintAddress);

    // add transaction to usdc_txns table
    await supabase.from("usdc_txns").insert([
      {
        hash: transaction.transaction.signatures[0],
        timestamp: new Date(transaction.blockTime * 1000).toISOString(),
        rawdata: transaction,
        note: "",
        status: "success",
        chain: "Solana",
        createdAt: new Date().toISOString(),
        wallet_address: transaction.transaction.message.accountKeys[0], // Sender
      },
    ]);

    // =============================================
    // 🚀 Process Token Transaction
    // =============================================
    const tokenTransferHash = await transferTokens(receiver, amountTransferred);

    // 📌 Prepare Transaction Data
    const transactionData = {
      user_id: userId,
      share_id: shareId,
      txn_type: "buy",
      quantity: amountTransferred,
      price_per_share: pricePerShare,
      chain: "Solana",
      timestamp: new Date(transaction.blockTime * 1000).toISOString(),
      hash: tokenTransferHash,
      note: "Transaction processed successfully.",
      status: "success",
      wallet_address: sender,
    };
    console.log(`📝 Prepared transaction data:`, transactionData);

    // 📝 Insert into Database
    console.log(`💾 Inserting transaction into database`);
    const { error } = await supabase
      .from("transactions")
      .insert([transactionData]);

    if (error) {
      console.error(`❌ Database insertion failed:`, error);
      throw new Error("Failed to store transaction in database.");
    }

    console.log(`✅ Transaction successfully processed and stored`);
    return res.status(200).json({
      message: "Transaction processed and stored successfully.",
      transactionData,
    });
  } catch (error) {
    console.error(`❌ Transaction processing failed: ${error.message}`);
    return res.status(402).json({ error: error.message });
  }
});

// ✅ Health Check Endpoint
functions.http("health", (req, res) => {
  console.log(`✅ Health check endpoint called`);
  res.send("OK");
});
