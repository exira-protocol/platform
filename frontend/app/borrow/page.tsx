'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Building2, Percent, Clock, Shield, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from 'next/image'
import { useToast } from "@/components/ui/use-toast"

export default function BorrowPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleExpressInterest = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/express-interest/borrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interest: 'borrow' }),
      })

      if (!response.ok) {
        throw new Error('Failed to express interest')
      }

      const data = await response.json()
      toast({
        title: "Interest Recorded",
        description: data.message,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record interest. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-br from-gray-900 to-gray-700 text-white overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle className="text-3xl font-bold">Borrow Assets</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <p className="mb-6 text-lg max-w-2xl">Our liquidity pool is currently under construction. We're forging partnerships with leading lending protocols to offer you an unparalleled borrowing experience.</p>
          <Button 
            variant="secondary" 
            size="lg" 
            className="hover:bg-white hover:text-black transition-colors font-semibold"
            onClick={handleExpressInterest}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Express Interest'} <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <div className="absolute right-4 bottom-4 opacity-10">
            <Building2 size={120} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl text-gray-900 dark:text-gray-100">
              <Building2 className="mr-3 h-6 w-6" />
              Upcoming Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {[
                "Borrow against your tokenized real estate",
                "Competitive interest rates",
                "Flexible repayment terms",
                "Cross-chain borrowing capabilities"
              ].map((feature, index) => (
                <li key={index} className="flex items-start">
                  <div className="mr-3 mt-1 bg-gray-200 dark:bg-gray-700 rounded-full p-1">
                    <Shield className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                  </div>
                  <span className="text-gray-800 dark:text-gray-200">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">Why Borrow with Us?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-gray-700 dark:text-gray-300">Leverage your real estate tokens to access liquidity without selling your assets. Our upcoming borrowing feature will allow you to:</p>
            <ul className="space-y-4">
              {[
                { icon: Building2, text: "Unlock the value of your tokenized real estate" },
                { icon: Percent, text: "Access funds for new investment opportunities" },
                { icon: Clock, text: "Manage your portfolio more efficiently" }
              ].map((item, index) => (
                <li key={index} className="flex items-center">
                  <div className="mr-3 bg-gray-300 dark:bg-gray-700 rounded-full p-2">
                    <item.icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </div>
                  <span className="text-gray-800 dark:text-gray-200">{item.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

