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
// BU8Hen9NE5zpHGP4hkP3xHZ7BndYUWViqr7TQc2SYfyr
export interface EscrowState {
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
export interface EscrowData {
    // initializerKey: string;
    uniqueSeed: string;
    initializerDepositTokenAccount: string;
    escrowPda: PublicKey;
    tokenAMintAddress: string;
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
    status?: string,
    publicKey: PublicKey;
    account: EscrowState;
    tokenA: { // Initializer Deposit Token (Token A)
        amount: string;
        metadata: TokenMetadata;
    };
    tokenB: { // Taker Expected Token (Token B)
        amount: string;
        metadata: TokenMetadata;
    };
}