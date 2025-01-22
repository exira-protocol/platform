import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import dotenv from "dotenv";

import { processTransaction } from "./index.js";

dotenv.config();

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Internal server error", message: err.message });
});

app.post("/solana/buy/process-transaction", validateSignature, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    await processTransaction(req, res);
  } catch (error) {
    next(error);
  }
});

app.get("solana/buy/health", (req, res) => {
  res.send("OK");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
