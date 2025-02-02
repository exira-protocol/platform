import { APPROVED_RECEIVERS } from "./config.js";
import { addToUSDCTxn } from "./databaseOperations.js";
import { supabase } from "./config.js";
import bs58 from "bs58";

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

// async function validateReceiver(transaction) {
//   const receiver = transaction.meta?.postTokenBalances[0]?.owner || "Unknown";

//   if (!(receiver in APPROVED_RECEIVERS)) {
//     throw new Error("Transaction receiver is not approved.");
//   }

//   console.log(`Receiver is approved: ${receiver}`);
//   return APPROVED_RECEIVERS[receiver]; // Returns expected token mint address for this receiver
// }

// export async function validateReceiver(transaction) {
//   // Extract owners from both preTokenBalances and postTokenBalances
//   const preOwners =
//     transaction.meta?.preTokenBalances?.map((b) => b.owner) || [];
//   const postOwners =
//     transaction.meta?.postTokenBalances?.map((b) => b.owner) || [];

//   // Combine and remove duplicates
//   const uniqueOwners = [...new Set([...preOwners, ...postOwners])];

//   console.log(`📥 Unique Owners Found:`, uniqueOwners);

//   // Find the first approved receiver in the unique owners list
//   const receiver = uniqueOwners.find((owner) => owner in APPROVED_RECEIVERS);

//   if (!receiver) {
//     throw new Error(
//       "Transaction receiver is not approved. Please check the receiver address. [validator.js]"
//     );
//   }

//   console.log(`✅ Approved Receiver Found: ${receiver}`);

//   return APPROVED_RECEIVERS[receiver]; // Return corresponding share ID or token mint address
// }

export async function validateReceiver(transaction) {
  // Extract owners from both preTokenBalances and postTokenBalances
  const preOwners =
    transaction.meta?.preTokenBalances?.map((b) => b.owner) || [];
  const postOwners =
    transaction.meta?.postTokenBalances?.map((b) => b.owner) || [];

  // Combine and remove duplicates
  const uniqueOwners = [...new Set([...preOwners, ...postOwners])];

  console.log(`📥 Unique Owners Found:`, uniqueOwners);

  if (uniqueOwners.length !== 2) {
    throw new Error(
      `Unexpected number of unique owners: ${uniqueOwners.length}. Expected exactly 2 addresses.`
    );
  }

  // Find the approved receiver (authority)
  const authority = uniqueOwners.find((owner) => owner in APPROVED_RECEIVERS);

  if (!authority) {
    throw new Error(
      "Transaction receiver is not approved. Please check the receiver address. [validator.js]"
    );
  }

  // Identify the other user (non-approved address)
  const user = uniqueOwners.find((owner) => owner !== authority);

  console.log("Authority Address:", authority);
  console.log("User Address:", user);
  console.log("Mint Token Address:", APPROVED_RECEIVERS[authority]);

  return {
    authorityAddress: authority, // Share ID or token mint address
    mintTokenAddress: APPROVED_RECEIVERS[authority], // Share ID or token mint address
    userAddress: user, // The other wallet address
  };
}

async function validateTokenMintAddress(transaction) {
  const tokenMintAddress =
    transaction.meta?.preTokenBalances[0]?.mint || "Unknown";
  // const receiver = transaction.meta?.postTokenBalances[0]?.owner || "Unknown";

  // if (!(receiver in APPROVED_RECEIVERS)) {
  //   throw new Error("Receiver is not approved. Transaction rejected.");
  // }

  const { authorityAddress, mintTokenAddress, userAddress } =
    await validateReceiver(transaction);

  const expectedTokenMint = mintTokenAddress;

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

const SPL_TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

export function getShareTokensTransferred(transaction) {
  console.log("🔍 Extracting SPL Token Transfer Details...");

  const accountKeys = transaction.transaction.message.accountKeys || [];
  const instructions = transaction.transaction.message.instructions || [];
  const innerInstructions = transaction.meta?.innerInstructions || [];
  const logMessages = transaction.meta?.logMessages || [];

  // 🔍 Step 1: Find "Instruction: TransferChecked" in logs (for verification)
  const transferLog = logMessages.find((log) =>
    log.includes("Instruction: TransferChecked")
  );

  if (!transferLog) {
    console.error("❌ No SPL TransferChecked instruction found in logs.");
    return null;
  }
  console.log("✅ Found TransferChecked log entry.");

  // 🔍 Step 2: Search for SPL Token Transfer Instruction
  let splInstruction = null;

  // Check in primary instructions
  for (const instr of instructions) {
    const programId = accountKeys[instr.programIdIndex]; // Resolve program ID from index
    if (programId === SPL_TOKEN_PROGRAM_ID) {
      splInstruction = instr;
      break;
    }
  }

  // Check in inner instructions if not found in primary
  if (!splInstruction) {
    for (const innerInstr of innerInstructions) {
      for (const instr of innerInstr.instructions) {
        const programId = accountKeys[instr.programIdIndex];
        if (programId === SPL_TOKEN_PROGRAM_ID) {
          splInstruction = instr;
          break;
        }
      }
      if (splInstruction) break;
    }
  }

  if (!splInstruction) {
    console.error("❌ No SPL Token transfer instruction found.");
    return null;
  }

  console.log("✅ Found SPL Token transfer instruction.");

  // 🔍 Step 3: Extract sender, receiver, and mint
  const sender = accountKeys[splInstruction.accounts[0]];
  const receiver = accountKeys[splInstruction.accounts[1]];
  const tokenMint = accountKeys[splInstruction.accounts[2]];

  // console.log(`📤 Sender: ${sender}`);
  // console.log(`📥 Receiver: ${receiver}`);
  // console.log(`🏷️ Token Mint Address: ${tokenMint}`);

  // 🔍 Step 4: Decode the `data` field to get amount
  const encodedData = splInstruction.data;
  if (!encodedData) {
    console.error("❌ No transaction amount found in instruction data.");
    return null;
  }

  try {
    const decodedData = bs58.decode(encodedData);
    // console.log("🔍 Decoded Data:", decodedData);

    const buffer = Buffer.from(decodedData);
    // console.log("🔍 Buffer Data:", buffer.toString("hex"));

    if (buffer.length < 10) {
      throw new Error("Invalid transaction data: Not enough bytes.");
    }

    // Extract Discriminator (First byte)
    const discriminator = buffer.readUInt8(0);
    // console.log(`🔍 Discriminator: ${discriminator}`);

    if (discriminator !== 12) {
      throw new Error("Invalid SPL TransferChecked instruction.");
    }

    // Extract Amount (u64, little-endian)
    const amountTransferred = Number(buffer.readBigUInt64LE(1));

    // Extract Decimals (Last byte)
    const decimals = buffer.readUInt8(9);
    // console.log(`📊 Token Decimals: ${decimals}`);

    // Adjust amount based on decimals
    const adjustedAmount = amountTransferred / Math.pow(10, decimals);
    console.log(`💰 Corrected Amount Transferred: ${adjustedAmount}`);

    return adjustedAmount;
  } catch (error) {
    console.error("❌ Error decoding SPL Token amount:", error);
    return null;
  }
}
