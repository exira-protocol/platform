import {
  transferV1,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { fetchAllTokenByOwnerAndMint } from "@metaplex-foundation/mpl-toolbox";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { umi, APPROVED_TOKEN_MINT, TOKEN_ACCOUNT } from "./config.js";
import { fetchTransaction } from "./transactionFetcher.js";
import { addToTokenTxn } from "./databaseOperations.js";
import {
  getShareDetails,
  updateMaxAllowance,
  updateUSDCBalance,
} from "./databaseOperations.js";

export async function transferTokens(
  toAddress,
  amount,
  shareTokenMintAddress,
  type
) {
  try {
    let signature = "";
    if (type === "buy") {
      const maxAllowance = await getShareDetails(shareTokenMintAddress);

      if (amount > maxAllowance) {
        throw new Error("Amount exceeds maximum allowance.");
      }

      const balance = await getBalance(shareTokenMintAddress);

      if (amount > balance) {
        throw new Error("Insufficient balance in the smart contract.");
      }

      const transferIx = await transferV1(umi, {
        mint: shareTokenMintAddress,
        tokenOwner: umi.identity.publicKey,
        destinationOwner: toAddress,
        amount: BigInt(amount),
        tokenStandard: TokenStandard.Fungible,
        token: TOKEN_ACCOUNT,
      }).sendAndConfirm(umi);

      const USDCBalance = await getBalance(process.env.USDC_MINT_ADDRESS);
      await updateUSDCBalance(USDCBalance);
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

export async function getBalance(shareTokenMintAddress) {
  const balance = await fetchAllTokenByOwnerAndMint(
    umi,
    umi.identity.publicKey,
    shareTokenMintAddress
  );
  console.log("Balance", parseInt(balance[0].amount));
  return parseInt(balance[0].amount);
}
