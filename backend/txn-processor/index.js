const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const { transferTokens } = require("./contractOperations.js");

// Load environment variables
dotenv.config();

// Supabase Setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Needs service role for inserts/updates
);

// Constants
const QUEUE_NAME = "solana_transactions"; // The Supabase queue name
const TRANSACTIONS_TABLE = "transactions"; // Table where status updates happen

// Function to process each transaction
async function processTransaction(job) {
  console.log("Processing transaction [RAW]", job);
  const payload = job[0].message;

  console.log(`Processing transaction...`);

  try {
    // Placeholder: Execute blockchain transaction logic
    const { isSuccess, hash } = await executeBlockchainTransaction(payload);

    console.log(`Transaction ${hash} executed`, isSuccess);

    // Determine new status
    const newStatus = isSuccess ? "success" : "failed";

    // Update transaction status in Supabase
    const { error: updateError } = await supabase
      .from(TRANSACTIONS_TABLE)
      .update({
        status: newStatus,
        token_hash: hash,
      })
      .eq("usdc_hash", payload.txnHash);

    if (updateError) throw updateError;

    console.log(`Transaction ${txnHash} updated to ${newStatus}`);
  } catch (err) {
    console.error(`Transaction ${txnHash} failed:`, err.message);
  }
}

async function executeBlockchainTransaction(payload) {
  console.log(`Executing transaction on blockchain: ${txHash}`);

  try {
    let signature = null;

    if (payload.type === "sell") {
      signature = await transferTokens(
        payload.receiver,
        payload.totalUSDCToSendToUser,
        process.env.USDC_MINT_ADDRESS,
        payload.type
      );
      return { isSuccess: true, signature };
    } else if (payload.type === "buy") {
      signature = await transferTokens(
        payload.receiver,
        payload.shareTokensToTransfer,
        payload.shareTokenMintAddress,
        payload.type
      );
      return { isSuccess: true, signature };
    }
  } catch (error) {
    return { isSuccess: false, signature };
  }
}

async function pollQueue() {
  console.log("Worker started. Polling for transactions...");

  while (true) {
    try {
      // Pop the next message from the queue
      const { data: job, error } = await supabase
        .schema("pgmq_public")
        .rpc("read", {
          queue_name: QUEUE_NAME,
          sleep_seconds: 5, // Optional: prevents excessive polling
          n: 1, // Read 1 message at a time
        });

      if (error) throw error;
      if (!job) {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait before polling again
        continue;
      }

      console.log(`Processing job: ${JSON.stringify(job)}`);

      if (job.length < 1) {
        console.log("No job found");
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait before polling again
        continue;
      }

      // Process the transaction
      await processTransaction(job);

      // Archive the message (since you want to archive transactions)
      await supabase.schema("pgmq_public").rpc("archive", {
        queue_name: QUEUE_NAME,
        message_id: job[0].msg_id,
      });
    } catch (err) {
      console.error("Queue polling error:", err);
    }
  }
}

// Start polling the queue
pollQueue();
