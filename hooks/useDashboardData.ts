import { useState, useEffect } from 'react'

interface DashboardData {
  totalValueLocked: number
  activeUsers: number
  totalBorrowed: number
  totalTransactions: number
}

interface RealEstateToken {
  id: string
  symbol: string
  name: string
  tokenSymbol: string
  price: number
  change24h: number
  mintFee: number
  maxAllowance: number
  instantlyAvailable: number
  tokenAddress: {
    solana: string
    sui: string
    ethereum: string
  }
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [tokens, setTokens] = useState<RealEstateToken[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Dummy data
      setData({
        totalValueLocked: 1234567,
        activeUsers: 5678,
        totalBorrowed: 987654,
        totalTransactions: 24321
      })

      setTokens([
        {
          id: '1',
          symbol: 'EMBO',
          name: 'Embassy Office Parks REIT',
          tokenSymbol: 'EMBO',
          price: 345.50,
          change24h: 2.5,
          mintFee: 0.5,
          maxAllowance: 1000000,
          instantlyAvailable: 500000,
          tokenAddress: {
            solana: 'EMBOxyz123solana',
            sui: 'EMBOxyz123sui',
            ethereum: '0xEMBOxyz123ethereum'
          }
        },
        {
          id: '2',
          symbol: 'BROK',
          name: 'Brookfield India Real Estate Trust',
          tokenSymbol: 'BROK',
          price: 275.25,
          change24h: -1.2,
          mintFee: 0.6,
          maxAllowance: 800000,
          instantlyAvailable: 400000,
          tokenAddress: {
            solana: 'BROKxyz123solana',
            sui: 'BROKxyz123sui',
            ethereum: '0xBROKxyz123ethereum'
          }
        },
        {
          id: '3',
          symbol: 'MIND',
          name: 'Mindspace Business Parks REIT',
          tokenSymbol: 'MIND',
          price: 320.75,
          change24h: 1.8,
          mintFee: 0.55,
          maxAllowance: 900000,
          instantlyAvailable: 450000,
          tokenAddress: {
            solana: 'MINDxyz123solana',
            sui: 'MINDxyz123sui',
            ethereum: '0xMINDxyz123ethereum'
          }
        },
        {
          id: '4',
          symbol: 'NXUS',
          name: 'Nexus Select Trust REIT',
          tokenSymbol: 'NXUS',
          price: 298.50,
          change24h: 0.9,
          mintFee: 0.58,
          maxAllowance: 850000,
          instantlyAvailable: 425000,
          tokenAddress: {
            solana: 'NXUSxyz123solana',
            sui: 'NXUSxyz123sui',
            ethereum: '0xNXUSxyz123ethereum'
          }
        },
      ])

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { data, tokens, isLoading, error, fetchData }
}

