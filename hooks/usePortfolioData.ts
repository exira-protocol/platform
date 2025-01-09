'use client'

import { useState, useEffect } from 'react'
import type { Asset, PortfolioStats, PortfolioActivity, TimeSeriesData, AssetDistribution } from '@/types/portfolio'

// Updated dummy data to reflect real estate shares
const dummyAssets: Asset[] = [
  {
    symbol: 'EMBO',
    name: 'Embassy Office Parks REIT',
    shares: 100,
    price: 345.50,
    change: 2.5,
    currentValue: 34550,
  },
  {
    symbol: 'BROK',
    name: 'Brookfield India Real Estate Trust',
    shares: 150,
    price: 275.25,
    change: -1.2,
    currentValue: 41287.50,
  },
  {
    symbol: 'MIND',
    name: 'Mindspace Business Parks REIT',
    shares: 80,
    price: 320.75,
    change: 1.8,
    currentValue: 25660,
  },
  {
    symbol: 'NXUS',
    name: 'Nexus Select Trust REIT',
    shares: 120,
    price: 298.50,
    change: 0.9,
    currentValue: 35820,
  },
]

const dummyStats: PortfolioStats = {
  totalValue: 137317.50,
  dailyChange: {
    amount: 1852.50,
    percentage: 1.37,
  },
  portfolioHealth: 98,
  totalAssets: 4,
  chainCount: 2,
}

const dummyActivities: PortfolioActivity[] = [
  {
    id: '1',
    type: 'Buy',
    asset: 'EMBO',
    amount: '50 shares',
    value: 17275,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '2',
    type: 'Sell',
    asset: 'BROK',
    amount: '25 shares',
    value: 6881.25,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    id: '3',
    type: 'Buy',
    asset: 'MIND',
    amount: '30 shares',
    value: 9622.50,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
]

const dummyTimeSeriesData: TimeSeriesData[] = [
  { date: '2023-08-26', value: 6500 },
  { date: '2023-08-27', value: 6800 },
  { date: '2023-08-28', value: 6600 },
  { date: '2023-08-29', value: 7000 },
  { date: '2023-08-30', value: 7200 },
  { date: '2023-08-31', value: 7100 },
  { date: '2023-09-01', value: 7291.32 },
]

export function usePortfolioData() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [stats, setStats] = useState<PortfolioStats | null>(null)
  const [activities, setActivities] = useState<PortfolioActivity[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Calculate distribution data based on assets
  const distributionData: AssetDistribution[] = assets.map((asset, index) => ({
    name: asset.symbol,
    value: asset.currentValue,
    color: [
      '#10B981',
      '#6366F1',
      '#F59E0B',
      '#EC4899',
      '#8B5CF6',
    ][index % 5],
  }))

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setAssets(dummyAssets)
      setStats(dummyStats)
      setActivities(dummyActivities)
      setTimeSeriesData(dummyTimeSeriesData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch portfolio data'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const refreshData = async () => {
    try {
      setIsLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setAssets(dummyAssets)
      setStats(dummyStats)
      setActivities(dummyActivities)
      setTimeSeriesData(dummyTimeSeriesData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh portfolio data'))
    } finally {
      setIsLoading(false)
    }
  }

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
  }
}

