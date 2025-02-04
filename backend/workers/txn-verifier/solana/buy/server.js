import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import dotenv from "dotenv";
import { logger } from "./config.js"; // Import the logger
import { processTransaction } from "./index.js";

// const express = require("express");
// const bodyParser = require("body-parser");
// const helmet = require("helmet");
// const cors = require("cors");
// const rateLimit = require("express-rate-limit");
// const { body, validationResult } = require("express-validator");
// const dotenv = require("dotenv");
// const { processTransaction } = require("./index.js");
// const logger = require("./config.js").logger;

dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

const app = express();
const port = process.env.PORT || 3000;

// Basic security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : "*",
  methods: ["POST", "GET"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(bodyParser.json());

// Input validation middleware
const validateSignature = [
  body("signature").isString().isLength({ min: 32, max: 128 }).trim(),
];

app.use((req, res, next) => {
  logger.info(`📥 Incoming Request: ${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  logger.error(`❌ Server Error: ${err.message}`);
  res
    .status(500)
    .json({ error: "Internal server error", message: err.message });
});

app.post(
  "/solana/buy/process-transaction",
  validateSignature,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await processTransaction(req, res);
    } catch (error) {
      next(error);
    }
  }
);

app.get("solana/buy/health", (req, res) => {
  res.send("OK");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Passed Variable: ${process.env.NODE_ENV}`);
  console.log("Environment Variable: ", process.env.ENVIRONMENT);
  // console.log("All Environment Variables: ", process.env);
});
