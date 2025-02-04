// 'use client'

import React from "react";
import { Button } from "@/components/ui/button";
import { RealEstateToken } from "@/hooks/useDashboardData";
import toast from "react-hot-toast";
import {
  transferV1,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { initializeUmi } from "./solanaUtils";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface TransactionValues {
  amount: string;
  tokenAmount: string;
}

interface TransactionPanelProps {
  selectedToken: RealEstateToken;
  transactionValues: TransactionValues;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTokenChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  transactionType: "buy" | "withdraw";
}

const formatNumber = (value: string): string => {
  if (!value) return "0";
  const number = parseFloat(value.replace(/,/g, ""));
  if (isNaN(number)) return "0";
  return new Intl.NumberFormat("en-US").format(number);
};

export const TransactionPanel: React.FC<TransactionPanelProps> = ({
  selectedToken,
  transactionValues,
  onAmountChange,
  onTokenChange,
  transactionType,
}) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const listenForTransactionStatus = (
    usdcHash: string,
    toastId
  ): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      console.log(`🔍 Checking initial transaction status for ID: ${usdcHash}`);

      // 1️⃣ Fetch latest transaction status BEFORE listening
      const { data, error } = await supabase
        .from("transactions")
        .select("status")
        .eq("usdc_hash", usdcHash)
        .single(); // Expecting only one record

      if (error) {
        console.error("❌ Error fetching transaction:", error.message);
        return;
      }

      console.log(`🔍 Initial status: ${data.status}`);

      // 2️⃣ If already "success" or "failed", process immediately and return
      if (data.status === "success") {
        console.log("✅ Transaction already completed");
        toast.success("Tokens minted successfully to your wallet.", {
          id: toastId,
        });
        return; // No need to listen further
      } else if (data.status === "failed") {
        console.log("❌ Transaction already failed");
        toast.error("Transaction failed. Please contact us via mail.", {
          id: toastId,
        });
        return; // No need to listen
      }

      console.log("🔍 Listening for transaction updates on hash:", usdcHash);

      const channel = supabase
        .channel("transactions-update-channel")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "transactions",
            filter: `usdc_hash=eq.${usdcHash}`,
          },
          (payload) => {
            console.log("🔔 Transaction update received:", payload);

            const newStatus = payload.new.status;

            if (newStatus === "success") {
              console.log("✅ Transaction completed. Stopping listener.");
              toast.success("Tokens minted successfully to your wallet.", {
                id: toastId,
              });
              supabase.removeChannel(channel); // Stop listening
              resolve("success");
            } else if (newStatus === "failed") {
              console.log("❌ Transaction failed. Stopping listener.");
              toast.error("Transaction failed. Please contact us via mail.", {
                id: toastId,
              });
              supabase.removeChannel(channel); // Stop listening
              reject(new Error("Transaction failed"));
            } else {
              console.log(`⏳ Transaction still pending: ${newStatus}`);
            }
          }
        )
        .subscribe();

      // Cleanup on unmount or error
      return () => {
        console.log("🔄 Cleaning up Supabase listener...");
        supabase.removeChannel(channel);
      };
    });
  };

  const processUSDCTxn = async () => {
    // const toastIdI = toast.loading("Processing transaction...");
    // await listenForTransactionStatus(
    //   "3UqSNBz78cJHR75AZYuT7LM2X9KQTCQDEvhuWNrWUmVVVBWEKi7JyiGTcf7BeZTR9iKwFvV1ztKsuUVTW3q6TrHi",
    //   toastIdI
    // );

    // return;

    console.log("Processing USDC transaction");

    if (transactionValues.amount === "0") {
      toast.error("Please enter a valid amount to transfer");
      return;
    } else if (parseFloat(transactionValues.amount) <= 0) {
      toast.error("Please enter a valid amount to transfer");
      return;
    } else if (parseFloat(transactionValues.tokenAmount) <= 0) {
      toast.error("Please enter a valid amount to transfer");
      return;
    }

    // 🔹 Show loading toast before starting the transaction
    const toastId = toast.loading("Processing transaction...");

    try {
      console.log("1.1 Processing USDC transaction");

      const umi = initializeUmi(connection, wallet);

      const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || "devnet";

      let APPROVED_RECEIVERS = {};

      if (APP_ENV === "mainnet") {
        APPROVED_RECEIVERS = JSON.parse(
          process.env.NEXT_PUBLIC_APPROVED_RECEIVERS || "{}"
        );
      } else {
        APPROVED_RECEIVERS = JSON.parse(
          process.env.NEXT_PUBLIC_APPROVED_RECEIVERS_DEVNET || "{}"
        );
      }

      // APPROVED_RECEIVERS='{"8avB2XNZMbhEh5Qs1UFLtLWQgJVhAKVmeuDg6VYtiurq": "Fyn2MTFqnGpFQjoaWdmYj43cVYsvbKfUeLdhDp3zmmZT", "22wx2tyVWhfjsqhF6MXjpry4rnqZKgAMdPwMsZPsTDZ5": "7KL2fTEWgkeZyCbwGkfvLtHingV3ntFvtS1vT2o48rHZ", "J6GT31oStsR1pns4t6P7fs3ARFNo9DCoYjANuNJVDyvN": "53XrQrcaY6wb8T3YPByY3MMP5EEZJQRaXqnYznBgvMmX"}'

      // match the selectedToken.contract with the value in APPROVED_RECEIVERS and get the address
      const toAddress =
        Object.keys(APPROVED_RECEIVERS).find(
          (key) => APPROVED_RECEIVERS[key] === selectedToken.contract_solana
        ) || null;
      console.log("toAddress", toAddress);

      // Original
      // const USDCAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
      // Dummy
      // const USDCAddress = "53XrQrcaY6wb8T3YPByY3MMP5EEZJQRaXqnYznBgvMmX";

      let USDCAddress = "";

      if (APP_ENV === "mainnet") {
        USDCAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS || "";
      } else {
        USDCAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS_DEVNET || "";
      }

      // const USDCAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS || "";
      // const toAddress = "8avB2XNZMbhEh5Qs1UFLtLWQgJVhAKVmeuDg6VYtiurq";

      const preciseAmount =
        parseFloat(transactionValues.amount) +
        (parseFloat(transactionValues.amount) * selectedToken.mintFee) / 100;
      const scaledAmount = Math.round(preciseAmount * 1_000_000); // Convert to USDC smallest unit

      console.log("1.2 Processing USDC transaction", scaledAmount);

      toast.loading("Please approve the transaction from your wallet", {
        id: toastId,
      });

      const transferIx = await transferV1(umi, {
        mint: USDCAddress,
        tokenOwner: umi.identity.publicKey,
        destinationOwner: toAddress,
        amount: BigInt(scaledAmount),
        tokenStandard: TokenStandard.Fungible,
      }).sendAndConfirm(umi);

      toast.loading("Transaction confirmed. Please wait...", { id: toastId });

      const signature = base58.deserialize(transferIx.signature)[0];
      console.log("Transfer", signature);

      let backendUrl = "";

      if (APP_ENV === "mainnet") {
        backendUrl = process.env.NEXT_PUBLIC_BUY_BACKEND_URL || "";
      } else {
        backendUrl = process.env.NEXT_PUBLIC_BUY_BACKEND_URL_DEVNET || "";
      }

      const response = await axios.post(
        backendUrl + "/solana/buy/process-transaction",
        {
          signature: signature,
        }
      );

      if (response.status !== 200 && response.status !== 204) {
        toast.error("Transaction failed", { id: toastId });
        throw new Error("Failed to process transaction");
      } else if (response.status === 200) {
        toast.loading(
          "Your tokens are being minted. It might take 10-30 seconds. Please wait...",
          { id: toastId }
        );
        // implement live listening feature here
        await listenForTransactionStatus(signature, toastId);
      } else if (response.status === 204) {
        toast.success(
          "Your tokens will be minted and credited to your account in T+1 day. Please checkback later. You can check the status of your transaction in the Transactions tab.",
          { id: toastId, duration: 10000 }
        );
      }

      toast.success("Transaction successful", { id: toastId });
    } catch (error) {
      toast.error("Transaction failed", { id: toastId });
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Balance
          </span>
          <span className="text-sm">0 USDC</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              U
            </div>
            <span className="text-base font-medium">USDC</span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs bg-transparent border-gray-300 hover:bg-gray-100"
            >
              MAX
            </Button>
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={formatNumber(transactionValues.amount)}
            onChange={onAmountChange}
            className="w-[180px] text-right bg-transparent border-none focus:outline-none text-2xl font-medium"
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm">
          {transactionType === "buy" ? "↓" : "↑"}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Rate</span>
          <span className="text-sm">
            1 {selectedToken.symbol} ≈ ${selectedToken.in_USD.toFixed(4)} USDC
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {selectedToken.symbol.charAt(0)}
            </div>
            <span className="text-base font-medium">
              {selectedToken.symbol}
            </span>
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={formatNumber(transactionValues.tokenAmount)}
            onChange={onTokenChange}
            className="w-[180px] text-right bg-transparent border-none focus:outline-none text-2xl font-medium"
            placeholder="0"
          />
        </div>
      </div>

      <div className="mt-4 mb-2 p-3 py-1 bg-gray-501 dark:bg-gray-9001 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Total to Pay:
          </span>
          <span className="font-bold text-xl">
            {/* add mintFee% to the transactionValues.amount */}
            {(
              Number.parseFloat(transactionValues.amount || "0") *
              (1 + selectedToken.mintFee / 100)
            ).toFixed(4)}{" "}
            USDC
          </span>
        </div>
        <div className="flex justify-between items-center text-xs mt-1">
          <span className="text-gray-500 dark:text-gray-500">
            Includes {selectedToken.mintFee}% mint fee
          </span>
        </div>
      </div>

      <Button
        className="w-full bg-black text-white hover:bg-gray-800 text-base py-5"
        size="lg"
        onClick={processUSDCTxn}
      >
        Pay Now
      </Button>

      <div className="space-y-2 pt-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400 underline">
            Allowance
          </span>
          <span>
            {selectedToken.maxAllowance.toLocaleString()} {selectedToken.symbol}
          </span>
        </div>
        {/* <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Instantly Available
        </span>
        <span>
          {selectedToken.instantlyAvailable.toLocaleString()}{" "}
          {selectedToken.symbol}
        </span>
      </div> */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Processing Time
          </span>
          {
            <>
              {parseFloat(transactionValues.amount) >
              selectedToken.maxAllowance ? (
                <span>T+1 day </span>
              ) : (
                <span>Instant </span>
              )}
            </>
          }
        </div>
      </div>
    </div>
  );
};
