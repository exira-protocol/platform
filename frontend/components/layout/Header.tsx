import React from "react";
import { User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { SuiConnectButton } from "@/blockchains/sui/walletHandling/SuiConnectButton";
import { SolanaConnectButton } from "@/blockchains/solana/walletHandling/SolanaConnectButton";
import { EthereumConnectButton } from "@/blockchains/ethereum/walletHandling/EthereumConnectButton";
import { useGlobalState } from "@/context/GlobalStateContext";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const {
    selectedNetwork,
    walletAddress,
    isWalletConnected,
    setSelectedNetwork,
    setWalletAddress,
    setIsWalletConnected,
  } = useGlobalState();

  const handleNetworkSelect = (network: "Sui" | "Solana" | "Ethereum") => {
    setSelectedNetwork(network);
  };

  const handleConnect = () => {
    // Dummy function to simulate wallet connection
    setWalletAddress("0x1234...5678");
    setIsWalletConnected(true);
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setIsWalletConnected(false);
  };

  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-48">
              {selectedNetwork ? selectedNetwork : "Choose Network"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleNetworkSelect("Sui")}>
              <Image
                src="/sui-icon.png"
                alt="Sui"
                width={20}
                height={20}
                className="mr-2"
              />
              Sui
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNetworkSelect("Solana")}>
              <Image
                src="/solana-icon.png"
                alt="Solana"
                width={20}
                height={20}
                className="mr-2"
              />
              Solana
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNetworkSelect("Ethereum")}>
              <Image
                src="/ethereum-icon.png"
                alt="Ethereum"
                width={20}
                height={20}
                className="mr-2"
              />
              Ethereum
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {selectedNetwork === "Sui" ? <SuiConnectButton /> : null}
        {selectedNetwork === "Solana" && <SolanaConnectButton />}
        {selectedNetwork === "Ethereum" && (
          <EthereumConnectButton onConnect={() => {}} />
        )}
        {/* theme component */}
        {/* <ThemeToggle /> */}
        {/* hello component */}
        {/* {isWalletConnected && selectedNetwork !== "Sui" && (
          <>
            <div className="text-sm text-muted-foreground">Hello</div>
            <Avatar>
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </>
        )} */}
        {/* disconnect component */}
        {/* {selectedNetwork === "Sui" && isWalletConnected && (
          <Button variant="outline" onClick={handleDisconnect}>
            Disconnect
          </Button>
        )} */}
      </div>
    </div>
  );
}
