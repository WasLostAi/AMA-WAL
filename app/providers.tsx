"use client"

import type React from "react"
import { useMemo } from "react"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets" // Keep these if they are still here
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack" // Correct import for Backpack

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css"

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Mainnet // Using Mainnet as per your RPC

  // You can also provide a custom RPC endpoint.
  const endpoint =
    "https://distinguished-side-sunset.solana-mainnet.quiknode.pro/eecbdb8bd96fb687a6c1e38c1ce13e34fdc4a93c"

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(), // Now imported from its dedicated package
      // Add more wallets here if desired
    ],
    [network],
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
