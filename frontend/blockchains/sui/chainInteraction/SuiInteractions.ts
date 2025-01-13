export async function fetchSuiBalance(address: string): Promise<number> {
  // Dummy implementation
  console.log(`Fetching balance for Sui address: ${address}`)
  return Math.random() * 1000 // Return a random balance
}

export async function sendSuiTransaction(from: string, to: string, amount: number): Promise<string> {
  // Dummy implementation
  console.log(`Sending ${amount} SUI from ${from} to ${to}`)
  return `tx_${Math.random().toString(36).substring(7)}` // Return a dummy transaction hash
}

