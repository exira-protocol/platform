'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Transaction, TransactionFilters, TransactionStats } from '@/types/transaction'

const dummyTransactions: Transaction[] = [
  {
    id: '1',
    type: 'buy',
    amount: 50,
    token: 'EMBO',
    network: 'Ethereum',
    hash: '0x1234...5678',
    fee: {
      amount: 0.002,
      token: 'ETH'
    },
    status: 'success',
    confirmations: 12,
    description: 'Buy 50 EMBO shares',
    timestamp: new Date('2024-01-08T10:00:00'),
  },
  {
    id: '2',
    type: 'sell',
    amount: 25,
    token: 'BROK',
    network: 'Ethereum',
    hash: '0x8765...4321',
    fee: {
      amount: 0.0015,
      token: 'ETH'
    },
    status: 'success',
    confirmations: 15,
    description: 'Sell 25 BROK shares',
    timestamp: new Date('2024-01-08T09:30:00'),
  },
  {
    id: '3',
    type: 'buy',
    amount: 30,
    token: 'MIND',
    network: 'Polygon',
    hash: '0x9876...5432',
    fee: {
      amount: 0.1,
      token: 'MATIC'
    },
    status: 'success',
    confirmations: 20,
    description: 'Buy 30 MIND shares',
    timestamp: new Date('2024-01-07T15:45:00'),
  },
  {
    id: '4',
    type: 'buy',
    amount: 40,
    token: 'NXUS',
    network: 'Ethereum',
    hash: '0x2468...1357',
    fee: {
      amount: 0.0018,
      token: 'ETH'
    },
    status: 'success',
    confirmations: 18,
    description: 'Buy 40 NXUS shares',
    timestamp: new Date('2024-01-07T12:20:00'),
  },
  {
    id: '5',
    type: 'sell',
    amount: 15,
    token: 'EMBO',
    network: 'Ethereum',
    hash: '0x1357...2468',
    fee: {
      amount: 0.0012,
      token: 'ETH'
    },
    status: 'success',
    confirmations: 14,
    description: 'Sell 15 EMBO shares',
    timestamp: new Date('2024-01-06T16:15:00'),
  },
]

export function useTransactionData(filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      setTransactions(dummyTransactions)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredTransactions = useMemo(() => {
    if (!filters) return transactions

    return transactions.filter(transaction => {
      const matchesType = filters.type === 'all' || transaction.type === filters.type
      const matchesNetwork = !filters.network || transaction.network === filters.network
      const matchesToken = !filters.token || transaction.token === filters.token
      const matchesDate = transaction.timestamp >= filters.dateRange.start && 
                         transaction.timestamp <= filters.dateRange.end

      return matchesType && matchesNetwork && matchesToken && matchesDate
    })
  }, [transactions, filters])

  const stats: TransactionStats = useMemo(() => {
    return {
      total: transactions.length,
      buy: transactions.filter(t => t.type === 'buy').length,
      sell: transactions.filter(t => t.type === 'sell').length,
    }
  }, [transactions])

  return {
    transactions: filteredTransactions,
    stats,
    isLoading,
    error,
    fetchData,
  }
}

