import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { RealEstateToken } from '@/hooks/useRealEstateTokenData'
import { useDebounce } from '@/hooks/useDebounce'
import { TransactionPanel } from './TransactionPanel'

interface BuyingSectionProps {
  selectedToken: RealEstateToken | null
}

interface TransactionValues {
  amount: string
  tokenAmount: string
}

export function BuyingSection({ selectedToken }: BuyingSectionProps) {
  const [transactionType, setTransactionType] = useState<'buy' | 'withdraw'>('buy')
  const [transactionValues, setTransactionValues] = useState<TransactionValues>({
    amount: '',
    tokenAmount: '0'
  })

  const debouncedAmount = useDebounce(transactionValues.amount, 300)

  useEffect(() => {
    if (!selectedToken || !debouncedAmount) {
      setTransactionValues(prev => ({ ...prev, tokenAmount: '0' }))
      return
    }

    const amount = parseFloat(debouncedAmount.replace(/,/g, ''))
    if (!isNaN(amount)) {
      const tokenAmount = (amount / selectedToken.price).toFixed(8)
      setTransactionValues(prev => ({ ...prev, tokenAmount }))
    }
  }, [debouncedAmount, selectedToken])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^0-9.]/g, '')
    const isValid = /^\d*\.?\d*$/.test(input)
    if (isValid) {
      setTransactionValues(prev => ({ ...prev, amount: input }))
    }
  }

  if (!selectedToken) return null

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg w-full">
      <div className="flex mb-4">
        <Button
          className={cn(
            "flex-1 rounded-r-none text-sm py-2",
            transactionType === 'buy' ? 'bg-black text-white hover:bg-gray-900' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
          onClick={() => setTransactionType('buy')}
        >
          Buy
        </Button>
        <Button
          className={cn(
            "flex-1 rounded-l-none text-sm py-2",
            transactionType === 'withdraw' ? 'bg-black text-white hover:bg-gray-900' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
          onClick={() => setTransactionType('withdraw')}
        >
          Withdraw
        </Button>
      </div>

      <TransactionPanel 
        selectedToken={selectedToken}
        transactionValues={transactionValues}
        onAmountChange={handleInputChange}
        transactionType={transactionType}
      />
    </div>
  )
}

