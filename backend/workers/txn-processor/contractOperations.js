import {
  transferV1,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { fetchAllTokenByOwnerAndMint } from "@metaplex-foundation/mpl-toolbox";
import { base58 } from "@metaplex-foundation/umi/serializers";
import {
  umi,
  USDC_MINT_ADDRESS,
  TOKEN_ACCOUNT,
  APPROVED_RECEIVERS,
  embAddress,
  nexAddress,
  nexUmi,
  embUmi,
  embTokenAccount,
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

      if (amount > maxAllowance) {
        throw new Error("Amount exceeds maximum allowance.");
      }

      let activeUmi = umi;
      let tokenAccount = null;

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
      }).sendAndConfirm(activeUmi);

      const USDCBalance = await getBalance(
        USDC_MINT_ADDRESS,
        authority,
        activeUmi
      );

      await updateUSDCBalance("USDC-" + authority, USDCBalance);

      signature = base58.deserialize(transferIx.signature)[0];
      console.log("Transfer", signature);
      if (maxAllowance !== balance) {
        await updateMaxAllowance(shareTokenMintAddress, balance);
      }
    } else if (type === "sell") {
      const transferIx = await transferV1(umi, {
        mint: shareTokenMintAddress,
        tokenOwner: umi.identity.publicKey,
        destinationOwner: toAddress,
        amount: BigInt(amount),
        tokenStandard: TokenStandard.Fungible,
        token: TOKEN_ACCOUNT,
      }).sendAndConfirm(umi);

      const tokenBalance = await getBalance(shareTokenMintAddress);
      await updateMaxAllowance(shareTokenMintAddress, tokenBalance);
      const balance = await getBalance(shareTokenMintAddress);
      await updateUSDCBalance(balance);

      signature = base58.deserialize(transferIx.signature)[0];
      console.log("Transfer", signature);
    }

    await supabase.rpc("refresh_user_portfolio_mv_incremental", {
      wallet_address: toAddress,
    });

    const transaction = await fetchTransaction(signature, "token");
    console.log("Transaction Two: ", transaction);
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
}

export async function getBalance(shareTokenMintAddress, account, customUmi) {
  const balance = await fetchAllTokenByOwnerAndMint(
    customUmi,
    // umi.identity.publicKey,
    account,
    shareTokenMintAddress
  );
  console.log("Balance", parseInt(balance[0].amount));
  return parseInt(balance[0].amount);
}
