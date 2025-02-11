import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import dotenv from "dotenv";
import bs58 from "bs58";
import fs from "fs";
import idl from "./idl.json" assert { type: "json" };

dotenv.config();

// Load environment variables
const TESTER_PRIVATE_KEY = process.env.PRIVATE_KEY;

// Set up a connection to the Devnet cluster
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Load Admin Keypair from JSON file
const keypairJson = JSON.parse(
  fs.readFileSync(
    "/home/manuareraa/Manu/github/exira/platform/backend/internal/smart-contract/payer.json",
    "utf8"
  )
);
const secretKey = Uint8Array.from(keypairJson);
const adminKeypair = Keypair.fromSecretKey(secretKey);

console.log("Admin Address:", adminKeypair.publicKey.toBase58());
// print admin private key
console.log("Admin Private Key:", adminKeypair.secretKey);

// Load Tester Keypair from private key string
const testerKeypair = Keypair.fromSecretKey(bs58.decode(TESTER_PRIVATE_KEY));

// Set up Anchor Providers for Admin and Tester
const adminProvider = new AnchorProvider(connection, new Wallet(adminKeypair), {
  commitment: "confirmed",
});

const testerProvider = new AnchorProvider(
  connection,
  new Wallet(testerKeypair),
  {
    commitment: "confirmed",
  }
);

console.log("Tester Address:", testerKeypair.publicKey.toBase58());

// Program ID from your deployed contract (replace with actual program ID)
const PROGRAM_ID = new PublicKey(
  "CsrCMpn2jbypJKptFtEoYwdUUoQwYfgia6gbCtS58D6H"
);

console.log("Program ID (1):", PROGRAM_ID.toBase58());
console.log("IDL Metadata Address:", idl.metadata?.address);
console.log("Program ID:", PROGRAM_ID.toBase58());
// const program = new Program(idl, PROGRAM_ID, adminProvider);
const program = new Program(idl);
// const program = new Program(idl, {
//   connection,
// });

console.log("Program ID (2.0):");
console.log("Program ID (2):", program);

// USDC Mint Address (Devnet)
const USDC_MINT = new PublicKey("53XrQrcaY6wb8T3YPByY3MMP5EEZJQRaXqnYznBgvMmX");

// SPL Token Mint Address (replace with your actual SPL token mint address)
const SPL_TOKEN_MINT = new PublicKey(
  "Fyn2MTFqnGpFQjoaWdmYj43cVYsvbKfUeLdhDp3zmmZT"
);

// Helper function to derive PDAs
const findProgramAddressSync = async (seeds) => {
  return await PublicKey.findProgramAddressSync(seeds, PROGRAM_ID);
};

// Helper: Fetch associated token account
const getAssociatedTokenAccount = async (mint, owner) => {
  return await getAssociatedTokenAddress(mint, owner);
};

// Fetch token balances
const fetchBalances = async () => {
  console.log("Fetching token balances...");
  const usdcAccount = await getAssociatedTokenAccount(
    USDC_MINT,
    testerKeypair.publicKey
  );
  const splAccount = await getAssociatedTokenAccount(
    SPL_TOKEN_MINT,
    testerKeypair.publicKey
  );

  const usdcBalance = await connection.getTokenAccountBalance(usdcAccount);
  const splBalance = await connection.getTokenAccountBalance(splAccount);

  console.log(`USDC Balance: ${usdcBalance.value.uiAmount}`);
  console.log(`SPL Token Balance: ${splBalance.value.uiAmount}`);
};

// Swap USDC for SPL Token
const swapUsdcForSpl = async (amountUsdc) => {
  console.log(`Swapping ${amountUsdc / 1_000_000} USDC for SPL Tokens...`);

  const [swapDataPda] = await findProgramAddressSync([
    Buffer.from("swap_data"),
  ]);
  const [usdcVaultPda] = await findProgramAddressSync([
    Buffer.from("vault"),
    USDC_MINT.toBuffer(),
  ]);
  const [splVaultPda] = await findProgramAddressSync([
    Buffer.from("vault"),
    SPL_TOKEN_MINT.toBuffer(),
  ]);

  const userUsdcAccount = await getAssociatedTokenAccount(
    USDC_MINT,
    testerKeypair.publicKey
  );
  const userSplAccount = await getAssociatedTokenAccount(
    SPL_TOKEN_MINT,
    testerKeypair.publicKey
  );

  const txSignature = await program.methods
    .swapUsdcForSpl(new anchor.BN(amountUsdc)) // Pass the amount of USDC to swap
    .accounts({
      user: testerKeypair.publicKey,
      usdcMint: USDC_MINT,
      usdcVault: usdcVaultPda,
      userUsdcAccount: userUsdcAccount,
      splTokenMint: SPL_TOKEN_MINT,
      splTokenVault: splVaultPda,
      userSplAccount: userSplAccount,
      swapData: swapDataPda,
      tokenVault: usdcVaultPda,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log(`USDC swapped for SPL tokens. Transaction ID: ${txSignature}`);
};

// Swap SPL Token for USDC
const swapSplForUsdc = async (amountSpl) => {
  console.log(`Swapping ${amountSpl / 1_000_000} SPL Tokens for USDC...`);

  const [swapDataPda] = await findProgramAddressSync([
    Buffer.from("swap_data"),
  ]);
  const [usdcVaultPda] = await findProgramAddressSync([
    Buffer.from("vault"),
    USDC_MINT.toBuffer(),
  ]);
  const [splVaultPda] = await findProgramAddressSync([
    Buffer.from("vault"),
    SPL_TOKEN_MINT.toBuffer(),
  ]);

  const userUsdcAccount = await getAssociatedTokenAccount(
    USDC_MINT,
    testerKeypair.publicKey
  );
  const userSplAccount = await getAssociatedTokenAccount(
    SPL_TOKEN_MINT,
    testerKeypair.publicKey
  );

  const txSignature = await program.methods
    .swapSplForUsdc(new anchor.BN(amountSpl)) // Pass the amount of SPL to swap
    .accounts({
      user: testerKeypair.publicKey,
      usdcMint: USDC_MINT,
      usdcVault: usdcVaultPda,
      userUsdcAccount: userUsdcAccount,
      splTokenMint: SPL_TOKEN_MINT,
      splTokenVault: splVaultPda,
      userSplAccount: userSplAccount,
      swapData: swapDataPda,
      tokenVault: splVaultPda,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log(`SPL tokens swapped for USDC. Transaction ID: ${txSignature}`);
};

// Update Swap Price (Admin Function)
const updateSwapPrice = async (newPrice) => {
  console.log(
    `Updating swap price to ${newPrice / 1_000_000} USDC per SPL Token...`
  );

  const [swapDataPda] = await findProgramAddressSync([
    Buffer.from("swap_data"),
  ]);

  // Use the admin provider to send the transaction
  const adminProgram = new Program(idl, PROGRAM_ID, adminProvider);

  const txSignature = await adminProgram.methods
    .updatePrice(new anchor.BN(newPrice)) // New price in smallest units
    .accounts({
      swapData: swapDataPda,
      admin: adminKeypair.publicKey,
    })
    .rpc();

  console.log(`Swap price updated. Transaction ID: ${txSignature}`);
};

// Execute the workflow

await fetchBalances(); // Fetch initial balances

// await swapUsdcForSpl(1_000_000); // Swap 1 USDC for SPL tokens
// await swapSplForUsdc(1_000_000); // Swap 1 SPL token back to USDC

// await updateSwapPrice(1_500_000); // Update price to 1.5 USDC per SPL token

// await fetchBalances(); // Fetch balances after transactions
