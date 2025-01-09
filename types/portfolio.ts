export interface Asset {
  symbol: string
  name: string
  shares: number
  price: number
  change: number
  currentValue: number
  icon?: string
}

export interface PortfolioStats {
  totalValue: number
  dailyChange: {
    amount: number
    percentage: number
  }
  portfolioHealth: number
  totalAssets: number
  chainCount: number
}

export interface PortfolioActivity {
  id: string
  type: 'Buy' | 'Sell'
  asset: string
  amount: string
  value: number
  timestamp: Date
}

export interface TimeSeriesData {
  date: string
  value: number
}

export interface AssetDistribution {
  name: string
  value: number
  color: string
}

