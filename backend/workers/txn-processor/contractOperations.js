import {
  transferV1,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { fetchAllTokenByOwnerAndMint } from "@metaplex-foundation/mpl-toolbox";
import { base58 } from "@metaplex-foundation/umi/serializers";
import {
  USDC_MINT_ADDRESS,
  APPROVED_RECEIVERS,
  embAddress,
  embUmi,
  embTokenAccount,
  embUsdcTokenAccount,
} from "./config.js";
import { fetchTransaction } from "./transactionFetcher.js";
import { addToTokenTxn } from "./databaseOperations.js";
import {
  getShareDetails,
  updateMaxAllowance,
  updateUSDCBalance,
} from "./databaseOperations.js";
import { supabase } from "./config.js";

export async function transferTokens(
  toAddress,
  amount,
  shareTokenMintAddress,
  type,
  authority
) {
  try {
    let signature = "";
    if (type === "buy") {
      const maxAllowance = await getShareDetails(shareTokenMintAddress);
      console.log("Max Allowance", maxAllowance);

      maxAllowance = parseInt(maxAllowance);

      if (amount > maxAllowance) {
        throw new Error("Amount exceeds maximum allowance.");
      }

      let activeUmi = null;
      let tokenAccount = null;

      const nexAddress = process.env.NEX_ADDRESS || "";

      if (shareTokenMintAddress === nexAddress) {
        console.log("Active UMI: NEX");
        activeUmi = nexUmi;
        // tokenAccount = nexAddress;
      } else if (shareTokenMintAddress === embAddress) {
        console.log("Active UMI: EMB");
        activeUmi = embUmi;
        tokenAccount = embTokenAccount;
      } else {
        // break everything and throw an error
        throw new Error("Invalid share token mint address.");
      }

      const balance = await getBalance(
        shareTokenMintAddress,
        authority,
        activeUmi
      );
      await updateMaxAllowance(shareTokenMintAddress, balance);

      if (amount > balance) {
        throw new Error("Insufficient balance in the smart contract.");
      }

      console.log("shareTokenMintAddress", shareTokenMintAddress);
      console.log("active UMI public key", activeUmi.identity.publicKey);

      const transferIx = await transferV1(activeUmi, {
        mint: shareTokenMintAddress,
        tokenOwner: activeUmi.identity.publicKey,
        destinationOwner: toAddress,
        amount: BigInt(amount),
        tokenStandard: TokenStandard.Fungible,
        token: tokenAccount,
      })
        .sendAndConfirm(activeUmi, {
          confirm: {
            commitment: "processed",
          },
        })
        .catch((error) => {
          console.error("Error in transferV1", error);
        });

      let attempts = 0;
      const maxAttempts = 30; // Maximum time to wait (~30s, adjust as needed)
      const delayMs = 1000; // Check every 1 second

      console.log("Create Fungible Raw", transferIx);

      console.log(
        `⏳ Waiting for transaction confirmation: ${transferIx.signature}`
      );

      let emptyArray = [];
      emptyArray.push(transferIx.signature);

      while (attempts < maxAttempts) {
        const latestConfirmation = await activeUmi.rpc.getSignatureStatuses(
          emptyArray
        );

        console.log("Latest Confirmation", latestConfirmation);

        if (latestConfirmation[0]?.commitment === "finalized") {
          console.log("✅ Transaction is finalized!");
          break;
        } else if (latestConfirmation[0]?.commitment === "confirmed") {
          console.log("⚠️ Transaction is confirmed but not finalized yet...");
        } else {
          console.log(`🔄 Waiting... (${attempts + 1}/${maxAttempts})`);
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs)); // Wait before checking again
        attempts++;
      }

      const USDCBalance = await getBalance(
        USDC_MINT_ADDRESS,
        authority,
        activeUmi
      );

      await updateUSDCBalance("USDC-" + authority, USDCBalance);

      signature = base58.deserialize(transferIx.signature)[0];
      console.log("Transfer", signature);
      if (maxAllowance !== balance) {
        await updateMaxAllowance(shareTokenMintAddress, balance - amount);
      }

      return signature;
    } else if (type === "sell") {
      let activeUmi = null;

      // APPROVED RECEIVERS:
      // {"8avB2XNZMbhEh5Qs1UFLtLWQgJVhAKVmeuDg6VYtiurq": "Fyn2MTFqnGpFQjoaWdmYj43cVYsvbKfUeLdhDp3zmmZT", "22wx2tyVWhfjsqhF6MXjpry4rnqZKgAMdPwMsZPsTDZ5": "7KL2fTEWgkeZyCbwGkfvLtHingV3ntFvtS1vT2o48rHZ", "J6GT31oStsR1pns4t6P7fs3ARFNo9DCoYjANuNJVDyvN": "53XrQrcaY6wb8T3YPByY3MMP5EEZJQRaXqnYznBgvMmX"}

      let tokenAddressFromAuthority = "";
      let tokenAccount = null;

      // find if the authority is in the approved receivers's keys. If it is then get the value of the key and assign it to a new variable
      console.log("Authority", authority);
      if (authority in APPROVED_RECEIVERS) {
        tokenAddressFromAuthority = APPROVED_RECEIVERS[authority];
        console.log("Token Address from Authority", tokenAddressFromAuthority);
      } else {
        throw new Error("Invalid authority.");
      }

      const nexAddress = process.env.NEX_ADDRESS || "";

      if (tokenAddressFromAuthority === nexAddress) {
        console.log("Active UMI: NEX");
        activeUmi = nexUmi;
      } else if (tokenAddressFromAuthority === embAddress) {
        console.log("Active UMI: EMB");
        activeUmi = embUmi;
        tokenAccount = embTokenAccount;
      } else {
        throw new Error("Invalid share token mint address.");
      }

      const currentUSDCBalance = await getBalance(
        USDC_MINT_ADDRESS,
        authority,
        activeUmi
      );

      let txnStatusUpdated = "";
      let transferIx = null;

      if (amount >= currentUSDCBalance) {
        txnStatusUpdated = "processing";
        return "processing";
      } else {
        // ✅ Step 1: Round to 3 decimal places
        const roundedAmount = Math.round(amount * 1000) / 1000;
        console.log(`🔍 Rounded Amount (3 decimal places): ${roundedAmount}`);

        // ✅ Step 2: Convert to integer for USDC (scale by 10^6)
        const scaledAmount = Math.round(roundedAmount * 1_000_000); // Converts to smallest unit
        console.log(
          `🔍 Scaled Amount for USDC (integer format): ${scaledAmount}`
        );

        transferIx = await transferV1(activeUmi, {
          mint: USDC_MINT_ADDRESS,
          tokenOwner: activeUmi.identity.publicKey,
          destinationOwner: toAddress,
          amount: BigInt(scaledAmount),
          tokenStandard: TokenStandard.Fungible,
          token: embUsdcTokenAccount,
        })
          .sendAndConfirm(activeUmi, {
            confirm: {
              commitment: "processed",
            },
          })
          .catch((error) => {
            console.error("Error in transferV1", error);
          });

        let attempts = 0;
        const maxAttempts = 30; // Maximum time to wait (~30s, adjust as needed)
        const delayMs = 1000; // Check every 1 second

        console.log("Create Fungible Raw", transferIx);

        console.log(
          `⏳ Waiting for transaction confirmation: ${transferIx.signature}`
        );

        let emptyArray = [];
        emptyArray.push(transferIx.signature);

        while (attempts < maxAttempts) {
          const latestConfirmation = await activeUmi.rpc.getSignatureStatuses(
            emptyArray
          );

          console.log("Latest Confirmation", latestConfirmation);

          if (latestConfirmation[0]?.commitment === "finalized") {
            console.log("✅ Transaction is finalized!");
            break;
          } else if (latestConfirmation[0]?.commitment === "confirmed") {
            if (parseInt(latestConfirmation[0]?.confirmations) > 30) {
              break;
            } else {
              console.log(
                "⚠️ Transaction is confirmed(less than 30) but not finalized yet...",
                latestConfirmation[0]?.confirmations
              );
            }
          } else {
            console.log(`🔄 Waiting... (${attempts + 1}/${maxAttempts})`);
          }

          await new Promise((resolve) => setTimeout(resolve, delayMs)); // Wait before checking again
          attempts++;
        }

        let newUSDCBalance = await getBalance(
          USDC_MINT_ADDRESS,
          authority,
          activeUmi
        );
        await updateUSDCBalance("USDC-" + authority, newUSDCBalance);
        signature = base58.deserialize(transferIx.signature)[0];
        console.log("Transfer", signature);

        const transaction = await fetchTransaction(signature, "token");
        console.log("Transaction Two: ", transaction);
        await addToTokenTxn(transaction, "", "success");
        return signature;
      }
    }

    // await supabase.rpc("refresh_user_portfolio_mv_incremental", {
    //   wallet_address: toAddress,
    // });
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
}

export async function getBalance(shareTokenMintAddress, account, customUmi) {
  const balance = await fetchAllTokenByOwnerAndMint(
    customUmi,
    // umi.identity.publicKey,
    account,
    shareTokenMintAddress
  );
  console.log("Balance", balance);
  console.log("Balance", parseInt(balance[0].amount));
  // convert bigInt to integer and return the balance
  let convertedBalance = parseInt(balance[0].amount);

  if (shareTokenMintAddress !== embAddress) {
    convertedBalance = convertedBalance / 1000000;
  }

  return convertedBalance;
}
