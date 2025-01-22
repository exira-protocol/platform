import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface DashboardData {
  totalValueLocked: number;
  activeUsers: number;
  totalProcessedValue: number;
  totalTransactions: number;
}

export interface RealEstateToken {
  id: number;
  symbol: string;
  name: string;
  tokenSymbol: string;
  price: number;
  change24h: number;
  mintFee: number;
  maxAllowance: number;
  instantlyAvailable: number;
  country: string;
  external_link: string;
  in_USD: number;
  contract_solana: string;
  contract_sui: string;
  contract_ethereum: string;
  tokenAddress: {
    solana: string;
    sui: string;
    ethereum: string;
  };
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [tokens, setTokens] = useState<RealEstateToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: platformAggData, error: platformAggError } = await supabase
        .from("platform_agg_mv")
        .select("*");

      // output
      // [
      //   {
      //     tvl: 0,
      //     total_processed_value: 0,
      //     total_transactions: 0,
      //     total_users: 0,
      //     last_updated: "2025-01-20T08:09:54.443028+00:00",
      //   },
      // ];

      if (platformAggError) {
        throw error;
      } else if (!platformAggData || platformAggData.length === 0) {
        throw new Error("No data found");
      } else {
        console.log("platformAggData fetched:", platformAggData);
      }

      setData({
        totalValueLocked: platformAggData[0].tvl,
        activeUsers: platformAggData[0].total_users,
        totalProcessedValue: platformAggData[0].total_processed_value,
        totalTransactions: platformAggData[0].total_transactions,
      });

      const { data: tokensData, error: tokensError } = await supabase
        .from("shares")
        .select("*");

      if (tokensError) {
        throw error;
      } else if (!tokensData || tokensData.length === 0) {
        throw new Error("No data found");
      } else {
        console.log("tokensData fetched:", tokensData);
      }

      setTokens(
        tokensData.map((token) => ({
          id: token.id,
          symbol: token.token_symbol,
          name: token.share_name,
          tokenSymbol: token.token_symbol,
          price: token.price,
          change24h: token.current_trend,
          mintFee: token.mint_fee,
          maxAllowance: token.max_allowance,
          instantlyAvailable: token.instant_allowance,
          country: token.country,
          external_link: token.external_link,
          in_USD: token.in_USD,
          contract_solana: token.contract_solana,
          contract_sui: token.contract_sui,
          contract_ethereum: token.contract_ethereum,
          tokenAddress: {
            solana: token.contract_solana,
            sui: token.contract_sui,
            ethereum: token.contract_ethereum,
          },
        }))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch dashboard data")
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, tokens, isLoading, error, fetchData };
}
