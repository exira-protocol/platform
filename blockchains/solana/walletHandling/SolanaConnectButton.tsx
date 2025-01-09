import React from 'react'
import { Button } from "@/components/ui/button"

interface SolanaConnectButtonProps {
  onConnect: () => void
}

export function SolanaConnectButton({ onConnect }: SolanaConnectButtonProps) {
  return (
    <Button onClick={onConnect}>
      Connect Solana Wallet
    </Button>
  )
}

