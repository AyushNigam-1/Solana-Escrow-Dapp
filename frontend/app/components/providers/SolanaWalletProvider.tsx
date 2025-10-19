"use client";

import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter, LedgerWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// NOTE: You must import the CSS for the wallet modal UI somewhere in your project.
// The best place is often in your 'globals.css' file or directly in your root 'layout.tsx'.
// import "@solana/wallet-adapter-react-ui/styles.css";

// 1. Explicitly set the network to Devnet
const network = WalletAdapterNetwork.Devnet;

// 2. Define the RPC endpoint based on the network
const endpoint = clusterApiUrl(network);

export const SolanaWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    // 3. Define the wallets you want to support
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new LedgerWalletAdapter(),
        ],
        // The list of wallets will only be calculated once
        [network]
    );

    return (
        // A. ConnectionProvider manages the RPC connection to the cluster
        <ConnectionProvider endpoint={endpoint}>
            {/* B. WalletProvider manages the state of the connected wallet */}
            <WalletProvider wallets={wallets} autoConnect>
                {/* C. WalletModalProvider provides the UI for wallet selection */}
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
