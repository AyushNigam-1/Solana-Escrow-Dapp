import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { LucideIcon } from "lucide-react";

export interface GlobalStats {
    totalEscrowsCreated: bigint;
    totalEscrowsCompleted: bigint;
    totalEscrowsCanceled: bigint;
    totalValueLocked: bigint;
    totalValueReleased: bigint;
    daily_creations: { date: string; count: number }[];
    bump: number;
}
interface EscrowStatusItem {
    name: string;
    value: number;
    color: string;
    icon: LucideIcon;
    [key: string]: any; // Allows additional properties, satisfying ChartDataInput[]
}


/** Interface for the Value Flow Bar Chart data */
interface ValueFlowItem {
    name: string;
    value: number;
    color: string;
    [key: string]: any; // Allows additional properties, satisfying ChartDataInput[]
}
export interface ParsedData {
    totalEscrows: number;
    escrowStatusData: EscrowStatusItem[];
    valueFlowData: ValueFlowItem[];
    rawStats: {
        created: number;
        completed: number;
        canceled: number;
        lockedValue: number;
        releasedValue: number;
    };
}

export interface FullTokenMetadata {
    name: string;
    symbol: string;
    uri: string;
    description: string;
    image: string;
    mintAddress: string;
}

export interface UserTokenAccount {
    tokenAddress: string; // The address of the Token Account (not the mint)
    mint: string;    // The Mint address (Token A or Token B)
    amount: number;     // The balance held in the account (as a whole number)
    uiAmount: number;   // The balance held in the account (with decimals applied)
    decimals: number;   // The decimals of the associated mint
    name: string;
    symbol: string;
    description: string;
    image: string
}

interface TokenMetadata {
    name: string;
    symbol: string;
    description: string;
    image: string; // The URL for the token image
    mintAddress: string;
}

export interface Accounts {
    initializerKey: string;
    initializerDepositTokenMint: string;
    takerExpectedTokenMint: string;
    initializerAmount: string; // Use BN for u64
    takerExpectedAmount: string; // Use BN for u64
    initializerReceiveTokenAccount: string;
    initializerDepositTokenAccount: string;
    uniqueSeed: number[]; // Anchor decodes [u8; 8] as number[]
    expiresAt: anchor.BN;        // ← ADD THIS: i64 → BN (signed)
    bump: number;
}

export interface Escrow {
    status?: string,
    publicKey: PublicKey;
    account: Accounts;
    tokenA: {
        amount: string;
        metadata: TokenMetadata;
    };
    tokenB: {
        amount: string;
        metadata: TokenMetadata;
    };
}

export interface ExchangeQuery { escrow_pda: string; initializerKey: string; }