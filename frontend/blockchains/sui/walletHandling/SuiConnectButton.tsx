import React, { useEffect } from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useGlobalState } from "@/context/GlobalStateContext";

import '@mysten/dapp-kit/dist/index.css';

export function SuiConnectButton() {
  const account = useCurrentAccount();
  const { setWalletAddress, setIsWalletConnected, selectedNetwork } =
    useGlobalState();

  useEffect(() => {
    if (account && selectedNetwork === "Sui") {
      setWalletAddress(account.address);
      setIsWalletConnected(true);
    } else {
      setWalletAddress(null);
      setIsWalletConnected(false);
    }
  }, [account, selectedNetwork, setWalletAddress, setIsWalletConnected]);

  if (selectedNetwork !== "Sui") {
    return null;
  }

  return (
    <div>
      <ConnectButton />
      {/* {account && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Connected: {account.address.slice(0, 6)}...{account.address.slice(-4)}
        </div>
      )} */}
    </div>
  );
}
