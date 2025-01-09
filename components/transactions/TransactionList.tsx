import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Wallet, ArrowUpRight, ArrowLeftRight, Lock, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import type { Transaction } from '@/types/transaction'

interface TransactionListProps {
  transactions: Transaction[]
  isLoading: boolean
}

const statusStyles = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  in_process: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

const typeIcons = {
  buy: <Wallet className="h-4 w-4 text-green-500" />,
  sell: <ArrowUpRight className="h-4 w-4 text-red-500" />,
}

const statusIcons = {
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  in_process: <Clock className="h-4 w-4 text-yellow-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
}

const getExplorerUrl = (network: string, hash: string) => {
  const explorers: Record<string, string> = {
    'Ethereum': 'https://etherscan.io/tx/',
    'BSC': 'https://bscscan.com/tx/',
    'Polygon': 'https://polygonscan.com/tx/',
    'Arbitrum': 'https://arbiscan.io/tx/',
    'Optimism': 'https://optimistic.etherscan.io/tx/',
  }
  return explorers[network] + hash
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No transactions found
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>TYPE</TableHead>
          <TableHead>AMOUNT</TableHead>
          <TableHead>NETWORK</TableHead>
          <TableHead>STATUS</TableHead>
          <TableHead>GAS FEE</TableHead>
          <TableHead>HASH</TableHead>
          <TableHead className="text-right">DATE</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                {typeIcons[transaction.type]}
                <span className="capitalize">{transaction.type}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="font-medium">
                {transaction.amount} {transaction.token} shares
              </div>
            </TableCell>
            <TableCell>
              <div className="font-medium">{transaction.network}</div>
              <div className="text-sm text-muted-foreground">
                {transaction.confirmations} confirmations
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className={statusStyles[transaction.status]}>
                {transaction.status}
              </Badge>
            </TableCell>
            <TableCell>
              {transaction.fee.amount} {transaction.fee.token}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => window.open(getExplorerUrl(transaction.network, transaction.hash), '_blank')}
              >
                {transaction.hash.slice(0, 6)}...{transaction.hash.slice(-4)}
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </TableCell>
            <TableCell className="text-right">
              {new Date(transaction.timestamp).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

