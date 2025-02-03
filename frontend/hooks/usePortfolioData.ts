"use client";

import { useState, useEffect } from "react";
import type {
  Asset,
  PortfolioStats,
  PortfolioActivity,
  TimeSeriesData,
  AssetDistribution,
} from "@/types/portfolio";
import { supabase } from "@/lib/supabase";
import { useGlobalState } from "@/context/GlobalStateContext";
import { useTransactionData } from "./useTransactionData";
import { useDashboardData } from "./useDashboardData";

// Updated dummy data to reflect real estate shares
const dummyAssets: Asset[] = [
  {
    symbol: "EMBO",
    name: "Embassy Office Parks REIT",
    shares: 100,
    price: 345.5,
    change: 2.5,
    currentValue: 34550,
  },
  {
    symbol: "BROK",
    name: "Brookfield India Real Estate Trust",
    shares: 150,
    price: 275.25,
    change: -1.2,
    currentValue: 41287.5,
  },
  {
    symbol: "MIND",
    name: "Mindspace Business Parks REIT",
    shares: 80,
    price: 320.75,
    change: 1.8,
    currentValue: 25660,
  },
  {
    symbol: "NXUS",
    name: "Nexus Select Trust REIT",
    shares: 120,
    price: 298.5,
    change: 0.9,
    currentValue: 35820,
  },
];

const dummyStats: PortfolioStats = {
  totalValue: 137317.5,
  dailyChange: {
    amount: 1852.5,
    percentage: 1.37,
  },
  portfolioHealth: 98,
  totalAssets: 4,
  chainCount: 2,
};

const dummyActivities: PortfolioActivity[] = [
  {
    id: "1",
    type: "Buy",
    asset: "EMBO",
    amount: "50 shares",
    value: 17275,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: "2",
    type: "Sell",
    asset: "BROK",
    amount: "25 shares",
    value: 6881.25,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    id: "3",
    type: "Buy",
    asset: "MIND",
    amount: "30 shares",
    value: 9622.5,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
];

const dummyTimeSeriesData: TimeSeriesData[] = [
  { date: "2023-08-26", value: 6500 },
  { date: "2023-08-27", value: 6800 },
  { date: "2023-08-28", value: 6600 },
  { date: "2023-08-29", value: 7000 },
  { date: "2023-08-30", value: 7200 },
  { date: "2023-08-31", value: 7100 },
  { date: "2023-09-01", value: 7291.32 },
];

const tokenIdMapping = {
  "2": "EXEMB",
  "3": "EMBO",
  "4": "MIND",
  "5": "BROK",
};

export function usePortfolioData() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [activities, setActivities] = useState<PortfolioActivity[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { walletAddress } = useGlobalState();
  const { fetchData: fetchTxnData, transactions } = useTransactionData();
  const { fetchData: fetchTokenData, tokens: tokenData } = useDashboardData();
  const [distributionData, setDistributionData] = useState([]);

  // Calculate distribution data based on assets
  // const distributionData: AssetDistribution[] = assets.map((asset, index) => ({
  //   name: asset.symbol,
  //   value: asset.currentValue,
  //   color: ["#10B981", "#6366F1", "#F59E0B", "#EC4899", "#8B5CF6"][index % 5],
  // }));

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      // await new Promise(resolve => setTimeout(resolve, 2000))
      const base58WalletAddress = walletAddress?.toBase58();
      console.log("🔍 v2 Fetching user portfolio data...", base58WalletAddress);
      const { data: statsData, error: statsError } = await supabase
        .from("user_portfolio_mv")
        .select("*")
        .eq("wallet_address", base58WalletAddress);

      if (statsError) {
        console.error(
          "❌ Error fetching user portfolio data:",
          statsError.message
        );
        return;
      }

      console.log("📈 Fetched user portfolio data:", statsData[0]);
      setStats(statsData[0]);

      console.log("🔍 Fetching timeseries data...", base58WalletAddress);
      const { data: timeSeriesData, error: timeseriesError } = await supabase
        .from("portfolio_timeseries")
        .select("*")
        .eq("wallet_address", base58WalletAddress);

      if (timeseriesError) {
        console.error(
          "❌ Error fetching timeseries data:",
          timeseriesError.message
        );
        return;
      }

      console.log("📈 Fetched timeseries data:", timeSeriesData);

      // loop through the timeseries data and convert the data to the format required by the chart
      const formattedTimeSeriesData = timeSeriesData.map((data: any) => ({
        // convert timestamp to date string
        date: new Date(data.timestamp).toISOString().split("T")[0],
        value: data.portfolio_value.toFixed(2),
      }));

      console.log("📈 Formatted timeseries data:", formattedTimeSeriesData);
      setTimeSeriesData(formattedTimeSeriesData);

      // const { recentTxns, portfolioDistribution, mergedPortfolioData } =
      //   processTransactionData(transactions, tokenIdMapping, tokenData);

      // console.log(
      //   "Bigdata: ",
      //   recentTxns,
      //   portfolioDistribution,
      //   mergedPortfolioData
      // );

      // setAssets(dummyAssets);
      // setActivities(dummyActivities);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch portfolio data")
      );
    } finally {
      setIsLoading(false);
    }
  };

  function processTransactionData(transactions, tokenIdMapping, shareData) {
    console.log("🔍 Processing transaction data...", transactions);
    // 🔹 Step 1: Process Recent Transactions (latest 5)
    const recentTxns = transactions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Sort descending by date
      .slice(0, 5) // Take only the latest 5 transactions
      .map((txn) => ({
        shareSymbol: tokenIdMapping[txn.share_id], // Get share symbol from mapping
        quantity: txn.quantity,
        txn_type: txn.txn_type,
        date: new Date(txn.timestamp).toLocaleDateString("en-US"), // Format date as MM/DD/YYYY
        value: txn.quantity * txn.price_per_share, // Calculate value
      }));

    console.log("📈 Recent transactions:", recentTxns);
    // 🔹 Step 2: Calculate Portfolio Distribution (Net holdings per token)
    const portfolioDistribution = transactions.reduce((acc, txn) => {
      const shareSymbol = tokenIdMapping[txn.share_id]; // Get share symbol

      // Initialize if not present
      if (!acc[shareSymbol]) acc[shareSymbol] = 0;

      // Add or subtract based on txn_type
      acc[shareSymbol] += txn.txn_type === "buy" ? txn.quantity : -txn.quantity;

      return acc;
    }, {});

    console.log("📊 Portfolio distribution:", portfolioDistribution);

    console.log("📊 Share data:", shareData);
    // 🔹 Step 3: Filter Portfolio to Include Only Tokens Present in Portfolio Distribution
    const mergedPortfolioData = Object.entries(portfolioDistribution)
      .filter(([_, quantity]) => quantity > 0) // Only include tokens with a positive quantity
      .map(([shareSymbol, quantity]) => {
        console.log("🔍 Share symbol:", shareSymbol, quantity);

        const shareInfo = shareData.find(
          (share) => share.symbol === shareSymbol
        );

        console.log("🔍 Share info:", shareInfo, shareSymbol);

        return {
          shareSymbol,
          quantity,
          name: shareInfo?.name || "Unknown",
          trend: shareInfo?.change24h || 0,
          in_USD: shareInfo?.in_USD || 0,
        };
      });

    setAssets(mergedPortfolioData);
    setActivities(recentTxns);
    setDistributionData(portfolioDistribution);

    return { recentTxns, portfolioDistribution, mergedPortfolioData };
  }

  useEffect(() => {
    if (walletAddress !== "" && walletAddress !== null) {
      console.log("🔍 Executing Data Fetchers:", walletAddress);
      fetchData();
      fetchTxnData();
      fetchTokenData();
    }
  }, [walletAddress]);

  useEffect(() => {
    if (transactions.length > 0 && tokenData.length > 0) {
      console.log("🔍 Processing Portfolio Data [2]:", transactions, tokenData);
      const { recentTxns, portfolioDistribution, mergedPortfolioData } =
        processTransactionData(transactions, tokenIdMapping, tokenData);

      console.log(
        "Bigdata: ",
        recentTxns,
        portfolioDistribution,
        mergedPortfolioData
      );
    }
  }, [transactions, tokenData]);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // setAssets(dummyAssets);
      // setStats(dummyStats);
      // setActivities(dummyActivities);
      // setTimeSeriesData(dummyTimeSeriesData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to refresh portfolio data")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    assets,
    stats,
    activities,
    timeSeriesData,
    distributionData,
    isLoading,
    error,
    refreshData,
    fetchData,
  };
}
