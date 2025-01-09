'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowUpRight, ArrowDownRight, TrendingUp, Activity, Users, DollarSign } from 'lucide-react'
import { PortfolioStats } from '@/components/portfolio/PortfolioStats'
import { PortfolioList } from '@/components/portfolio/PortfolioList'
import { PortfolioDistribution } from '@/components/portfolio/PortfolioDistribution'
import { usePortfolioData } from '@/hooks/usePortfolioData'
import { Skeleton } from "@/components/ui/skeleton"
import { useGlobalState } from '@/context/GlobalStateContext'

const timeRanges = [
{ label: '1D', value: '1d' },
{ label: '7D', value: '7d' },
{ label: '1M', value: '1m' },
{ label: '1Y', value: '1y' },
{ label: 'All', value: 'all' },
]

export default function PortfolioPage() {
  const [selectedRange, setSelectedRange] = useState('7d')
  const { stats, timeSeriesData, activities, isLoading, error, fetchData } = usePortfolioData()
  const { selectedNetwork, isWalletConnected } = useGlobalState()

  useEffect(() => {
    if (isWalletConnected) {
      fetchData()
    }
  }, [isWalletConnected, fetchData])

  if (!selectedNetwork) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-4">Welcome to Exira DeFi Portfolio</h2>
        <p className="mb-4">Please select a network to view your portfolio.</p>
      </div>
    )
  }

  if (!isWalletConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="mb-4">Please connect your wallet to view your portfolio.</p>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500">Error loading portfolio data: {error.message}</div>
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Value', value: `$${stats?.totalValue.toLocaleString()}`, icon: TrendingUp },
          { title: 'Daily Change', value: `${stats?.dailyChange.percentage}%`, icon: Activity },
          { title: 'Total Assets', value: stats?.totalAssets, icon: DollarSign },
          { title: 'Active Chains', value: stats?.chainCount, icon: Users },
        ].map((item, index) => (
          <Card key={index} className="bg-black text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">{item.title}</CardTitle>
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
              <CardTitle className="text-3xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-9 w-32" />
                ) : (
                  `$${stats?.totalValue.toLocaleString()}`
                )}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {isLoading ? (
                  <Skeleton className="h-5 w-24" />
                ) : (
                  <span className={`flex items-center ${stats?.dailyChange.percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats?.dailyChange.percentage >= 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    ${stats?.dailyChange.amount} ({stats?.dailyChange.percentage}%)
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-4">
              {isLoading ? (
                <Skeleton className="w-full h-full" />
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-gray-100 dark:bg-gray-800 rounded-t-lg">
            <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              Array(3).fill(0).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between text-sm border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div>
                    <div className="font-medium">{activity.type} {activity.asset}</div>
                    <div className="text-gray-500">{activity.amount}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${activity.value.toLocaleString()}</div>
                    <div className="text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
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
  )
}

