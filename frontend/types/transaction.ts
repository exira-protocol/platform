export type TransactionType = 'buy' | 'sell' | 'swap' | 'stake' | 'unstake' | 'bridge'
export type TransactionStatus = 'confirmed' | 'pending' | 'failed'
export type Network = 'Ethereum' | 'BSC' | 'Polygon' | 'Arbitrum' | 'Optimism'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  token: string
  toToken?: string
  network: Network
  hash: string
  fee: {
    amount: number
    token: string
  }
  status: TransactionStatus
  confirmations: number
  description: string
  timestamp: Date
}

export interface TransactionFilters {
  dateRange: {
    start: Date
    end: Date
  }
  type: TransactionType | 'all'
  network?: Network
  token?: string
}

export interface TransactionStats {
  total: number
  buy: number
  sell: number
  swap: number
  stake: number
}

