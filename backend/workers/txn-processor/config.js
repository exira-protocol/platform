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

export const USDC_MINT_ADDRESS = process.env.USDC_MINT_ADDRESS;

const a1PKey = process.env.A1_PRIVATE_KEY;
const keypair = Keypair.fromSecretKey(bs58.decode(a1PKey));

export let umi = createUmi(connection)
  .use(mplTokenMetadata())
  .use(keypairIdentity(keypair));

// umi for emb
const embPKey = process.env.EMB_PRIVATE_KEY;
const embKeypair = Keypair.fromSecretKey(bs58.decode(embPKey));
export const embAddress = process.env.EMB_ADDRESS;
export const embTokenAccount = process.env.EMB_TOKEN_ACCOUNT;
export const embUmi = createUmi(connection)
  .use(mplTokenMetadata())
  .use(keypairIdentity(embKeypair));

// umi for nex
const nexPKey = process.env.NEX_PRIVATE_KEY;
const nexKeypair = Keypair.fromSecretKey(bs58.decode(nexPKey));
export const nexAddress = process.env.NEX_ADDRESS;
export const nexUmi = createUmi(connection)
  .use(mplTokenMetadata())
  .use(keypairIdentity(nexKeypair));

export const TOKEN_ACCOUNT = process.env.TOKEN_ACCOUNT;
