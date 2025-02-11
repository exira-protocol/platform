import BN from "bn.js";
import * as anchor from "@coral-xyz/anchor";
// import type { TokenSwap } from "../target/types/token_swap";

// Configure the client to use the local cluster
anchor.setProvider(anchor.AnchorProvider.env());

const program = anchor.workspace.TokenSwap;

const { SystemProgram, PublicKey } = anchor.web3;

async function updatePrice(newPrice) {
  const [swapDataPda] = await PublicKey.findProgramAddressSync(
    [Buffer.from("swap_data")],
    program.programId
  );

  const tx = await program.methods
    .updatePrice(new anchor.BN(newPrice))
    .accounts({
      swapData: swapDataPda,
      admin: program.provider.publicKey, // Only admin can update the price
    })
    .rpc();

  console.log(`Price updated to ${newPrice}. Transaction ID: ${tx}`);
}

// Example: Update price to 1 USDC per SPL token (1 * 1,000,000)
updatePrice(1000000);
