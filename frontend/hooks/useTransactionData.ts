"use client";

import { useState, useEffect, useMemo } from "react";
import type {
  Transaction,
  TransactionFilters,
  TransactionStats,
} from "@/types/transaction";
import { supabase } from "@/lib/supabase";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback } from "react"; // Import useCallback
import { useGlobalState } from "@/context/GlobalStateContext";

const dummyTransactions: Transaction[] = [
  {
    id: "1",
    type: "buy",
    amount: 50,
    token: "EMBO",
    network: "Ethereum",
    hash: "0x1234...5678",
    fee: {
      amount: 0.002,
      token: "ETH",
    },
    status: "success",
    confirmations: 12,
    description: "Buy 50 EMBO shares",
    timestamp: new Date("2024-01-08T10:00:00"),
  },
  {
    id: "2",
    type: "sell",
    amount: 25,
    token: "BROK",
    network: "Ethereum",
    hash: "0x8765...4321",
    fee: {
      amount: 0.0015,
      token: "ETH",
    },
    status: "success",
    confirmations: 15,
    description: "Sell 25 BROK shares",
    timestamp: new Date("2024-01-08T09:30:00"),
  },
  {
    id: "3",
    type: "buy",
    amount: 30,
    token: "MIND",
    network: "Polygon",
    hash: "0x9876...5432",
    fee: {
      amount: 0.1,
      token: "MATIC",
    },
    status: "success",
    confirmations: 20,
    description: "Buy 30 MIND shares",
    timestamp: new Date("2024-01-07T15:45:00"),
  },
  {
    id: "4",
    type: "buy",
    amount: 40,
    token: "NXUS",
    network: "Ethereum",
    hash: "0x2468...1357",
    fee: {
      amount: 0.0018,
      token: "ETH",
    },
    status: "success",
    confirmations: 18,
    description: "Buy 40 NXUS shares",
    timestamp: new Date("2024-01-07T12:20:00"),
  },
  {
    id: "5",
    type: "sell",
    amount: 15,
    token: "EMBO",
    network: "Ethereum",
    hash: "0x1357...2468",
    fee: {
      amount: 0.0012,
      token: "ETH",
    },
    status: "success",
    confirmations: 14,
    description: "Sell 15 EMBO shares",
    timestamp: new Date("2024-01-06T16:15:00"),
  },
];

export function useTransactionData(filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // const { publicKey } = useWallet();
  const [error, setError] = useState<Error | null>(null);
  const { selectedNetwork, walletAddress } = useGlobalState();

  const fetchData = useCallback(async () => {
    if (walletAddress === "" || walletAddress === null) return;
    // if (!publicKey) return; // ⛔ Prevents fetching if wallet is not connected

    setIsLoading(true);
    try {
      // const walletAddress = publicKey.toBase58();
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("wallet_address", walletAddress);

      if (error) {
        console.error("❌ Error fetching transactions:", error.message);
        return;
      }

      console.log("🚀 Fetched transactions:", data);
      setTransactions(data || dummyTransactions); // Use real data or fallback
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch transactions")
      );
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]); // ✅ Dependency on publicKey

  useEffect(() => {
    fetchData(); // ✅ Only runs when publicKey changes
  }, [fetchData]);

  const filteredTransactions = useMemo(() => {
    if (!filters) return transactions;

    console.log("🔍 Filtering transactions:", filters, selectedNetwork);

    return transactions.filter((transaction) => {
      const matchesType =
        filters.type === "all" || transaction.txn_type === filters.type;
      const matchesNetwork =
        !filters.network || transaction.chain === selectedNetwork;
      // const matchesToken =
      //   !filters.token || transaction.token === filters.token;

      // ✅ Ensure timestamp is a Date object before comparison
      // const transactionDate =
      //   transaction.timestamp instanceof Date
      //     ? transaction.timestamp
      //     : new Date(transaction.timestamp);

      // const matchesDate =
      //   transactionDate >= new Date(filters.dateRange.start) &&
      //   transactionDate <= new Date(filters.dateRange.end);

      // return matchesType && matchesNetwork && matchesToken && matchesDate;
      return matchesType && matchesNetwork;
    });
  }, [transactions, filters]); // ✅ Runs only when transactions or filters change

  const stats: TransactionStats = useMemo(() => {
    const buyCount = transactions.filter((t) => t.txn_type === "buy").length;
    const sellCount = transactions.filter((t) => t.txn_type === "sell").length;

    return {
      total: transactions.length,
      buy: buyCount,
      sell: sellCount,
    };
  }, [transactions]);

  // return {
  //   transactions: filteredTransactions,
  //   stats,
  //   isLoading,
  //   error,
  //   fetchData,
  // };

  // sort the transactions by timestamp in descending order
  filteredTransactions.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return {
    transactions: filteredTransactions,
    stats,
    isLoading,
    error,
    fetchData, // ✅ Now this function is stable
  };
}
