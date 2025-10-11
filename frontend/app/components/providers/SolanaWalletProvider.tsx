"use client";

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

// This component uses React hooks and context, so it must be "use client"
export const SolanaWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
    // RPC Endpoint.
    const endpoint = "http://127.0.0.1:8899"; // or useMemo(() => clusterApiUrl(WalletAdapterNetwork.Devnet), []);

    const wallets = useMemo(() => [
        // Define your wallets here
    ], []);

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