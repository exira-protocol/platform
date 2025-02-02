import axios from "axios";
import { logger, SOLANA_RPC_URL } from "./config.js";

// const axios = require("axios");
// const { logger, SOLANA_RPC_URL } = require("./config");

export async function fetchTransaction(signature, txnType) {
  console.log(`🔍 Fetching transaction with signature: ${signature}`);
  logger.info(`🔍 Fetching transaction with signature: ${signature}`);
  let maxRetries = 3;
  let retryInterval = 2000;

  if (txnType === "usdc") {
    console.log(`🔍 Fetching USDC transaction...`);
    maxRetries = 7;
    retryInterval = 3000;
  } else if (txnType === "token") {
    console.log(`🔍 Fetching token transaction...`);
    maxRetries = 7;
    retryInterval = 3000;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt} to fetch transaction...`);

      const response = await axios.post(SOLANA_RPC_URL, {
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [
          signature,
          { maxSupportedTransactionVersion: 0, encoding: "json" },
        ],
      });

      console.log(`🔍 Transaction response: ${Object.keys(response)}`);

      if (response.data.result) {
        console.log(
          `✅ Successfully fetched transaction data on attempt ${attempt}`
        );
        return response.data.result;
      } else {
        console.warn(
          `⚠️ Transaction not found on attempt ${attempt}. Retrying...`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error fetching transaction (Attempt ${attempt}): ${error.message}`
      );
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }
  }

  console.error(`🚨 Failed to fetch transaction after ${maxRetries} attempts.`);
  throw new Error(
    "Failed to fetch transaction from Solana RPC after multiple retries."
  );
}
