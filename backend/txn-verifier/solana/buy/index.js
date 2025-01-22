import { fetchTransaction } from "./transactionFetcher.js";
import { validateTransaction } from "./transactionValidator.js";
import {
  addToUSDCTxn,
  getUserId,
  getShareDetails,
  insertTransaction,
  addMessageToQueue,
} from "./databaseOperations.js";
import { transferTokens } from "./tokenTransfer.js";
import { getUSDCTransferred } from "./transactionValidator.js";
import { APPROVED_RECEIVERS } from "./config.js";

export async function processTransaction(req, res) {
  console.log(`🚀 Starting transaction processing`);
  try {
    const { signature } = req.body;
    if (!signature) {
      return res
        .status(400)
        .json({ error: "Transaction signature is required." });
    }

    console.log(`📝 Processing transaction with signature: ${signature}`);

    const transaction = await fetchTransaction(signature, "usdc");
    if (!transaction) {
      return res.status(404).json({
        error:
          "Transaction not found. Please check the signature and try again.",
      });
    }

    await validateTransaction(transaction);

    const sender = transaction.transaction.message.accountKeys[0];
    const receiver = transaction.meta?.postTokenBalances[0]?.owner || "Unknown";

    const amountTransferred = getUSDCTransferred(transaction);

    if (amountTransferred <= 0) {
      throw new Error(
        "Invalid transaction: Amount transferred must be greater than zero."
      );
    }

    const tokenMintAddress =
      transaction.meta?.preTokenBalances[0]?.mint || "Unknown";

    const userId = await getUserId(sender);

    // const APPROVED_RECEIVERS = {
    //     J6GT31oStsR1pns4t6P7fs3ARFNo9DCoYjANuNJVDyvN: 2,
    //     DiaUrAaTkuftHRkEJePworE2uT9ZhcFi1WqkAx53UxHv: 3,
    //     Ez1Y8ygX8TRwCbDEnu3r24hrjuDvxxy6qc15EKQgPvD5: 4,
    //   };

    let shareTokenMintAddress;

    if (!(receiver in APPROVED_RECEIVERS)) {
      throw new Error(
        "Transaction receiver is not approved. Please check the receiver address."
      );
    } else {
      shareTokenMintAddress = APPROVED_RECEIVERS[receiver];
    }

    console.log("🔍 Share Token Mint Address:", shareTokenMintAddress);
    console.log("Receiver:", receiver);

    // const { shareId, pricePerShare } = await getShareDetails(tokenMintAddress);
    const { shareId, pricePerShare, maxAllowance, instantAllowance } =
      await getShareDetails(shareTokenMintAddress);

    await addToUSDCTxn(transaction, "", "success");

    // Calculate equivalent shares from transferred USDC
    let shareTokensToTransfer = amountTransferred / pricePerShare;

    // Round down to the nearest integer
    shareTokensToTransfer = Math.floor(shareTokensToTransfer);

    // Calculate Expected USDC Amount (Share Price + 1% Fee)
    const expectedTotalUSDC = shareTokensToTransfer * pricePerShare * 1.01; // 1% fee added

    // Check if excess amount matches the 1% fee
    const excessAmount =
      amountTransferred - shareTokensToTransfer * pricePerShare;
    const expectedFee = shareTokensToTransfer * pricePerShare * 0.01;

    console.log("Expected Total USDC with Fee:", expectedTotalUSDC);
    console.log("Amount Transferred:", amountTransferred);
    console.log("Excess Amount (should match 1% fee):", excessAmount);
    console.log("Expected 1% Fee:", expectedFee);

    // Reject if the excess amount does not match the 1% fee
    if (Math.abs(excessAmount - expectedFee) > 0.01) {
      // Allow slight floating-point precision errors
      throw new Error(
        "Invalid transaction: The transferred amount does not include the correct 1% fee."
      );
    }

    console.log("Transaction includes the correct 1% fee.");

    if (shareTokensToTransfer > maxAllowance) {
      throw new Error(
        "Invalid transaction: The number of shares to transfer exceeds the maximum allowance."
      );
    }

    let status = "queued";

    if (shareTokensToTransfer > instantAllowance) {
      status = "processing";
    }

    const transactionData = {
      user_id: userId,
      share_id: shareId,
      txn_type: "buy",
      quantity: amountTransferred,
      price_per_share: pricePerShare,
      chain: "Solana",
      timestamp: new Date(transaction.blockTime * 1000).toISOString(),
      usdc_hash: signature,
      token_hash: "",
      note: "Transaction processed successfully.",
      status: status,
      wallet_address: sender,
    };

    await insertTransaction(transactionData);

    console.log(`✅ Transaction successfully processed and stored`);

    if (status === "queued") {
      const addQueueResponse = await addMessageToQueue({
        txnHash: signature,
        receiver,
        totalUSDCToSendToUser: amountTransferred,
        type: "buy",
      });

      console.log(`Transaction added to queue: ${addQueueResponse}`);

      return res.status(200).json({
        message: "Transaction processed and queued successfully.",
        //   transactionData,
      });
    }

    return res.status(204).json({
      message: "Transaction processed and stored successfully.",
      //   transactionData,
    });
  } catch (error) {
    console.error(`❌ Transaction processing failed: ${error.message}`);
    return res.status(402).json({
      error: "Transaction processing failed.",
      details: error.message,
      userMessage:
        "There was an issue processing your transaction. Please check the details and try again.",
    });
  }
}
