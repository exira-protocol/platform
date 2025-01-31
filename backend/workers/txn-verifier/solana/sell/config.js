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

// export const APPROVED_RECEIVERS = JSON.parse(
//   process.env.APPROVED_RECEIVERS || "{}"
// );

// each receiver has a corresponding contract address of the EXIRA token address
export const APPROVED_RECEIVERS = {
  J6GT31oStsR1pns4t6P7fs3ARFNo9DCoYjANuNJVDyvN:
    "53XrQrcaY6wb8T3YPByY3MMP5EEZJQRaXqnYznBgvMmX",
  DiaUrAaTkuftHRkEJePworE2uT9ZhcFi1WqkAx53UxHv: 3,
  Ez1Y8ygX8TRwCbDEnu3r24hrjuDvxxy6qc15EKQgPvD5: 4,
};

export const APPROVED_TOKEN_MINT = process.env.APPROVED_TOKEN_MINT;

const a1PKey = process.env.A1_PRIVATE_KEY;
const keypair = Keypair.fromSecretKey(bs58.decode(a1PKey));

export const umi = createUmi(connection)
  .use(mplTokenMetadata())
  .use(keypairIdentity(keypair));

export const TOKEN_ACCOUNT = process.env.TOKEN_ACCOUNT;
