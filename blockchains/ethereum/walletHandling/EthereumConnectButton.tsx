import React from 'react'
import { Button } from "@/components/ui/button"

interface EthereumConnectButtonProps {
  onConnect: () => void
}

export function EthereumConnectButton({ onConnect }: EthereumConnectButtonProps) {
  return (
    <Button onClick={onConnect}>
      Connect Ethereum Wallet
    </Button>
  )
}

