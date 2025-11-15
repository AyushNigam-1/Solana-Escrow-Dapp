import { PublicKey } from "@solana/web3.js";

export interface ExchangeParams {
    uniqueSeed: string;
    escrowPDA: string;
    initializerKey: string;
    depositTokenMint: string,
    receiveTokenMint: string,
}

export interface UpdateParams {
    address: string;
    escrow: { escrow_pda?: string; status: string, account?: any, publicKey?: string };
    action: string
}

export interface CancelParams {
    uniqueSeed: string;
    initializerDepositTokenAccount: string;
    escrowPda: PublicKey;
    tokenAMintAddress: string;
}