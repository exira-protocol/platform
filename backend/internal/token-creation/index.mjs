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
  transferTokens,
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
import dotenv from "dotenv";

dotenv.config();

// const connection = new Connection("https://api.devnet.solana.com");
const connection = new Connection(
  "https://summer-icy-bridge.solana-mainnet.quiknode.pro/59676b80a658b61070b734ff307bb7f2b5908e40"
);
const umi = createUmi(connection).use(mplTokenMetadata());

const a1 = "J6GT31oStsR1pns4t6P7fs3ARFNo9DCoYjANuNJVDyvN";
const a1PKey =
  "4ciGA36faeNiPRghC4orxhPDh3GcFx9BnMHHT9gFZfR7btyr9kMFqrDgNEP8XE28ta5AkucCS2LUGzUaW3udeNge";
const tokenAccount = "3yFiRp3jh3vUrfJiRmB71kqTfnccVpmkgQsoGnnN3JdV";

const mainnetDeployerPkey = process.env.MAINNET_DEPLOYER_PKEY;
const mainnetDeployer = Keypair.fromSecretKey(bs58.decode(mainnetDeployerPkey));

const keypair = Keypair.fromSecretKey(bs58.decode(a1PKey));
umi.use(keypairIdentity(keypair));

const embPrivKey =
  "4yYDPusBej2x54zDrBLFLZNhV5o9Zei3JLGk5scN6Vhx5Qnk4rPuAdHiDtdZJ7xSHAyrGjLbvLSNLQw9CpJ9WrUh";

const mainnetEmbPrivKey = process.env.EXEMB_PKEY;
const mainnetEmbKeypair = Keypair.fromSecretKey(bs58.decode(mainnetEmbPrivKey));

const embKeypair = Keypair.fromSecretKey(bs58.decode(embPrivKey));
const embUmi = createUmi(connection)
  .use(mplTokenMetadata())
  .use(keypairIdentity(embKeypair));

const mainnetDeployerUmi = createUmi(connection)
  .use(mplTokenMetadata())
  .use(keypairIdentity(mainnetDeployer));

const embMainnetUmi = createUmi(connection)
  .use(mplTokenMetadata())
  .use(keypairIdentity(mainnetEmbKeypair));

const createTokens = async () => {
  console.log("Creating Tokens");
  const currentUmi = mainnetDeployerUmi;

  const metadataUri =
    "https://amber-blank-raven-319.mypinata.cloud/ipfs/bafkreihzqvxqtkogp7whfvmq4r5alykpvtflgqjd5hbropepc3ohqfvf6e";

  const mintSigner = generateSigner(currentUmi);

  console.log("Mint Signer", mintSigner);

  const createFungibleIx = await createFungible(currentUmi, {
    mint: mintSigner,
    name: "Test Token #26947",
    uri: "",
    sellerFeeBasisPoints: percentAmount(0),
    decimals: 0,
  })
    .sendAndConfirm(currentUmi, {
      confirm: {
        commitment: "processed",
      },
    })
    .catch((e) => {
      console.log("Error", e);
    });
  // .sendAndConfirm(currentUmi, {
  //   confirm: {
  //     commitment: "confirmed",
  //     strategy: "durableNonce",
  //   },
  // })
  // .catch((e) => {
  //   console.log("Error", e);
  // })
  // .then((res) => {
  //   console.log("Res", res);
  // });
  // Polling for confirmation

  let attempts = 0;
  const maxAttempts = 30; // Maximum time to wait (~30s, adjust as needed)
  const delayMs = 1000; // Check every 1 second

  console.log("Create Fungible Raw", createFungibleIx);

  console.log(
    `⏳ Waiting for transaction confirmation: ${createFungibleIx.signature}`
  );

  let emptyArray = [];
  emptyArray.push(createFungibleIx.signature);

  while (attempts < maxAttempts) {
    const latestConfirmation = await currentUmi.rpc.getSignatureStatuses(
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

  const signature = base58.deserialize(createFungibleIx.signature)[0];
  console.log("Fungible Token Created", signature);
};

const mintTokens = async () => {
  let currentUmi = embMainnetUmi;
  const tokenMintAddress = "8E3PZ7v9jdwiauRdX8ZHn8peRqchRjLHeH2gyZjqFdY7";
  const createTokenIx = await createTokenIfMissing(currentUmi, {
    mint: tokenMintAddress,
    owner: currentUmi.identity.publicKey,
    ataProgram: getSplAssociatedTokenProgramId(currentUmi),
  }).sendAndConfirm(currentUmi);

  console.log("Token Created Raw", createTokenIx);
  const signature = base58.deserialize(createTokenIx.signature)[0];
  console.log("Token Created", signature);

  const mintTokensIx = await mintTokensTo(currentUmi, {
    mint: tokenMintAddress,
    token: findAssociatedTokenPda(currentUmi, {
      mint: tokenMintAddress,
      owner: currentUmi.identity.publicKey,
    }),
    // 1 thousand dollars in USDC
    amount: BigInt(24),
  }).sendAndConfirm(currentUmi);

  console.log("Mint Tokens Raw", mintTokensIx);
  const mintTokensSignature = base58.deserialize(mintTokensIx.signature)[0];
  console.log("Tokens Minted", mintTokensSignature);
};

const getTokenPDA = async () => {
  // let currentUmi = embMainnetUmi;
  // let currentUmi = umi;
  let currentUmi = embUmi;
  const tokenMintAddress = "Fyn2MTFqnGpFQjoaWdmYj43cVYsvbKfUeLdhDp3zmmZT";
  const tokenPDA = await findAssociatedTokenPda(currentUmi, {
    mint: tokenMintAddress,
    owner: currentUmi.identity.publicKey,
  });
  console.log("Token PDA", tokenPDA);
};

const fetchBalance = async () => {
  let tokenMintAddress = "53XrQrcaY6wb8T3YPByY3MMP5EEZJQRaXqnYznBgvMmX";

  let currentUmi = embUmi;
  console.log("Current UMI", currentUmi.identity.publicKey.toBase58());
  const balance = await fetchAllTokenByOwnerAndMint(
    currentUmi,
    currentUmi.identity.publicKey,
    tokenMintAddress
  );
  console.log("Balance Raw", balance);
  console.log("Balance", parseInt(balance[0].amount));
};

const getAllTokenDetails = async () => {
  const tokenMintAddress = "53XrQrcaY6wb8T3YPByY3MMP5EEZJQRaXqnYznBgvMmX";
  const asset = await fetchDigitalAsset(umi, tokenMintAddress);
  console.log("Asset", asset);
};

const transferTokensv1 = async () => {
  const tokenMintAddress = "Fyn2MTFqnGpFQjoaWdmYj43cVYsvbKfUeLdhDp3zmmZT";
  const transferIx = await transferV1(embUmi, {
    mint: tokenMintAddress,
    tokenOwner: umi.identity.publicKey,
    destinationOwner: "DiaUrAaTkuftHRkEJePworE2uT9ZhcFi1WqkAx53UxHv",
    amount: BigInt(100),
    tokenStandard: TokenStandard.Fungible,
    token: "vor3Duc1nDpUvqi9nPN449zPXfEsVammtjzeBm11uRq",
  }).sendAndConfirm(embUmi);

  console.log("Transfer Raw", transferIx);
  const signature = base58.deserialize(transferIx.signature)[0];
  console.log("Transfer", signature);
};

const transferTokensv2 = async () => {
  let currentUmi = embUmi;

  const tokenMintAddress = "Fyn2MTFqnGpFQjoaWdmYj43cVYsvbKfUeLdhDp3zmmZT";

  const sourceTokenAccount = await findAssociatedTokenPda(currentUmi, {
    mint: tokenMintAddress,
    owner: currentUmi.identity.publicKey,
  });

  console.log("Source Token Account", sourceTokenAccount);

  const destinationTokenAccount = await findAssociatedTokenPda(currentUmi, {
    mint: tokenMintAddress,
    owner: "DiaUrAaTkuftHRkEJePworE2uT9ZhcFi1WqkAx53UxHv",
  });

  console.log("Destination Token Account", destinationTokenAccount);

  const transferIx = await transferTokens(currentUmi, {
    source: sourceTokenAccount,
    destination: destinationTokenAccount,
    amount: 10, // amount of tokens to transfer*
  }).sendAndConfirm(currentUmi);

  console.log("Transfer Raw", transferIx);
  const signature = base58.deserialize(transferIx.signature)[0];
  console.log("Transfer", signature);
};

createTokens();
// getTokenPDA();
// fetchBalance();
// mintTokens();
// getAllTokenDetails();
// transferTokensv1();
// transferTokensv2();
