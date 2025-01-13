'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react'
import { CryptoSection } from '@/components/dashboard/CryptoSection'
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardData } from '@/hooks/useDashboardData'

export default function Home() {
  const { data, tokens, isLoading, error } = useDashboardData()

  if (error) {
    return <div className="text-red-500">Error loading dashboard data: {error.message}</div>
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Overview</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Total Value Locked', value: data?.totalValueLocked, icon: TrendingUp },
            { title: 'Active Users', value: data?.activeUsers, icon: Users },
            { title: 'Total Borrowed', value: data?.totalBorrowed, icon: DollarSign },
            { title: 'Total Transactions', value: data?.totalTransactions, icon: Activity },
          ].map((item, index) => (
            <Card key={index} className="bg-gray-900 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  {item.title}
                </CardTitle>
                <item.icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 bg-gray-700" />
                ) : (
                  <div className="text-2xl font-bold">
                    {item.value?.toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Real Estate Tokens</h2>
        <CryptoSection tokens={tokens} isLoading={isLoading} />
      </section>
    </div>
  )
}

