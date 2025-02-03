// require("dotenv").config();
// const axios = require("axios");
// const { createClient } = require("@supabase/supabase-js");
// const winston = require("winston");
// const DailyRotateFile = require("winston-daily-rotate-file");

import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import dotenv from "dotenv";

dotenv.config();

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const STOCK_API_URL =
  "https://api.moneycontrol.com/mcapi/v1/stock/get-stock-price?scIdList=EOP%2CNST02%2CMBP02%2CBIR&scId=EOP";
const EXCHANGE_API_URL =
  "https://api.freecurrencyapi.com/v1/latest?apikey=fca_live_QzLBm4pM9S1aJ2JVg5ySvrgMgkOyiR8mcu8pZBZc&base_currency=INR&currencies=USD";

// Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Logger configuration
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: "logs/stock-updater-%DATE%.log",
      datePattern: "YYYY-MM-DD-HH",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "24h",
    }),
    new winston.transports.Console(),
  ],
});

// Stock symbol mapping
const stockMap = {
  "Embassy Office": "EXEMB",
  "Nexus Select": "EXNXE",
  "Mindspace REIT": "EXMSP",
  "Brookfield REIT": "EXBRK",
};

const TELEGRAM_BOT = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramAlert(message) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`;
    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: `🚨 *[BE] Stock-Script Error* 🚨\n\n${message}`,
      parse_mode: "Markdown",
    };

    await axios.post(url, payload);
    console.log("🚀 Telegram alert sent successfully.");
  } catch (error) {
    console.error("❌ Failed to send Telegram alert:", error.message);
  }
}

async function fetchStockPrices() {
  try {
    logger.info("Fetching stock data from API...");
    const response = await axios.get(STOCK_API_URL);

    if (response.data.success !== 1) {
      throw new Error("API did not return success status");
    }

    const stocks = response.data.data;
    const updates = [];

    stocks.forEach((stock) => {
      const token_symbol = stockMap[stock.companyName];
      if (!token_symbol) return;

      updates.push({
        token_symbol,
        price: parseFloat(stock.lastPrice),
        current_trend: parseFloat(stock.perChange),
      });
    });

    if (updates.length > 0) {
      await updateDatabase(updates);
    }
  } catch (error) {
    logger.error(`Error fetching stock data: ${error.message}`);
    await sendTelegramAlert(
      `Error occured while fetching the data from the MoneyControl API. Details - ${error.message}`
    );
  }
}

async function updateDatabase(updates) {
  try {
    logger.info("Updating stock data in Supabase...");

    for (const update of updates) {
      const { data, error } = await supabase
        .from("shares")
        .update({ price: update.price, current_trend: update.current_trend })
        .eq("token_symbol", update.token_symbol);

      await supabase.rpc("refresh_both_views_incremental_all");

      if (error) {
        logger.error(`Error updating ${update.token_symbol}: ${error.message}`);
      } else {
        logger.info(
          `Successfully updated ${update.token_symbol}: Price - ${update.price}, Trend - ${update.current_trend}`
        );
      }
    }
  } catch (error) {
    logger.error(`Database update error: ${error.message}`);
    await sendTelegramAlert(
      `Error occured while updating the stock price in the database (using MoneyControl API). Details - ${error.message}`
    );
  }
}

async function updateExchangeRates() {
  while (true) {
    try {
      logger.info("Fetching latest exchange rates...");
      const response = await axios.get(EXCHANGE_API_URL);
      console.log(response.data);
      const exchangeRate = response.data.data.USD;
      console.log(exchangeRate);

      if (!exchangeRate) {
        throw new Error("Failed to retrieve USD exchange rate");
      }

      logger.info(`Exchange rate (INR to USD): ${exchangeRate}`);

      const { data: shares, error } = await supabase
        .from("shares")
        .select("id, price");
      if (error) {
        throw new Error(`Failed to fetch shares: ${error.message}`);
      }

      for (const share of shares) {
        const inUSD = share.price * exchangeRate;
        await supabase
          .from("shares")
          .update({ in_USD: inUSD })
          .eq("id", share.id);
      }

      logger.info("Successfully updated share prices in USD.");
    } catch (error) {
      logger.error(`Error updating exchange rates: ${error.message}`);
      await sendTelegramAlert(
        `Error updating exchange rates: ${error.message}`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait for 5 seconds
  }
}

async function main() {
  setTimeout(updateExchangeRates, 0); // Start exchange rate updates immediately
  while (true) {
    await fetchStockPrices();

    const randomDelay = 1800 + Math.floor(Math.random() * 21);
    logger.info(`Waiting for ${randomDelay} seconds before next fetch.`);

    await new Promise((resolve) => setTimeout(resolve, randomDelay * 1000));
  }
}

main().catch((error) => logger.error(`Unexpected error: ${error.message}`));
