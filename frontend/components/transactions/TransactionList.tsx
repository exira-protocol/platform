import React, { useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  ArrowUpRight,
  ArrowLeftRight,
  Lock,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Clipboard,
  Info,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types/transaction";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const statusStyles = {
  success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  in_process:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const typeIcons = {
  buy: <Wallet className="h-4 w-4 text-green-500" />,
  sell: <ArrowUpRight className="h-4 w-4 text-red-500" />,
};

const statusIcons = {
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  in_process: <Clock className="h-4 w-4 text-yellow-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
};

const getExplorerUrl = (network: string, hash: string) => {
  const explorers: Record<string, string> = {
    Ethereum: "https://etherscan.io/tx/",
    BSC: "https://bscscan.com/tx/",
    Polygon: "https://polygonscan.com/tx/",
    Arbitrum: "https://arbiscan.io/tx/",
    Optimism: "https://optimistic.etherscan.io/tx/",
  };
  return explorers[network] + hash;
};

const tokenIdMapping = {
  "1": "EXEMB",
  "2": "EMBO",
  "3": "MIND",
  "4": "BROK",
};

export function TransactionList({
  transactions,
  isLoading,
}: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No transactions found
      </div>
    );
  }

  useEffect(() => {
    console.log("Transactions [list]:", transactions);
  }, [transactions]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>TYPE</TableHead>
          <TableHead>QUANTITY</TableHead>
          <TableHead>NETWORK</TableHead>
          <TableHead>STATUS</TableHead>
          <TableHead>TOTAL VALUE</TableHead>
          <TableHead>HASH</TableHead>
          <TableHead className="text-right">DATE</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                {typeIcons[transaction.type]}
                {transaction.txn_type === "buy" ? (
                  <span
                    className="capitalize bg-green-300/60 text-black px-2 py-1 rounded-2xl
                  text-xs"
                  >
                    {transaction.txn_type}
                  </span>
                ) : (
                  <span className="capitalize bg-red-300/60 text-black px-2 py-1 rounded-2xl text-xs">
                    {transaction.txn_type}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="font-medium">{transaction.quantity}</div>
            </TableCell>
            <TableCell>
              {transaction.chain === "Solana" ? (
                <div className="font-medium flex flex-row items-center justify-cente gap-x-2">
                  <Image
                    src="/solana.svg"
                    alt="Solana"
                    width={20}
                    height={20}
                    // className="mr-2"
                  />
                  {transaction.chain}
                </div>
              ) : (
                <div className="font-medium">{transaction.chain}</div>
              )}
              {/* <div className="text-sm text-muted-foreground">
                {transaction.confirmations} confirmations
              </div> */}
            </TableCell>
            <TableCell>
              <div className="flex flex-row items-center">
                <Badge
                  variant="secondary"
                  className={statusStyles[transaction.status]}
                >
                  {transaction.status}
                </Badge>
                {transaction.status === "processing" ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="ml-2 h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent className="w-64">
                        <p>
                          Large scale transaction will be processed in T+1 days
                          and will be automatically credited to your wallet. You
                          can check the status of your transaction in this page
                          later. If a transaction remains in "processing" or
                          "failed" status please reach out to us using the
                          contact form.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </div>
            </TableCell>
            <TableCell>
              {transaction.txn_type === "sell" ? (
                <>
                  {(
                    parseFloat(transaction.price_per_share) *
                    parseInt(transaction.quantity)
                  ).toFixed(3)}{" "}
                  USDC
                </>
              ) : (
                <>
                  {parseInt(transaction.quantity)}{" "}
                  {tokenIdMapping[transaction.share_id]}
                </>
              )}
            </TableCell>
            <TableCell>
              {/* <Button variant="ghost" size="sm" className="h-8 px-2"> */}
              <div className="flex flex-row items-center gap-x-2">
                <Clipboard
                  className="ml-2 h-3 w-3"
                  onClick={() => {
                    console.log("Copied to clipboard:", transaction.token_hash);
                    navigator.clipboard.writeText(transaction.token_hash);
                  }}
                />
                {transaction.token_hash.slice(0, 6)}...
                {transaction.token_hash.slice(-4)}
                <ExternalLink
                  className="ml-2 h-3 w-3"
                  onClick={() =>
                    window.open(
                      getExplorerUrl(transaction.network, transaction.hash),
                      "_blank"
                    )
                  }
                />
                {/* add a clipboard copy button */}
              </div>
            </TableCell>
            <TableCell className="text-right">
              {/* {new Date(transaction.timestamp).toLocaleDateString()} */}
              {/* convert timestamp to this format - 12 Jan, 4:45 PM */}
              {new Date(transaction.timestamp).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
