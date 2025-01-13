import React, { createContext, useContext, useState, ReactNode } from "react";

type Network = "Sui" | "Solana" | "Ethereum" | null;

interface GlobalState {
  selectedNetwork: Network;
  walletAddress: string | null;
  isWalletConnected: boolean;
  activeNetworkConfig: any | null;
  setSelectedNetwork: (network: Network) => void;
  setWalletAddress: (address: string | null) => void;
  setIsWalletConnected: (isConnected: boolean) => void;
  setActiveNetworkConfig: (config: any) => void;
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined);

export function GlobalStateProvider({ children }: { children: ReactNode }) {
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [activeNetworkConfig, setActiveNetworkConfig] = useState<any | null>(
    null
  );

  const value = {
    selectedNetwork,
    walletAddress,
    isWalletConnected,
    activeNetworkConfig,
    setSelectedNetwork: (network: Network) => {
      setSelectedNetwork(network);
      setWalletAddress(null);
      setIsWalletConnected(false);
      setActiveNetworkConfig(null);
    },
    setWalletAddress,
    setIsWalletConnected,
    setActiveNetworkConfig,
  };

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error("useGlobalState must be used within a GlobalStateProvider");
  }
  return context;
}
