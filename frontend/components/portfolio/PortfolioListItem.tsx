import React from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface Asset {
  symbol: string
  name: string
  shares: number
  price: number
  change: number
  currentValue: number
  icon?: string
}

interface PortfolioListItemProps {
  asset: Asset
}

export function PortfolioListItem({ asset }: PortfolioListItemProps) {
  return (
    <div className="grid grid-cols-5 gap-4 items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="col-span-2 flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium">
          {asset.symbol.charAt(0)}
        </div>
        <div>
          <div className="font-medium">{asset.symbol}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{asset.name}</div>
        </div>
      </div>
      <div className="text-right font-medium">${asset.price.toFixed(2)}</div>
      <div className={`text-right flex items-center justify-end ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {asset.change >= 0 ? (
          <ArrowUpRight className="h-3 w-3 mr-1" />
        ) : (
          <ArrowDownRight className="h-3 w-3 mr-1" />
        )}
        {Math.abs(asset.change)}%
      </div>
      <div className="text-right">
        <div className="font-medium">${asset.currentValue.toFixed(2)}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{asset.shares} shares</div>
      </div>
    </div>
  )
}

