"use client"

import type React from "react"
import { useMemo } from "react"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets"
import { clusterApiUrl } from "@solana/web3.js"

// Default styles for the wallet modal
import "@solana/wallet-adapter-react-ui/styles.css"

interface WalletProviderWrapperProps {
  children: React.ReactNode
}

export function WalletProviderWrapper({ children }: WalletProviderWrapperProps) {
  // You can also provide a custom RPC endpoint here
  // For your QuickNode RPC:
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(WalletAdapterNetwork.Mainnet),
    [],
  )

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      // Add more wallets here if needed
    ],
    [],
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
