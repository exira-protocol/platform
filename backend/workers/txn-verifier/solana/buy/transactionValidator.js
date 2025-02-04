import { APPROVED_RECEIVERS, USDC_TOKEN_MINT_ADDRESS } from "./config.js";
import { addToUSDCTxn } from "./databaseOperations.js";
import { supabase } from "./config.js";
import bs58 from "bs58";

// const { supabase } = require("./config.js");
// const { USDC_TOKEN_MINT_ADDRESS, APPROVED_RECEIVERS } = require("./config.js");
// const { addToUSDCTxn } = require("./databaseOperations.js");

export async function validateTransaction(transaction) {
  try {
    await validateMetaErr(transaction);
    // await validateTransactionTime(transaction);
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

//   console.log(`📥 Receiver: ${receiver}`);

//   if (!(receiver in APPROVED_RECEIVERS)) {
//     throw new Error(
//       "Transaction receiver is not approved. Please check the receiver address. [validator.js]"
//     );
//   }

//   return APPROVED_RECEIVERS[receiver];
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

  if (tokenMintAddress !== USDC_TOKEN_MINT_ADDRESS) {
    console.log(
      `🔍 Token Mint Address: ${tokenMintAddress} | Expected: ${USDC_TOKEN_MINT_ADDRESS}  
        `
    );
    throw new Error(
      "Invalid token mint address. This transaction does not involve the approved token."
    );
  }
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

export function getUSDCTransferredd(transaction) {
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

export function getUSDCTransferredTwo(transaction) {
  console.log("🔍 Extracting SPL Token Transfer Details...");

  const logMessages = transaction.meta?.logMessages || [];
  const instructions = transaction.transaction.message.instructions || [];
  const accountKeys = transaction.transaction.message.accountKeys || [];

  // 🔍 Step 1: Find TransferChecked instruction in logs
  const transferLog = logMessages.find((log) =>
    log.includes("Instruction: TransferChecked")
  );

  if (!transferLog) {
    console.error("❌ No SPL TransferChecked instruction found.");
    return null;
  }

  console.log("✅ Found TransferChecked instruction.");

  // 🔍 Step 2: Locate the instruction responsible for TransferChecked
  const splInstruction = instructions.find(
    (instr) => instr.programIdIndex === 9 // 9 refers to the SPL Token Program (Tokenkeg...)
  );

  if (!splInstruction) {
    console.error("❌ No matching SPL Token instruction found.");
    return null;
  }

  console.log("✅ Found corresponding SPL transfer instruction.");

  // console.log("🔍 Instruction Data:", splInstruction);

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
    // Decode Base58 to Uint8Array
    const decodedData = bs58.decode(encodedData);
    console.log("🔍 Decoded Data:", decodedData);

    // Convert Uint8Array to Buffer for correct read operations
    const buffer = Buffer.from(decodedData);
    console.log("🔍 Buffer Data:", buffer.toString("hex"));

    // Ensure buffer length is at least 10 (1 + 8 + 1 bytes)
    if (buffer.length < 10) {
      throw new Error("Invalid transaction data: Not enough bytes.");
    }

    // Extract discriminator (First byte)
    const discriminator = buffer.readUInt8(0);
    console.log(`🔍 Discriminator: ${discriminator}`);

    if (discriminator !== 12) {
      throw new Error("Invalid SPL TransferChecked instruction.");
    }

    // Extract Amount (u64, 8 bytes in little-endian format)
    const amountTransferred = Number(buffer.readBigUInt64LE(1));

    // Extract Decimals (Last byte)
    const decimals = buffer.readUInt8(9);
    console.log(`📊 Token Decimals: ${decimals}`);

    // Apply decimal adjustment
    const adjustedAmount = amountTransferred / Math.pow(10, decimals);

    console.log(`💰 Corrected Amount Transferred: ${adjustedAmount}`);

    return adjustedAmount;
  } catch (error) {
    console.error("❌ Error decoding SPL Token amount:", error);
    return null;
  }
}

const SPL_TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

// export function getUSDCTransferred(transaction) {
//   console.log("🔍 Extracting SPL Token Transfer Details...");

//   const accountKeys = transaction.transaction.message.accountKeys || [];
//   const instructions = transaction.transaction.message.instructions || [];
//   const innerInstructions = transaction.meta?.innerInstructions || [];
//   const logMessages = transaction.meta?.logMessages || [];

//   // 🔍 Step 1: Find "Instruction: TransferChecked" in logs (for verification)
//   const transferLog = logMessages.find((log) =>
//     log.includes("Instruction: TransferChecked")
//   );

//   if (!transferLog) {
//     console.error("❌ No SPL TransferChecked instruction found in logs.");
//     return null;
//   }
//   console.log("✅ Found TransferChecked log entry.");

//   // 🔍 Step 2: Search for SPL Token Transfer Instruction
//   let splInstruction = null;

//   // Check in primary instructions
//   for (const instr of instructions) {
//     const programId = accountKeys[instr.programIdIndex]; // Resolve program ID from index
//     if (programId === SPL_TOKEN_PROGRAM_ID) {
//       splInstruction = instr;
//       break;
//     }
//   }

//   // Check in inner instructions if not found in primary
//   if (!splInstruction) {
//     for (const innerInstr of innerInstructions) {
//       for (const instr of innerInstr.instructions) {
//         const programId = accountKeys[instr.programIdIndex];
//         if (programId === SPL_TOKEN_PROGRAM_ID) {
//           splInstruction = instr;
//           break;
//         }
//       }
//       if (splInstruction) break;
//     }
//   }

//   if (!splInstruction) {
//     console.error("❌ No SPL Token transfer instruction found.");
//     return null;
//   }

//   console.log("✅ Found SPL Token transfer instruction.");

//   // 🔍 Step 3: Extract sender, receiver, and mint
//   const sender = accountKeys[splInstruction.accounts[0]];
//   const receiver = accountKeys[splInstruction.accounts[1]];
//   const tokenMint = accountKeys[splInstruction.accounts[2]];

//   // console.log(`📤 Sender: ${sender}`);
//   // console.log(`📥 Receiver: ${receiver}`);
//   // console.log(`🏷️ Token Mint Address: ${tokenMint}`);

//   // 🔍 Step 4: Decode the `data` field to get amount
//   const encodedData = splInstruction.data;
//   if (!encodedData) {
//     console.error("❌ No transaction amount found in instruction data.");
//     return null;
//   }

//   try {
//     const decodedData = bs58.decode(encodedData);
//     console.log("🔍 Decoded Data:", decodedData);

//     const buffer = Buffer.from(decodedData);
//     console.log("🔍 Buffer Data:", buffer.toString("hex"));

//     console.log("🔍 Transaction Data Buffer length:", buffer.length);

//     // if (buffer.length < 10) {
//     //   throw new Error("Invalid transaction data: Not enough bytes.");
//     // }

//     // Extract Discriminator (First byte)
//     const discriminator = buffer.readUInt8(0);
//     console.log(`🔍 Discriminator: ${discriminator}`);

//     // if (discriminator !== 12) {
//     //   throw new Error("Invalid SPL TransferChecked instruction.");
//     // }

//     // Extract Amount (u64, little-endian)
//     const amountTransferred = Number(buffer.readBigUInt64LE(1));

//     // Extract Decimals (Last byte)
//     const decimals = buffer.readUInt8(9);
//     console.log(`📊 Token Decimals: ${decimals}`);

//     // Adjust amount based on decimals
//     const adjustedAmount = amountTransferred / Math.pow(10, decimals);
//     console.log(`💰 Corrected Amount Transferred: ${adjustedAmount}`);

//     throw new Error("Test Error");

//     return adjustedAmount;
//   } catch (error) {
//     console.error("❌ Error decoding SPL Token amount:", error);
//     return null;
//   }

export function getUSDCTransferred(transaction) {
  console.log("🔍 Extracting SPL Token Transfer Details...");

  const accountKeys = transaction.transaction.message.accountKeys || [];
  const instructions = transaction.transaction.message.instructions || [];
  const innerInstructions = transaction.meta?.innerInstructions || [];
  const logMessages = transaction.meta?.logMessages || [];

  // 🔍 Step 1: Find "Instruction: TransferChecked" in logs
  const transferLog = logMessages.find((log) =>
    log.includes("Instruction: TransferChecked")
  );

  if (!transferLog) {
    console.error("❌ No SPL TransferChecked instruction found in logs.");
    return null;
  }
  console.log("✅ Found TransferChecked log entry.");

  // 🔍 Step 2: Gather all instructions (primary + inner)
  const allInstructions = [...instructions];

  for (const innerInstr of innerInstructions) {
    allInstructions.push(...innerInstr.instructions);
  }

  let selectedData = null;

  // 🔍 Step 3: Loop through all instructions and find the correct one
  for (const instr of allInstructions) {
    const programId = accountKeys[instr.programIdIndex];

    if (programId !== SPL_TOKEN_PROGRAM_ID) continue; // Ignore non-SPL Token Program instructions

    const encodedData = instr.data;
    if (!encodedData) continue; // Skip if no data

    try {
      const decodedData = bs58.decode(encodedData);
      const buffer = Buffer.from(decodedData);

      console.log("🔹 Instruction Data (Hex):", buffer.toString("hex"));

      if (buffer.length < 10) continue; // Ignore if not long enough for TransferChecked

      // Extract Discriminator (First byte)
      const discriminator = buffer.readUInt8(0);
      if (discriminator !== 12) continue; // Ensure it's a TransferChecked instruction

      // Extract Amount (u64, little-endian)
      const amountTransferred = Number(buffer.readBigUInt64LE(1));

      // Extract Decimals (Last byte)
      const decimals = buffer.readUInt8(9);
      if (decimals !== 6) continue; // Ensure it's a valid USDC transfer (6 decimals)

      // Ensure amount is a proper decimal, not in powers
      const adjustedAmount = amountTransferred / Math.pow(10, decimals);
      if (!Number.isFinite(adjustedAmount) || adjustedAmount <= 0) continue;

      // ✅ This is the correct instruction
      selectedData = adjustedAmount;

      console.log("✅ Found valid TransferChecked instruction.");
      console.log("Adjusted Amount:", adjustedAmount);
      console.log("🔍 Decoded Amount:", selectedData);
    } catch (error) {
      console.error("❌ Error decoding instruction:", error);
    }
  }

  if (selectedData !== null) {
    console.log(`💰 Corrected Amount Transferred: ${selectedData}`);
    return selectedData;
  }

  console.error("❌ No valid TransferChecked instruction found.");
  return null;
}
