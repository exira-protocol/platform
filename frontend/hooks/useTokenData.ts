import { useState, useEffect } from 'react'

export interface TokenData {
  symbol: string
  price: number
  exchangeRate: number
}

const dummyTokenData: TokenData[] = [
  { symbol: 'BTC', price: 50000, exchangeRate: 1 },
  { symbol: 'ETH', price: 3000, exchangeRate: 0.06 },
  { symbol: 'ADA', price: 2, exchangeRate: 0.00004 },
  { symbol: 'DOT', price: 30, exchangeRate: 0.0006 },
]

export function useTokenData() {
  const [data, setData] = useState<TokenData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setData(dummyTokenData)
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch token data'))
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Function to be used when integrating with real API
  const fetchRealData = async () => {
    try {
      setIsLoading(true)
      // Replace with actual API call
      const response = await fetch('https://api.example.com/token-data')
      const result = await response.json()
      setData(result)
      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch token data'))
      setIsLoading(false)
    }
  }

  return { data, isLoading, error, fetchRealData }
}

