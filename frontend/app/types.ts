import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

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

export interface FullTokenMetadata {
    name: string;
    symbol: string;
    uri: string;
    description: string;
    image: string;
    mintAddress: string;
}
export interface OffChainMetadata {
    name: string;
    symbol: string;
    description: string;
    image: string;
}

export interface UseUserTokenAccountsHook {
    accounts: UserTokenAccount[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export interface EscrowState {
    initializerKey: PublicKey;
    initializerDepositTokenMint: PublicKey;
    takerExpectedTokenMint: PublicKey;
    initializerAmount: anchor.BN; // Use BN for u64
    takerExpectedAmount: anchor.BN; // Use BN for u64
    initializerReceiveTokenAccount: PublicKey;
    initializerDepositTokenAccount: PublicKey;
    uniqueSeed: number[]; // Anchor decodes [u8; 8] as number[]
    bump: number;
}

// Define the structure of the fetched account data
export interface EscrowAccount {
    publicKey: PublicKey;
    account: EscrowState;
}
interface TokenMetadata {
    name: string;
    symbol: string;
    description: string;
    image: string; // The URL for the token image
    mintAddress: string;
}


export interface Escrow {
    publicKey: string;
    bump: number;
    seedHex: string;
    initializerKey: string;
    tokenA: { // Initializer Deposit Token (Token A)
        amount: string;
        metadata: TokenMetadata;
    };
    tokenB: { // Taker Expected Token (Token B)
        amount: string;
        metadata: TokenMetadata;
    };
    initializerReceiveTokenAccount: string;
    initializerDepositTokenAccount: string;
}