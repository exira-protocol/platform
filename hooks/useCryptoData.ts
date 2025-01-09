import { useState, useEffect } from 'react'

export interface CryptoData {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  marketCap: string
  volume: string
}

// This will be replaced with actual API call later
const dummyData: CryptoData[] = [
  { 
    id: '1', 
    name: 'Bitcoin', 
    symbol: 'BTC', 
    price: 50000, 
    change24h: 2.5,
    marketCap: '$1.2T',
    volume: '$48.2B'
  },
  { 
    id: '2', 
    name: 'Ethereum', 
    symbol: 'ETH', 
    price: 3000, 
    change24h: -1.2,
    marketCap: '$432.1B',
    volume: '$22.4B'
  },
  { 
    id: '3', 
    name: 'Cardano', 
    symbol: 'ADA', 
    price: 2, 
    change24h: 5.7,
    marketCap: '$64.8B',
    volume: '$3.2B'
  },
  { 
    id: '4', 
    name: 'Polkadot', 
    symbol: 'DOT', 
    price: 30, 
    change24h: 0.8,
    marketCap: '$42.3B',
    volume: '$2.1B'
  },
]

export function useCryptoData() {
  const [data, setData] = useState<CryptoData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setData(dummyData)
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch crypto data'))
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, isLoading, error }
}

