import { Connection, Keypair } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { keypairIdentity } from "@metaplex-foundation/umi";
import bs58 from "bs58";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

// export const SOLANA_RPC_URL =
//   process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";

export const SOLANA_RPC_URL =
  process.env.NODE_ENV === "dev.devnet"
    ? "https://api.devnet.solana.com"
    : "https://summer-icy-bridge.solana-mainnet.quiknode.pro/59676b80a658b61070b734ff307bb7f2b5908e40";

export const connection = new Connection(SOLANA_RPC_URL);

export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const APPROVED_RECEIVERS = JSON.parse(
  process.env.APPROVED_RECEIVERS || "{}"
);

export const USDC_MINT_ADDRESS = process.env.USDC_MINT_ADDRESS;

// umi for emb
const embPKey = process.env.EMB_PRIVATE_KEY;
const embKeypair = Keypair.fromSecretKey(bs58.decode(embPKey));
export const embAddress = process.env.EMB_ADDRESS;
export const embTokenAccount = process.env.EMB_TOKEN_ACCOUNT;
export const embUsdcTokenAccount = process.env.EMB_USDC_TOKEN_ACCOUNT;
export const embUmi = createUmi(connection)
  .use(mplTokenMetadata())
  .use(keypairIdentity(embKeypair));
