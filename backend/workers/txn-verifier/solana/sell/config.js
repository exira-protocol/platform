import { Connection, Keypair } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { keypairIdentity } from "@metaplex-foundation/umi";
import bs58 from "bs58";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

export const SOLANA_RPC_URL =
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
export const connection = new Connection(SOLANA_RPC_URL);

export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const APPROVED_RECEIVERS = JSON.parse(
  process.env.APPROVED_RECEIVERS || "{}"
);

export const USDC_TOKEN_MINT_ADDRESS = process.env.USDC_TOKEN_MINT_ADDRESS;

const a1PKey = process.env.MASTER_PRIV_KEY;
const keypair = Keypair.fromSecretKey(bs58.decode(a1PKey));

export const umi = createUmi(connection)
  .use(mplTokenMetadata())
  .use(keypairIdentity(keypair));

export const USDC_TOKEN_ADDRESS = process.env.USDC_TOKEN_ADDRESS;
