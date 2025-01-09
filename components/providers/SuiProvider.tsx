import { ReactNode, useMemo } from "react";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useNetworkConfig } from "@/hooks/useNetworkConfig";
import { useGlobalState } from "@/context/GlobalStateContext";

interface SuiProviderProps {
  children: ReactNode;
}

export function SuiProvider({ children }: SuiProviderProps) {
  const { networkConfig } = useNetworkConfig();
  const { selectedNetwork } = useGlobalState();

  const queryClient = useMemo(() => new QueryClient(), []);

  // If the selected network is not Sui, just render the children
  if (selectedNetwork !== "Sui") {
    return <>{children}</>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
        <WalletProvider>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
