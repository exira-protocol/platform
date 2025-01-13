import type { Metadata } from 'next'
import { Lexend } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/theme'
import { Layout } from '@/components/layout/Layout'

const lexend = Lexend({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Exira DeFi Protocol',
  description: 'Decentralized Finance Protocol',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${lexend.className} bg-gray-100 dark:bg-gray-900`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Layout>
            {children}
          </Layout>
        </ThemeProvider>
      </body>
    </html>
  )
}

