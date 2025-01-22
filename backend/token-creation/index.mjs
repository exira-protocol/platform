import {
  createFungible,
  mplTokenMetadata,
  TokenStandard,
  createV1,
  fetchDigitalAsset,
  transferV1,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createTokenIfMissing,
  findAssociatedTokenPda,
  getSplAssociatedTokenProgramId,
  mintTokensTo,
  createMint,
  fetchAllTokenByOwnerAndMint,
} from "@metaplex-foundation/mpl-toolbox";
import {
  generateSigner,
  percentAmount,
  createGenericFile,
  signerIdentity,
  sol,
  keypairIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { base58 } from "@metaplex-foundation/umi/serializers";
import fs from "fs";
import path from "path";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { getAccount, getMint } from "@solana/spl-token";

const connection = new Connection("https://api.devnet.solana.com");
const umi = createUmi(connection).use(mplTokenMetadata());

const a1 = "J6GT31oStsR1pns4t6P7fs3ARFNo9DCoYjANuNJVDyvN";
const a1PKey =
  "4ciGA36faeNiPRghC4orxhPDh3GcFx9BnMHHT9gFZfR7btyr9kMFqrDgNEP8XE28ta5AkucCS2LUGzUaW3udeNge";
const tokenMintAddress = "7BmfnrukhauqpLLJ4eyeRxjYAwDgNrHQPoneTGrkX6jP";
const tokenAccount = "Hqka7KwJ2jAw1WTu58jwDK5Nzn36fikcSfYohHGcX3G1";

const keypair = Keypair.fromSecretKey(bs58.decode(a1PKey));
umi.use(keypairIdentity(keypair));

const createTokens = async () => {
  const metadataUri =
    "https://amber-blank-raven-319.mypinata.cloud/ipfs/bafkreib4g7qbck4fdjmtvjbd7uhr5v7jgcmw7rdkonuf3oq6pgqnltu2im";

  const mintSigner = generateSigner(umi);

  console.log("Mint Signer", mintSigner);

  const createFungibleIx = await createFungible(umi, {
    mint: mintSigner,
    name: "Ex USDC",
    uri: metadataUri, // we use the `metedataUri` variable we created earlier that is storing our uri.
    sellerFeeBasisPoints: percentAmount(0),
    decimals: 0,
  }).sendAndConfirm(umi);

  const signature = base58.deserialize(createFungibleIx.signature)[0];
  console.log("Fungible Token Created", signature);
};

const mintTokens = async () => {
  const createTokenIx = await createTokenIfMissing(umi, {
    mint: tokenMintAddress,
    owner: umi.identity.publicKey,
    ataProgram: getSplAssociatedTokenProgramId(umi),
  }).sendAndConfirm(umi);

  console.log("Token Created Raw", createTokenIx);
  const signature = base58.deserialize(createTokenIx.signature)[0];
  console.log("Token Created", signature);

  const mintTokensIx = await mintTokensTo(umi, {
    mint: tokenMintAddress,
    token: findAssociatedTokenPda(umi, {
      mint: tokenMintAddress,
      owner: umi.identity.publicKey,
    }),
    amount: BigInt(1000),
  }).sendAndConfirm(umi);

  console.log("Mint Tokens Raw", mintTokensIx);
  const mintTokensSignature = base58.deserialize(mintTokensIx.signature)[0];
  console.log("Tokens Minted", mintTokensSignature);
};

const getTokenPDA = async () => {
  const tokenPDA = await findAssociatedTokenPda(umi, {
    mint: tokenMintAddress,
    owner: umi.identity.publicKey,
  });
  console.log("Token PDA", tokenPDA);
};

const fetchBalance = async () => {
  const balance = await fetchAllTokenByOwnerAndMint(
    umi,
    umi.identity.publicKey,
    tokenMintAddress
  );
  console.log("Balance Raw", balance);
  console.log("Balance", parseInt(balance[0].amount));
};

const getAllTokenDetails = async () => {
  const asset = await fetchDigitalAsset(umi, tokenMintAddress);
  console.log("Asset", asset);
};

const transferTokens = async () => {
  const transferIx = await transferV1(umi, {
    mint: tokenMintAddress,
    tokenOwner: umi.identity.publicKey,
    destinationOwner: "DiaUrAaTkuftHRkEJePworE2uT9ZhcFi1WqkAx53UxHv",
    amount: BigInt(100),
    tokenStandard: TokenStandard.Fungible,
    token: tokenAccount,
  }).sendAndConfirm(umi);

  console.log("Transfer Raw", transferIx);
  const signature = base58.deserialize(transferIx.signature)[0];
  console.log("Transfer", signature);
};

// createTokens();
// getTokenPDA();
fetchBalance();
// mintTokens();
// getAllTokenDetails();
// transferTokens();
