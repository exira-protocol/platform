"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { Header } from "./Header";
import { Toaster } from "@/components/ui/toaster";
import { GlobalStateProvider } from "@/context/GlobalStateContext";
import PageTransition from "./PageTransition";
import { SuiProvider } from "../providers/SuiProvider";
import { SolanaProvider } from "../providers/SolanaProvider";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <GlobalStateProvider>
      <SolanaProvider>
        {/* To disable Sui provider, comment out the next line */}
        <SuiProvider>
          <div className="flex min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-0rem)]">
            <Sidebar />
            <main className="flex-1 ml-72 mt-4 mr-4 mb-4 p-4 md:p-6 lg:p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden flex flex-col height-full">
              <Header title={title} />
              <div className="flex-grow overflow-auto">
                <PageTransition>{children}</PageTransition>
              </div>
            </main>
            <Toaster />
          </div>
        </SuiProvider>
      </SolanaProvider>
    </GlobalStateProvider>
  );
}

function getPageTitle(pathname: string): string {
  switch (pathname) {
    case "/":
      return "Dashboard";
    case "/borrow":
      return "Borrow";
    case "/portfolio":
      return "Portfolio";
    case "/transactions":
      return "Transactions";
    default:
      return "Exira DeFi";
  }
}
