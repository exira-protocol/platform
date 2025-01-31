import { fetchTransaction } from "./transactionFetcher.js";
import { validateTransaction } from "./transactionValidator.js";
import {
  addToUSDCTxn,
  getUserId,
  getShareDetails,
  insertTransaction,
  addMessageToQueue,
} from "./databaseOperations.js";
import { getShareTokensTransferred } from "./transactionValidator.js";
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

    let amountTransferred = getShareTokensTransferred(transaction);

    if (amountTransferred <= 0) {
      throw new Error(
        "Invalid transaction: Amount transferred must be greater than zero."
      );
    }

    const userId = await getUserId(sender);

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
    const { shareId, pricePerShare } = await getShareDetails(
      shareTokenMintAddress
    );

    await addToUSDCTxn(transaction, "", "success", "sell");

    // sometimes the amount transferred is in decimals, so we need to round it off to the nearest lower integer.
    amountTransferred = Math.floor(amountTransferred);

    // pricerPerShare is the price of one share in USDC, amountTransferred is the number of shares bought. so total USDC that needs to be transferred is pricePerShare * amountTransferred
    let totalUSDCToSendToUser = pricePerShare * amountTransferred;

    // reduce 1% as commission
    totalUSDCToSendToUser = totalUSDCToSendToUser * 0.99;

    // const tokenTransferHash = await transferTokens(receiver, amountTransferred);
    // const tokenTransferHash = await transferTokens(
    //   receiver,
    //   totalUSDCToSendToUser
    // );

    const transactionData = {
      user_id: userId,
      share_id: shareId,
      txn_type: "sell",
      quantity: amountTransferred,
      price_per_share: pricePerShare,
      chain: "Solana",
      timestamp: new Date(transaction.blockTime * 1000).toISOString(),
      usdc_hash: signature,
      token_hash: "",
      note: "Transaction processed successfully.",
      status: "queued",
      wallet_address: sender,
    };

    await insertTransaction(transactionData);

    console.log(`Transaction successfully processed and stored`);

    const addQueueResponse = await addMessageToQueue({
      txnHash: signature,
      authority: receiver,
      receiver: sender,
      totalUSDCToSendToUser,
      type: "sell",
    });

    console.log(`Transaction added to queue: ${addQueueResponse}`);

    return res.status(200).json({
      message: "Transaction processed and stored successfully.",
      //   transactionData,
    });
  } catch (error) {
    console.error(`Transaction processing failed: ${error.message}`);
    return res.status(402).json({
      error: "Transaction processing failed.",
      details: error.message,
      userMessage:
        "There was an issue processing your transaction. Please check the details and try again.",
    });
  }
}
