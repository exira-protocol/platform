import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import "@solana/wallet-adapter-react-ui/styles.css";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { useGlobalState } from "@/context/GlobalStateContext";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

export function SolanaConnectButton() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { setWalletAddress, setIsWalletConnected, selectedNetwork } =
    useGlobalState();

  useEffect(() => {
    if (connection && publicKey && selectedNetwork === "Solana") {
      setWalletAddress(publicKey);
      setIsWalletConnected(true);
    } else {
      setWalletAddress(null);
      setIsWalletConnected(false);
    }
  }, [connection, publicKey]);
  return (
    <>
      <WalletMultiButton />
    </>
  );
}
