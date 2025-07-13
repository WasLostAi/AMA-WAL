"use client"

import type React from "react"
import { useMemo } from "react"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets" // Corrected import path for Phantom
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl } from "@solana/web3.js"

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css"

interface WalletProviderWrapperProps {
  children: React.ReactNode
}

export default function WalletProviderWrapper({ children }: WalletProviderWrapperProps) {
  const network = WalletAdapterNetwork.Devnet // Or your desired network

  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  const wallets = useMemo(() => [new PhantomWalletAdapter()], [network])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
