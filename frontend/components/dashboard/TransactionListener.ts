"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface TransactionListenerProps {
  usdcHash: string;
}

const TransactionListener: React.FC<TransactionListenerProps> = ({
  usdcHash,
}) => {
  const [status, setStatus] = useState<string | null>("queued");

  useEffect(() => {
    if (!usdcHash) return;

    console.log("🔍 Listening for transaction updates on hash:", usdcHash);

    const channel = supabase
      .channel("transactions-update-channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transactions",
          filter: `usdc_hash=eq.${usdcHash}`,
        },
        (payload) => {
          console.log("🔔 Transaction update received:", payload);

          const newStatus = payload.new.status;
          setStatus(newStatus);

          if (newStatus === "success") {
            toast.success("✅ Tokens successfully minted!");
            console.log("✅ Transaction completed. Stopping listener.");
            supabase.removeChannel(channel); // Stop listening
          } else if (newStatus === "failed") {
            toast.error("❌ Transaction failed. Please try again.");
            console.log("❌ Transaction failed. Stopping listener.");
            supabase.removeChannel(channel); // Stop listening
          } else {
            console.log(`⏳ Transaction still pending: ${newStatus}`);
          }
        }
      )
      .subscribe();

    return () => {
      console.log("🔄 Cleaning up Supabase Realtime listener...");
      supabase.removeChannel(channel);
    };
  }, [usdcHash]);

  return null;
};

export default TransactionListener;
