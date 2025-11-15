"use client";

import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter, LedgerWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

// 1. Explicitly set the network to Devnet
const network = WalletAdapterNetwork.Devnet;

// 2. Define the RPC endpoint based on the network
// const endpoint = clusterApiUrl(network);
const endpoint = "https://devnet.helius-rpc.com/?api-key=d058c230-69f1-4f9c-bb73-c21ce32a483a"

export const SolanaWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    // 3. Define the wallets you want to support
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new LedgerWalletAdapter(),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
