import { Connection, Keypair } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { keypairIdentity } from "@metaplex-foundation/umi";
import bs58 from "bs58";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";

dotenv.config();

// Ensure logs directory exists
const logDir = "./logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Configure logger
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new DailyRotateFile({
      filename: `${logDir}/worker-%DATE%.log`,
      datePattern: "YYYY-MM-DD-HH",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "7d",
      interval: "6h", // Log rotation every 6 hours
    }),
    new winston.transports.Console(),
  ],
});

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
