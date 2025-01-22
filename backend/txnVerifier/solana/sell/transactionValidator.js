import { APPROVED_RECEIVERS, APPROVED_TOKEN_MINT } from "./config.js";
import { addToUSDCTxn } from "./databaseOperations.js";
import { supabase } from "./config.js";

export async function validateTransaction(transaction) {
  try {
    await validateMetaErr(transaction);
    await validateTransactionTime(transaction);
    await validateDuplicateHash(transaction);
    await validateReceiver(transaction);
    await validateTokenMintAddress(transaction);
    validateTransactionStructure(transaction);
  } catch (error) {
    // Add the failed transaction to USDC txns table
    await addToUSDCTxn(transaction, error.message, "failed");
    throw error; // Re-throw the error to be caught in the main function
  }
}

async function validateMetaErr(transaction) {
  if (transaction.meta.err !== null) {
    throw new Error("Transaction failed due to blockchain error.");
  }
}

async function validateTransactionTime(transaction) {
  const txnTime = transaction.blockTime * 1000;
  const currentTime = Date.now();
  const timeDiff = currentTime - txnTime;

  //   if (timeDiff > 60 * 1000) {
  if (false) {
    throw new Error(
      "Transaction is too old (more than 1 minute) and cannot be processed."
    );
  }
}

async function validateDuplicateHash(transaction) {
  const txnHash = transaction.transaction.signatures[0];
  const { data } = await supabase
    .from("usdc_txns")
    .select("hash")
    .eq("hash", txnHash);

  if (data.length > 0) {
    throw new Error(
      "Duplicate transaction detected. This transaction has already been processed."
    );
  }
}

async function validateReceiver(transaction) {
  const receiver = transaction.meta?.postTokenBalances[0]?.owner || "Unknown";

  if (!(receiver in APPROVED_RECEIVERS)) {
    throw new Error("Transaction receiver is not approved.");
  }

  console.log(`Receiver is approved: ${receiver}`);
  return APPROVED_RECEIVERS[receiver]; // Returns expected token mint address for this receiver
}

async function validateTokenMintAddress(transaction) {
  const tokenMintAddress =
    transaction.meta?.preTokenBalances[0]?.mint || "Unknown";
  const receiver = transaction.meta?.postTokenBalances[0]?.owner || "Unknown";

  if (!(receiver in APPROVED_RECEIVERS)) {
    throw new Error("Receiver is not approved. Transaction rejected.");
  }

  const expectedTokenMint = APPROVED_RECEIVERS[receiver];

  if (tokenMintAddress !== expectedTokenMint) {
    throw new Error(
      `Token mint address mismatch. Expected: ${expectedTokenMint}, Found: ${tokenMintAddress}`
    );
  }

  console.log(`Token mint address matches receiver: ${tokenMintAddress}`);
}

function validateTransactionStructure(transaction) {
  if (!transaction || typeof transaction !== "object") {
    throw new Error(
      "Transaction data is invalid or malformed. Please check the transaction details."
    );
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
    const parts = field.split(".");
    let value = transaction;
    for (const part of parts) {
      if (!value || !value.hasOwnProperty(part)) {
        throw new Error(
          `Missing expected field: ${field}. Transaction structure is invalid.`
        );
      }
      value = value[part];
    }
  }
}

export function getShareTokensTransferred(transaction) {
  try {
    const preBalances = transaction.meta?.preTokenBalances || [];
    const postBalances = transaction.meta?.postTokenBalances || [];

    console.log("🔍 Pre Token Balances:", JSON.stringify(preBalances, null, 2));
    console.log(
      "🔍 Post Token Balances:",
      JSON.stringify(postBalances, null, 2)
    );

    if (preBalances.length === 0 || postBalances.length === 0) {
      console.log(
        "⚠️ No token balances found! Transaction might not involve a token transfer."
      );
      return 0;
    }

    let senderPre = null;
    let receiverPost = null;

    for (let i = 0; i < preBalances.length; i++) {
      const preBalance = preBalances[i]?.uiTokenAmount?.uiAmount || 0;
      const postBalance = postBalances[i]?.uiTokenAmount?.uiAmount || 0;

      if (preBalance > postBalance) {
        senderPre = preBalance - postBalance; // Sender's balance decreases
      } else if (postBalance > preBalance) {
        receiverPost = postBalance - preBalance; // Receiver's balance increases
      }
    }

    // Ensure we got a valid transfer amount
    const amountTransferred = senderPre || receiverPost || 0;
    console.log(`💰 Corrected Amount Transferred: ${amountTransferred} USDC`);

    if (amountTransferred <= 0) {
      throw new Error(
        "Invalid transaction: Amount transferred must be greater than zero."
      );
    }

    return amountTransferred;
  } catch (error) {
    console.error("❌ Error extracting USDC amount:", error);
    return 0;
  }
}
