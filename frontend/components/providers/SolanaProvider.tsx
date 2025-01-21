"use client";

import { ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useNetworkConfig } from "@/hooks/useNetworkConfig";
import { useGlobalState } from "@/context/GlobalStateContext";
import "@solana/wallet-adapter-react-ui/styles.css";

interface SolanaProviderProps {
  children: ReactNode;
}

export function SolanaProvider({ children }: SolanaProviderProps) {
  const { networkConfig } = useNetworkConfig();
  const { selectedNetwork } = useGlobalState();

  const wallets = useMemo(() => [], []);
  const queryClient = useMemo(() => new QueryClient(), []);
  const endpoint = useMemo(() => clusterApiUrl("devnet"), []); // Change to "devnet" if needed

  // If the selected network is not Solana, just render the children
  if (selectedNetwork !== "Solana") {
    return <>{children}</>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            {/* <WalletMultiButton /> */}
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}
