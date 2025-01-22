import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RealEstateToken } from "@/hooks/useDashboardData";
import { useDebounce } from "@/hooks/useDebounce";
import { TransactionPanel } from "./TransactionPanel";
import { WithdrawPanel } from "./WithdrawPanel";

interface BuyingSectionProps {
  selectedToken: RealEstateToken | null;
}

interface TransactionValues {
  amount: string;
  tokenAmount: string;
}

export function BuyingSection({ selectedToken }: BuyingSectionProps) {
  const [transactionType, setTransactionType] = useState<"buy" | "withdraw">(
    "buy"
  );
  const [transactionValues, setTransactionValues] = useState<TransactionValues>(
    {
      amount: "",
      tokenAmount: "0",
    }
  );

  const debouncedAmount = useDebounce(transactionValues.amount, 300);
  const debouncedTokenAmount = useDebounce(transactionValues.tokenAmount, 300);

  useEffect(() => {
    if (!selectedToken || !debouncedAmount) {
      setTransactionValues((prev) => ({ ...prev, tokenAmount: "0" }));
      return;
    }

    const amount = parseFloat(debouncedAmount.replace(/,/g, ""));
    if (!isNaN(amount)) {
      const tokenAmount = Math.round(amount / selectedToken.in_USD).toString();
      setTransactionValues((prev) => ({ ...prev, tokenAmount }));
    }
  }, [debouncedAmount, selectedToken]);

  useEffect(() => {
    if (!selectedToken || !debouncedTokenAmount) {
      setTransactionValues((prev) => ({ ...prev, amount: "0" }));
      return;
    }

    const tokenAmount = parseInt(debouncedTokenAmount.replace(/,/g, ""), 10);
    if (!isNaN(tokenAmount)) {
      const amount = (tokenAmount * selectedToken.in_USD).toFixed(2);
      setTransactionValues((prev) => ({ ...prev, amount }));
    }
  }, [debouncedTokenAmount, selectedToken]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^0-9.]/g, "");
    setTransactionValues((prev) => ({ ...prev, amount: input }));
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^0-9]/g, "");
    setTransactionValues((prev) => ({ ...prev, tokenAmount: input }));
  };

  if (!selectedToken) return null;

  return (
    <div className="bg-gray-200 dark:bg-gray-800 p-4 rounded-xl w-full">
      <div className="flex mb-4">
        <Button
          className={cn(
            "flex-1 rounded-r-none text-sm py-2",
            transactionType === "buy"
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-700 hover:text-white"
          )}
          onClick={() => setTransactionType("buy")}
        >
          Buy
        </Button>
        <Button
          className={cn(
            "flex-1 rounded-l-none text-sm py-2",
            transactionType === "withdraw"
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-700 hover:text-white"
          )}
          onClick={() => setTransactionType("withdraw")}
        >
          Withdraw
        </Button>
      </div>

      {/* <TransactionPanel
        selectedToken={selectedToken}
        transactionValues={transactionValues}
        onAmountChange={handleAmountChange}
        onTokenChange={handleTokenChange}
        transactionType={transactionType}
      /> */}

      {transactionType === "buy" ? (
        <TransactionPanel
          selectedToken={selectedToken}
          transactionValues={transactionValues}
          onAmountChange={handleAmountChange}
          onTokenChange={handleTokenChange}
          transactionType={transactionType}
        />
      ) : (
        <WithdrawPanel
          selectedToken={selectedToken}
          transactionValues={transactionValues}
          onTokenChange={handleTokenChange}
        />
      )}
    </div>
  );
}
