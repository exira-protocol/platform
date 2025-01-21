'use client'

import React, { useState } from 'react'
import { CryptoTable } from './CryptoTable'
import { BuyingSection } from './BuyingSection'
import { RealEstateToken } from '@/hooks/useDashboardData'
import { Skeleton } from '@/components/ui/skeleton'
import { useGlobalState } from '@/context/GlobalStateContext'
import { Button } from "@/components/ui/button"

interface CryptoSectionProps {
  tokens: RealEstateToken[]
  isLoading: boolean
}

export function CryptoSection({ tokens, isLoading }: CryptoSectionProps) {
  const [selectedToken, setSelectedToken] = useState<RealEstateToken | null>(null)
  const { isWalletConnected } = useGlobalState()

  const handleViewStock = (token: RealEstateToken) => {
    console.log('Viewing stock details for:', token.name)
    // Implement view stock logic here
  }

  const handleSelectToken = (token: RealEstateToken) => {
    if (isWalletConnected) {
      console.log('Selected token:', token)
      setSelectedToken(token)
    } else {
      // We don't need to show an alert here anymore
      // The message in the buying section will inform the user
      setSelectedToken(null)
    }
  }

  const handleViewToken = (token: RealEstateToken) => {
    // For this example, we'll open the Ethereum explorer
    const explorerUrl = `https://etherscan.io/token/${token.tokenAddress.ethereum}`
    window.open(explorerUrl, '_blank')
  }

  if (isLoading) {
    return (
      <div className="flex gap-8">
        <div className="flex-1">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-[400px]" />
      </div>
    )
  }

  return (
    <div className="flex gap-4">
      <div className="w-3/5">
        <CryptoTable 
          data={tokens} 
          onSelect={handleSelectToken} 
          onViewStock={handleViewStock}
          onViewToken={handleViewToken}
        />
      </div>
      <div className="w-2/5">
        {selectedToken ? (
          <BuyingSection selectedToken={selectedToken} />
        ) : (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg w-full h-full flex items-center justify-center">
            <p className="text-lg text-gray-500 dark:text-gray-400">
              {isWalletConnected 
                ? "Select a token to buy" 
                : "Connect your wallet to buy REIT tokens"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

