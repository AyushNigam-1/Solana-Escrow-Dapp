import { PublicKey } from "@solana/web3.js";

export interface UserTokenAccount {
    address: PublicKey; // The address of the Token Account (not the mint)
    mint: PublicKey;    // The Mint address (Token A or Token B)
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