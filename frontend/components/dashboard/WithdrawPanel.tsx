import React from "react";
import { Button } from "@/components/ui/button";
import { RealEstateToken } from "@/hooks/useDashboardData";

interface TransactionValues {
  amount: string;
  tokenAmount: string;
}

interface WithdrawPanelProps {
  selectedToken: RealEstateToken;
  transactionValues: TransactionValues;
  onTokenChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const formatNumber = (value: string): string => {
  if (!value) return "0";
  const number = parseFloat(value.replace(/,/g, ""));
  if (isNaN(number)) return "0";
  return new Intl.NumberFormat("en-US").format(number);
};

export const WithdrawPanel: React.FC<WithdrawPanelProps> = ({
  selectedToken,
  transactionValues,
  onTokenChange,
}) => (
  <div className="space-y-4">
    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Your Shares
        </span>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {selectedToken.symbol.charAt(0)}
          </div>
          <span className="text-base font-medium">{selectedToken.symbol}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs bg-transparent border-gray-300 hover:bg-gray-100"
          >
            MAX
          </Button>
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={formatNumber(transactionValues.tokenAmount)}
          onChange={onTokenChange}
          className="w-[180px] text-right bg-transparent border-none focus:outline-none text-2xl font-medium"
          placeholder="0"
        />
      </div>
    </div>

    <div className="flex items-center justify-center">
      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-md">
        ↓
      </div>
    </div>

    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Equivalent USDC
        </span>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            U
          </div>
          <span className="text-base font-medium">USDC</span>
        </div>
        <input
          type="text"
          value={formatNumber(transactionValues.amount)}
          disabled
          className="w-[180px] text-right bg-transparent border-none focus:outline-none text-2xl font-medium text-gray-500"
        />
      </div>
    </div>

    <div className="mt-4 mb-2 p-3 py-1 bg-gray-501 dark:bg-gray-9001 rounded-lg">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">You will get:</span>
        <span className="font-bold text-xl">
          {(
            Number.parseFloat(transactionValues.amount || "0") *
            (1 - selectedToken.mintFee / 100)
          ).toFixed(4)}{" "}
          USDC
        </span>
      </div>
      <div className="flex justify-between items-center text-xs mt-1">
        <span className="text-gray-500 dark:text-gray-500">
          Includes {selectedToken.mintFee}% minting fee deduction
        </span>
      </div>
    </div>

    <Button
      className="w-full bg-black text-white hover:bg-gray-800 text-base py-5"
      size="lg"
    >
      Pay Now
    </Button>

    <div className="space-y-2 pt-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Processing Time
        </span>
        <span>T+1 Day</span>
      </div>
    </div>
  </div>
);
