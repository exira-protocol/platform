"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Activity,
  Users,
  DollarSign,
} from "lucide-react";
import { PortfolioStats } from "@/components/portfolio/PortfolioStats";
import { PortfolioList } from "@/components/portfolio/PortfolioList";
import { PortfolioDistribution } from "@/components/portfolio/PortfolioDistribution";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { Skeleton } from "@/components/ui/skeleton";
import { useGlobalState } from "@/context/GlobalStateContext";

// const timeRanges = [
// { label: '1D', value: '1d' },
// { label: '7D', value: '7d' },
// { label: '1M', value: '1m' },
// { label: '1Y', value: '1y' },
// { label: 'All', value: 'all' },
// ]

export default function PortfolioPage() {
  const [selectedRange, setSelectedRange] = useState("7d");
  const { stats, timeSeriesData, activities, isLoading, error, fetchData } =
    usePortfolioData();
  const { selectedNetwork, isWalletConnected, walletAddress } =
    useGlobalState();

  useEffect(() => {
    if (isWalletConnected && walletAddress !== null && walletAddress !== "") {
      fetchData();
    }
  }, [isWalletConnected, walletAddress]);

  if (!selectedNetwork) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-4">
          Welcome to Exira DeFi Portfolio
        </h2>
        <p className="mb-4">Please select a network to view your portfolio.</p>
      </div>
    );
  }

  if (!isWalletConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="mb-4">
          Please connect your wallet to view your portfolio.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading portfolio data: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Value",
            value: `$${stats?.current_portfolio_value.toFixed(3) ?? 0}`,
            icon: TrendingUp,
          },
          {
            title: "Total Invested",
            value: `$${stats?.current_investment_value.toFixed(3) ?? 0}`,
            icon: Activity,
          },
          {
            title: "Total Shares",
            value: stats?.total_shares ?? 0,
            icon: DollarSign,
          },
          {
            title: "Total Gain",
            value: `${
              (stats?.current_portfolio_value.toFixed(3) ?? 0) -
              (stats?.current_investment_value.toFixed(3) ?? 0)
            }`,
            icon: Users,
          },
        ].map((item, index) => (
          <Card key={index} className="bg-black text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                {item.title}
              </CardTitle>
              <item.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24 bg-gray-700" />
              ) : (
                <div className="text-2xl font-bold">{item.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg">
            <div>
              <CardTitle className="text-xl font-semibold mb-3">
                {isLoading ? (
                  <Skeleton className="h-9 w-32" />
                ) : (
                  // `$${stats?.current_portfolio_value}`
                  <p className="">Your Portfolio Growth</p>
                )}
              </CardTitle>
              {/* <div className="flex items-center gap-2 mt-1">
                {isLoading ? (
                  <Skeleton className="h-5 w-24" />
                ) : (
                  <span
                    className={`flex items-center ${
                      stats?.dailyChange.percentage >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stats?.dailyChange.percentage >= 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    ${stats?.dailyChange.amount} (
                    {stats?.dailyChange.percentage}%)
                  </span>
                )}
              </div> */}
            </div>
            {/* <div className="flex gap-2">
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  variant={selectedRange === range.value ? "default" : "outline"}
                  className="px-3 py-1 h-8"
                  onClick={() => setSelectedRange(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div> */}
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-6">
              {isLoading ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <>
                  {timeSeriesData.length === 0 ||
                  timeSeriesData.length === 1 ? (
                    <div>
                      <p className="text-gray-500 text-center">
                        Not enough data to display chart. Please try after some
                        making some transactions.
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis
                          dataKey="date"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#22c55e"
                          dot={false}
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-gray-100 dark:bg-gray-800 rounded-t-lg pb-6">
            <CardTitle className="text-xl font-semibold">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 mt-6">
            {isLoading ? (
              Array(3)
                .fill(0)
                .map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between text-sm border-b border-gray-200 dark:border-gray-700 pb-2"
                >
                  <div>
                    <div className="font-medium flex flex-row items-center gap-x-2">
                      <span className="capitalize">
                        {activity.txn_type === "buy" ? (
                          <div className="bg-green-300/60 text-black px-2 py-1  rounded-2xl text-xs text-center">
                            {activity.txn_type}
                          </div>
                        ) : (
                          <div className="bg-red-300/60 text-black px-2 py-1 rounded-2xl text-xs text-center">
                            {activity.txn_type}
                          </div>
                        )}
                      </span>{" "}
                      {activity.shareSymbol}
                    </div>
                    <div className="text-gray-500 px-2 py-1">{activity.quantity} shares</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ${activity.value.toFixed(2)}
                    </div>
                    <div className="text-gray-500">{activity.date}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500">No recent activities</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PortfolioList />
        </div>
        <div className="lg:col-span-4">
          <PortfolioDistribution />
        </div>
      </div>
    </div>
  );
}
