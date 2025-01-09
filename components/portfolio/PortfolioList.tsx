'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PortfolioListItem } from "./PortfolioListItem"
import { Button } from "@/components/ui/button"
import { usePortfolioData } from '@/hooks/usePortfolioData'

interface PortfolioListProps {
  className?: string
}

export function PortfolioList({ className }: PortfolioListProps) {
  const [filter, setFilter] = React.useState<'all' | 'gainers' | 'decliners'>('all')
  const { assets } = usePortfolioData()

  const filteredAssets = React.useMemo(() => {
    switch (filter) {
      case 'gainers':
        return assets.filter(asset => asset.change > 0)
      case 'decliners':
        return assets.filter(asset => asset.change < 0)
      default:
        return assets
    }
  }, [filter, assets])

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-100 dark:bg-gray-800 rounded-t-lg">
        <CardTitle className="text-xl font-semibold">My Portfolio</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'gainers' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('gainers')}
          >
            Gainers
          </Button>
          <Button
            variant={filter === 'decliners' ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter('decliners')}
          >
            Decliners
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-4 font-semibold text-sm text-gray-500 dark:text-gray-400 pb-2">
            <div className="col-span-2">Asset</div>
            <div className="text-right">Price</div>
            <div className="text-right">Change</div>
            <div className="text-right">Value</div>
          </div>
          {filteredAssets.map((asset) => (
            <PortfolioListItem key={asset.symbol} asset={asset} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

