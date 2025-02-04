import {
  transferV1,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { umi, USDC_TOKEN_MINT_ADDRESS, USDC_TOKEN_ADDRESS } from "./config.js";
import { fetchTransaction } from "./transactionFetcher.js";
import { addToTokenTxn } from "./databaseOperations.js";

// const { transferV1, TokenStandard } = require("@metaplex-foundation/mpl-token-metadata");
// const { base58 } = require("@metaplex-foundation/umi/serializers");
// const { umi, USDC_TOKEN_ADDRESS } = require("./config");
// const { fetchTransaction } = require("./transactionFetcher");
// const { addToTokenTxn } = require("./databaseOperations");

// export async function transferTokens(toAddress, amount, shareTokenMintAddress) {
//   try {
//     const transferIx = await transferV1(umi, {
//       mint: shareTokenMintAddress,
//       tokenOwner: umi.identity.publicKey,
//       destinationOwner: toAddress,
//       amount: BigInt(amount),
//       tokenStandard: TokenStandard.Fungible,
//       token: USDC_TOKEN_ADDRESS,
//     }).sendAndConfirm(umi);

//     const signature = base58.deserialize(transferIx.signature)[0];
//     console.log("Transfer", signature);
//     const transaction = await fetchTransaction(signature, "token");
//     await addToTokenTxn(transaction, "", "success");
//     return signature;
//   } catch (error) {
//     console.error("Transfer Error", error);
//     const transaction = await fetchTransaction(signature);
//     await addToTokenTxn(
//       transaction,
//       "Transfer of tokens failed. Reason: " + error,
//       "failed"
//     );
//     throw new Error("Transfer failed.");
//   }
// }
