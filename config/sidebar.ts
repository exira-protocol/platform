import { Home, DollarSign, PieChart, FileText, MessageCircle, LogOut } from 'lucide-react'

export const sidebarConfig = {
  menuItems: [
    { name: 'Dashboard', icon: Home, href: '/' },
    { name: 'Borrow', icon: DollarSign, href: '/borrow' },
    { name: 'Portfolio', icon: PieChart, href: '/portfolio' },
    { name: 'Transactions', icon: FileText, href: '/transactions' },
  ],
  bottomItems: [
    { name: 'Contact', icon: MessageCircle, href: '/contact' },
    { name: 'Logout', icon: LogOut, href: '/logout' },
  ],
}

