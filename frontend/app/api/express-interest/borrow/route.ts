import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  
  // Here you would typically process the data and store it
  console.log('Received interest in borrowing:', body)

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  return NextResponse.json({ message: 'Interest in borrowing recorded successfully' })
}

