// 🚀 Server-side Utility for UMI & Metaplex
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";

export function initializeUmi(connection, wallet) {
  const umi = createUmi(connection)
    .use(walletAdapterIdentity(wallet))
    .use(mplTokenMetadata());

  return umi;
}
