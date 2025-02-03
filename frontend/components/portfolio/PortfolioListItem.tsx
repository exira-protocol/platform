import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Asset {
  symbol: string;
  name: string;
  shares: number;
  price: number;
  change: number;
  currentValue: number;
  icon?: string;
}

interface PortfolioListItemProps {
  asset: Asset;
}

export function PortfolioListItem({ asset }: PortfolioListItemProps) {
  return (
    <div className="grid grid-cols-5 gap-4 items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="col-span-2 flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium">
          {asset.shareSymbol[0]}
        </div>
        <div>
          <div className="font-medium">{asset.shareSymbol}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {asset.name}
          </div>
        </div>
      </div>
      <div className="text-right font-medium">
        ${parseFloat(asset.in_USD).toFixed(2)}
      </div>
      <div
        className={`text-right flex items-center justify-end ${
          parseFloat(asset.trend) >= 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        {parseFloat(asset.trend) >= 0 ? (
          <ArrowUpRight className="h-3 w-3 mr-1" />
        ) : (
          <ArrowDownRight className="h-3 w-3 mr-1" />
        )}
        {Math.abs(parseFloat(asset.trend))}%
      </div>
      <div className="text-right">
        <div className="font-medium">
          ${(parseFloat(asset.in_USD) * parseInt(asset.quantity)).toFixed(2)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {asset.quantity} shares
        </div>
      </div>
    </div>
  );
}
