import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { sidebarConfig } from '@/config/sidebar'
import ContactModal from '../shared/ContactModal'
import { useGlobalState } from '@/context/GlobalStateContext'

export default function Sidebar() {
  const pathname = usePathname()
  const { isWalletConnected, setWalletAddress, setIsWalletConnected } = useGlobalState()

  const handleLogout = () => {
    // Disconnect the wallet
    setWalletAddress(null)
    setIsWalletConnected(false)
    // You might want to add additional logout logic here
    console.log('User logged out')
  }

  return (
    <div className="fixed left-4 top-4 bottom-4 w-64 bg-white dark:bg-gray-800 rounded-3xl shadow-lg flex flex-col overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <Image src="/icon+text+whitebg.png" alt="Exira Logo" width={120} height={40} />
      </div>
      <nav className="flex-grow overflow-y-auto py-6">
        <ul className="space-y-1">
          {sidebarConfig.menuItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center px-6 py-3 text-sm font-medium transition-colors rounded-xl mx-2",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                )}
              >
                {React.createElement(item.icon, { className: "mr-3 h-5 w-5" })}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <ContactModal />
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center px-6 py-3 mt-2 text-sm font-medium transition-colors rounded-xl w-full",
            "bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100"
          )}
        >
          {React.createElement(sidebarConfig.bottomItems[1].icon, { className: "mr-3 h-5 w-5" })}
          <span>{isWalletConnected ? 'Disconnect' : 'Logout'}</span>
        </button>
      </div>
    </div>
  )
}

