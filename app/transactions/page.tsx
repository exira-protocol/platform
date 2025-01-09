'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, CheckCircle, XCircle, Clock, Wallet, ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TransactionList } from '@/components/transactions/TransactionList'
import { useTransactionData } from '@/hooks/useTransactionData'
import type { TransactionType, Network } from '@/types/transaction'
import { useGlobalState } from '@/context/GlobalStateContext'

const timeRanges = [
{ label: 'Last 7 days', value: '7d' },
{ label: 'Last 30 days', value: '30d' },
{ label: 'Last 90 days', value: '90d' },
]

const networks: { label: string; value: Network }[] = [
{ label: 'All Networks', value: 'Ethereum' },
{ label: 'Ethereum', value: 'Ethereum' },
{ label: 'BSC', value: 'BSC' },
{ label: 'Polygon', value: 'Polygon' },
{ label: 'Arbitrum', value: 'Arbitrum' },
{ label: 'Optimism', value: 'Optimism' },
]

const tokens = [
{ label: 'All Tokens', value: 'all' },
{ label: 'ETH', value: 'ETH' },
{ label: 'USDT', value: 'USDT' },
{ label: 'USDC', value: 'USDC' },
{ label: 'MATIC', value: 'MATIC' },
]

export default function TransactionsPage() {
  const [timeRange, setTimeRange] = useState('7d')
  const [date, setDate] = useState<Date>(new Date())
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all')
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0].value)
  const [selectedToken, setSelectedToken] = useState('all')
  const { selectedNetwork: globalNetwork, isWalletConnected } = useGlobalState()

  const filters = {
    dateRange: {
      start: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      end: date,
    },
    type: selectedType,
    network: selectedNetwork,
    token: selectedToken === 'all' ? undefined : selectedToken,
  }

  const { transactions, stats, isLoading, error, fetchData } = useTransactionData(filters)

  useEffect(() => {
    if (isWalletConnected) {
      fetchData()
    }
  }, [isWalletConnected, fetchData])

  if (!globalNetwork) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-4">Welcome to Exira DeFi Transactions</h2>
        <p className="mb-4">Please select a network to view your transactions.</p>
      </div>
    )
  }

  if (!isWalletConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
        <p className="mb-4">Please connect your wallet to view your transactions.</p>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500">Error loading transactions: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select value={selectedNetwork} onValueChange={(value) => setSelectedNetwork(value as Network)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Network" />
            </SelectTrigger>
            <SelectContent>
              {networks.map((network) => (
                <SelectItem key={network.value} value={network.value}>
                  {network.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedToken} onValueChange={setSelectedToken}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Token" />
            </SelectTrigger>
            <SelectContent>
              {tokens.map((token) => (
                <SelectItem key={token.value} value={token.value}>
                  {token.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedType === 'all' ? "default" : "outline"}
              onClick={() => setSelectedType('all')}
            >
              All ({stats.total})
            </Button>
            <Button
              variant={selectedType === 'buy' ? "default" : "outline"}
              onClick={() => setSelectedType('buy')}
            >
              <Wallet className="mr-1 h-4 w-4 text-green-500" />
              Buy ({stats.buy})
            </Button>
            <Button
              variant={selectedType === 'sell' ? "default" : "outline"}
              onClick={() => setSelectedType('sell')}
            >
              <ArrowUpRight className="mr-1 h-4 w-4 text-red-500" />
              Sell ({stats.sell})
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
              <h2 className="text-3xl font-bold">{stats.total}</h2>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Buy Transactions</p>
              <h2 className="text-3xl font-bold">{stats.buy}</h2>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Sell Transactions</p>
              <h2 className="text-3xl font-bold">{stats.sell}</h2>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <ArrowUpRight className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <TransactionList 
            transactions={transactions}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}

