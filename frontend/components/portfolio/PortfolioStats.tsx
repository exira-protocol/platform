import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, TrendingUp, Activity } from 'lucide-react'
import { usePortfolioData } from '@/hooks/usePortfolioData'

interface StatCardProps {
  title: string
  value: string | number
  subValue?: string
  change?: number
  icon?: React.ReactNode
}

function StatCard({ title, value, subValue, change, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          {title}
          {icon}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(subValue || change !== undefined) && (
          <div className="flex items-center gap-2 mt-1">
            {change !== undefined && (
              <span className={`flex items-center text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(change)}%
              </span>
            )}
            {subValue && (
              <span className="text-xs text-muted-foreground">{subValue}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PortfolioStats() {
  const { stats } = usePortfolioData()

  if (!stats) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Portfolio Value"
        value={`$${stats.totalValue.toLocaleString()}`}
        change={stats.dailyChange.percentage}
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="24h Change"
        value={`${stats.dailyChange.amount >= 0 ? '+' : ''}$${stats.dailyChange.amount.toLocaleString()}`}
        change={stats.dailyChange.percentage}
      />
      <StatCard
        title="Portfolio Health"
        value={`${stats.portfolioHealth}%`}
        subValue="Excellent"
        icon={<Activity className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Total Assets"
        value={stats.totalAssets}
        subValue={`Across ${stats.chainCount} chains`}
      />
    </div>
  )
}

