import React, { useEffect } from "react";
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
import { supabase } from "@/lib/supabase";

interface TransactionValues {
  amount: string;
  tokenAmount: string;
}

interface WithdrawPanelProps {
  selectedToken: RealEstateToken;
  transactionValues: TransactionValues;
  onTokenChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const formatNumber = (value: string): string => {
  if (!value) return "0";
  const number = parseFloat(value.replace(/,/g, ""));
  if (isNaN(number)) return "0";
  return new Intl.NumberFormat("en-US").format(number);
};

export const WithdrawPanel: React.FC<WithdrawPanelProps> = ({
  selectedToken,
  transactionValues,
  onTokenChange,
}) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [usdcBalance, setUsdcBalance] = React.useState<number | null>(null);

  const listenForUsdcBalance = async () => {
    console.log("🔍 Listening for USDC balance updates...");

    let usdc = 0;

    let listenAddress = "USDC-8avB2XNZMbhEh5Qs1UFLtLWQgJVhAKVmeuDg6VYtiurq";

    // initially fetch the USDC balance
    const { data, error } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", listenAddress)
      .single();

    if (error) {
      console.error("❌ Error fetching USDC balance:", error.message);
      return;
    }

    usdc = data.value;

    console.log("🔍 Initial USDC balance:", usdc);

    const channel = supabase
      .channel("usdc-update-channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "system_config",
          filter: `key=eq.${listenAddress}`,
        },
        (payload) => {
          console.log("🔔 Transaction update received:", payload);
          setUsdcBalance(payload.new.value);
        }
      )
      .subscribe();

    // Cleanup on unmount or error
    return () => {
      console.log("🔄 Cleaning up Supabase listener...");
      supabase.removeChannel(channel);
    };
  };

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

  const processTokenTxn = async () => {
    // const toastIdI = toast.loading("Processing transaction...");
    // await listenForTransactionStatus(
    //   "3UqSNBz78cJHR75AZYuT7LM2X9KQTCQDEvhuWNrWUmVVVBWEKi7JyiGTcf7BeZTR9iKwFvV1ztKsuUVTW3q6TrHi",
    //   toastIdI
    // );

    // return;

    console.log("Processing token transaction");

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
      console.log("1.1 Processing token transaction");

      const umi = initializeUmi(connection, wallet);
      const APPROVED_RECEIVERS = JSON.parse(
        process.env.NEXT_PUBLIC_APPROVED_RECEIVERS || "{}"
      );

      // match the selectedToken.contract with the value in APPROVED_RECEIVERS and get the address
      const toAddress =
        Object.keys(APPROVED_RECEIVERS).find(
          (key) => APPROVED_RECEIVERS[key] === selectedToken.contract_solana
        ) || null;
      console.log("toAddress", toAddress);

      toast.loading("Please approve the transaction from your wallet", {
        id: toastId,
      });

      const transferIx = await transferV1(umi, {
        mint: selectedToken.contract_solana,
        tokenOwner: umi.identity.publicKey,
        destinationOwner: toAddress,
        amount: BigInt(transactionValues.tokenAmount),
        tokenStandard: TokenStandard.Fungible,
      }).sendAndConfirm(umi);

      toast.loading("Transaction confirmed", { id: toastId });

      const signature = base58.deserialize(transferIx.signature)[0];
      console.log("Transfer", signature);

      const response = await axios.post(
        process.env.NEXT_PUBLIC_SELL_BACKEND_URL +
          "/solana/sell/process-transaction",
        {
          signature: signature,
        }
      );

      if (response.status !== 200 && response.status !== 204) {
        toast.error("Transaction failed", { id: toastId });
        throw new Error("Failed to process transaction");
      } else if (response.status === 200) {
        toast.loading(
          "Your USDC is being transferred. It might take 10-30 seconds. Please wait...",
          { id: toastId }
        );
        // implement live listening feature here
        await listenForTransactionStatus(signature, toastId);
      } else if (response.status === 204) {
        toast.success(
          "Your USDC will be credited to your account in T+1 day. Please checkback later. You can check the status of your transaction in the Transactions tab.",
          { id: toastId, duration: 10000 }
        );
      }

      // toast.success("Transaction successful", { id: toastId });
    } catch (error) {
      toast.error("Transaction failed", { id: toastId });
      console.error(error);
    }
  };

  React.useEffect(() => {
    listenForUsdcBalance();
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Your Shares
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
            value={formatNumber(transactionValues.tokenAmount)}
            onChange={onTokenChange}
            className="w-[180px] text-right bg-transparent border-none focus:outline-none text-2xl font-medium"
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-md">
          ↓
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Equivalent USDC
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              U
            </div>
            <span className="text-base font-medium">USDC</span>
          </div>
          <input
            type="text"
            value={formatNumber(transactionValues.amount)}
            disabled
            className="w-[180px] text-right bg-transparent border-none focus:outline-none text-2xl font-medium text-gray-500"
          />
        </div>
      </div>

      <div className="mt-4 mb-2 p-3 py-1 bg-gray-501 dark:bg-gray-9001 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            You will get:
          </span>
          <span className="font-bold text-xl">
            {(
              Number.parseFloat(transactionValues.amount || "0") *
              (1 - selectedToken.mintFee / 100)
            ).toFixed(4)}{" "}
            USDC
          </span>
        </div>
        <div className="flex justify-between items-center text-xs mt-1">
          <span className="text-gray-500 dark:text-gray-500">
            Includes {selectedToken.mintFee}% minting fee deduction
          </span>
        </div>
      </div>

      <Button
        className="w-full bg-black text-white hover:bg-gray-800 text-base py-5"
        size="lg"
        onClick={processTokenTxn}
      >
        Pay Now
      </Button>

      <div className="space-y-2 pt-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Processing Time
          </span>
          <span>T+1 Day</span>
        </div>
      </div>
    </div>
  );
};
