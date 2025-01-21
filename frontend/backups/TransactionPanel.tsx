import React from "react";
import { Button } from "@/components/ui/button";
import { RealEstateToken } from "@/hooks/useDashboardData";

interface TransactionValues {
  amount: string;
  tokenAmount: string;
}

interface TransactionPanelProps {
  selectedToken: RealEstateToken;
  transactionValues: TransactionValues;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  transactionType: "buy" | "withdraw";
}

const formatNumber = (value: string): string => {
  if (!value) return "";
  const number = parseFloat(value.replace(/,/g, ""));
  if (isNaN(number)) return "";
  return new Intl.NumberFormat("en-US").format(number);
};

export const TransactionPanel: React.FC<TransactionPanelProps> = ({
  selectedToken,
  transactionValues,
  onAmountChange,
  transactionType,
}) => (
  <div className="space-y-4">
    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Balance
        </span>
        <span className="text-sm">0 USDC</span>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            U
          </div>
          <span className="text-base font-medium">USDC</span>
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
          value={formatNumber(transactionValues.amount)}
          onChange={onAmountChange}
          className="w-[180px] text-right bg-transparent border-none focus:outline-none text-2xl font-medium"
          placeholder="0"
        />
      </div>
    </div>

    <div className="flex items-center justify-center">
      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm">
        {transactionType === "buy" ? "↓" : "↑"}
      </div>
    </div>

    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">Rate</span>
        <span className="text-sm">
          1 {selectedToken.symbol} ≈ ${selectedToken.in_USD.toFixed(4)} USDC
        </span>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {selectedToken.symbol.charAt(0)}
          </div>
          <span className="text-base font-medium">{selectedToken.symbol}</span>
        </div>
        <span className="text-2xl font-medium">
          {formatNumber(transactionValues.tokenAmount)}
        </span>
      </div>
    </div>

    <div className="mt-4 mb-2 p-3 py-1 bg-gray-501 dark:bg-gray-9001 rounded-lg">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">Total to Pay:</span>
        <span className="font-bold text-xl">
          {(
            Number.parseFloat(transactionValues.tokenAmount) *
            (1 + selectedToken.mintFee / 100)
          ).toFixed(4)}{" "}
          USDC
        </span>
      </div>
      <div className="flex justify-between items-center text-xs mt-1">
        <span className="text-gray-500 dark:text-gray-500">
          Includes {selectedToken.mintFee}% mint fee
        </span>
      </div>
    </div>

    <Button
      className="w-full bg-black text-white hover:bg-gray-800 text-base py-5"
      size="lg"
    >
      CONNECT WALLET
    </Button>

    <div className="space-y-2 pt-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400 underline">
          Allowance
        </span>
        <span>
          {selectedToken.maxAllowance.toLocaleString()} {selectedToken.symbol}
        </span>
      </div>
      {/* <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400 flex items-center">
          Mint Fee
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 ml-1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
        </span>
        <span>{selectedToken.mintFee}%</span>
      </div> */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Instantly Available
        </span>
        <span>
          {selectedToken.instantlyAvailable.toLocaleString()}{" "}
          {selectedToken.symbol}
        </span>
      </div>
    </div>
  </div>
);
