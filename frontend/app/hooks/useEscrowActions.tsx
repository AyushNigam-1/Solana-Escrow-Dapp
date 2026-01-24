import * as anchor from '@coral-xyz/anchor';
import {
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { useProgram } from './useProgram';
import { ensureATA, fetchTokenMetadata, generateUniqueSeed, getMintProgramId } from '@/app/utils/token';
import { GlobalStats } from '@/app/types/query';
import axios from 'axios';
import { Escrow } from '../types/query';
const API_BASE = "http://localhost:3000"

export const useEscrowActions = () => {
    const { program, PROGRAM_ID, sendTransaction, publicKey, anchorWallet, getEscrowStatePDA, getVaultPDA, getGlobalStatsPDA, connection } = useProgram()

    async function fetchAllEscrows(
    ): Promise<Escrow[]> {
        try {
            console.log("Fetching all EscrowState accounts...");

            if (!program) {
                console.warn("Program not loaded; returning empty escrow list.");
                return [];
            }
            const allEscrowAccounts = await (program.account as any).escrowState.all()
            const enhancedEscrows: Escrow[] = [];

            for (const escrow of allEscrowAccounts) {
                const { account, publicKey } = escrow;
                const [tokenAMetadata, tokenBMetadata] = await Promise.all([
                    fetchTokenMetadata(account.initializerDepositTokenMint),
                    fetchTokenMetadata(account.takerExpectedTokenMint)
                ]);
                const initialAmount = account.initializerAmount.toString(10);
                const expectedAmount = account.takerExpectedAmount.toString(10);

                const enhancedEscrow: Escrow = {
                    publicKey,
                    account,
                    tokenA: {
                        amount: initialAmount,
                        metadata: tokenAMetadata,
                    },
                    tokenB: {
                        amount: expectedAmount,
                        metadata: tokenBMetadata,
                    },
                };

                enhancedEscrows.push(enhancedEscrow);
            }
            return enhancedEscrows;

        } catch (error) {
            console.error("Error fetching and processing escrow accounts:", error);
            return [];
        }
    }

    async function getEventsFromSignature(
        txSignature: string,
        eventName: string
    ): Promise<any | null> {
        // 1. Fetch the confirmed transaction details
        const txResponse = await connection.getTransaction(txSignature, {
            maxSupportedTransactionVersion: 0,
            commitment: "confirmed",
        });
        if (!txResponse || !txResponse.meta?.logMessages) {
            console.error("Failed to fetch transaction or logs.");
            return null;
        }

        const eventParser = new anchor.EventParser(program!.programId, new anchor.BorshCoder(program!.idl));
        const decodedEvents = eventParser.parseLogs(txResponse.meta.logMessages);

        const initializeEvent = decodedEvents.find((e: any) => e.name === eventName);
        if (initializeEvent) {
            return initializeEvent.data;
        }
        console.warn("InitializeEvent not found in transaction logs.");
        return null;
    }

    const initializeEscrow = async (
        initializerAmount: number,
        takerExpectedAmount: number,
        initializerDepositMint: PublicKey,
        takerExpectedMint: PublicKey,
        durationInSeconds: number
    ) => {
        if (!program || !publicKey) {
            throw new Error("Wallet not connected or program not loaded.");
        }
        const initializerKey = anchorWallet?.publicKey!;

        const depositTokenProgramId = await getMintProgramId(initializerDepositMint);
        const receiveTokenProgramId = await getMintProgramId(takerExpectedMint);

        if (!depositTokenProgramId.equals(receiveTokenProgramId)) {
            throw new Error(
                "Mints must use the same token program (both legacy SPL or both Token-2022)."
            );
        }

        const tokenProgramToUse = depositTokenProgramId;
        const programId = program.programId; // Get the ID of your Anchor program

        const uniqueSeed = generateUniqueSeed();
        const escrowStatePDA = getEscrowStatePDA(initializerKey, uniqueSeed);
        const globalStatsPDA = getGlobalStatsPDA(programId); // NEW: Global stats PDA
        const vaultAccountPDA = getVaultPDA(escrowStatePDA);

        // Ensure ATAs exist
        const initializerDepositTokenAccount = await ensureATA(initializerDepositMint, initializerKey, sendTransaction);
        const initializerReceiveTokenAccount = await ensureATA(takerExpectedMint, initializerKey, sendTransaction);

        // Convert amounts to Anchor's internal BN (BigNumber) format
        const initializerAmountBN = new anchor.BN(initializerAmount);
        const takerExpectedAmountBN = new anchor.BN(takerExpectedAmount);
        const durationInSecondsBN = new anchor.BN(durationInSeconds)

        try {
            const txSignature = await program.methods
                .initialize(
                    initializerAmountBN,
                    takerExpectedAmountBN,
                    durationInSecondsBN,
                    uniqueSeed.toJSON().data,
                )
                .accounts({
                    initializer: initializerKey,
                    initializerDepositTokenAccount: initializerDepositTokenAccount,
                    initializerDepositTokenMint: initializerDepositMint,
                    takerExpectedTokenMint: takerExpectedMint,
                    initializerReceiveTokenAccount: initializerReceiveTokenAccount,
                    escrowState: escrowStatePDA,
                    globalStats: globalStatsPDA,
                    vaultAccount: vaultAccountPDA,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: tokenProgramToUse,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .rpc({
                    commitment: 'confirmed',  // Auto-sim + confirm
                    preflightCommitment: 'confirmed',
                    maxRetries: 3,
                });

            const account = await getEventsFromSignature(txSignature, "initializeEvent");
            if (!account) {
                console.warn("Event data not found in confirmed transaction. Check program logs.");
            }
            return { tx: txSignature, publicKey: escrowStatePDA.toBase58(), account };

        } catch (error: any) {
            console.error("Error initializing escrow:", error);
            if (error.logs) {
                console.error("Program Logs:", error.logs);
            }
            throw new Error("Failed to initialize escrow. Check console for details.");
        }
    };
    const generateDummyDailyData = (numDays: number = 7): { date: string; count: number }[] => {
        const data: { date: string; count: number }[] = [];
        let currentDate = new Date();
        // Set the start date to 6 days ago (for 7 days total including today)
        currentDate.setDate(currentDate.getDate() - numDays + 1);

        for (let i = 0; i < numDays; i++) {
            // Format date as MM/DD
            const dateStr = `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')}`;

            // Generate a slightly random, upward-trending count for visual appeal
            let baseCount = 50 + i * 20;
            const count = Math.floor(baseCount + (Math.random() * 50 - 25)); // Base +/- 25

            data.push({ date: dateStr, count: Math.max(10, count) }); // Ensure count is at least 10
            currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
        }
        return data;
    };

    const fetchGlobalStats = async (): Promise<GlobalStats | null> => {
        const globalStatsAddress = getGlobalStatsPDA(program!.programId);
        try {
            const stats = await (program!.account as any).globalStats.fetch(globalStatsAddress);
            const { data } = await axios(`${API_BASE}/api/stats`)
            return { ...stats, daily_creations: generateDummyDailyData(7) } as GlobalStats;
        } catch (error) {
            if (error instanceof Error && error.message.includes("Account does not exist")) {
                console.log("GlobalStats account not initialized yet.");
                return null;
            }
            console.error("Error fetching GlobalStats:", error);
            throw error;
        }
    }

    async function cancelEscrow(
        uniqueSeed: Buffer,
        initializerDepositTokenAccountKey: PublicKey,
        mintAddress: PublicKey,
        escrowPDA: PublicKey
    ) {
        console.log("Cancel Escrow called with seed:", uniqueSeed.toString('hex'), initializerDepositTokenAccountKey, mintAddress);
        const programId = program!.programId; // Get the ID of your Anchor program

        const vaultAccountPDA = getVaultPDA(escrowPDA);
        const globalStatsPDA = getGlobalStatsPDA(programId); // NEW: Global stats PDA

        const initializerKey = anchorWallet?.publicKey!;
        const tokenProgramId = await getMintProgramId(mintAddress);
        console.log(`Attempting to cancel Escrow at: ${escrowPDA.toBase58()}`);
        console.log(`Vault to close: ${vaultAccountPDA.toBase58()}`);

        try {
            // 2. Build the transaction instruction
            await program!.methods
                .cancel()
                .accounts({
                    initializer: initializerKey,
                    initializerDepositTokenAccount: initializerDepositTokenAccountKey,
                    vaultAccount: vaultAccountPDA,
                    globalStats: globalStatsPDA,
                    escrowState: escrowPDA,
                    initializerDepositMint: mintAddress,
                    tokenProgram: tokenProgramId, // Use the SPL Token Program ID
                })
                // 3. Send the transaction
                .rpc();

            console.log("Escrow cancellation successful! ");
            return escrowPDA.toBase58();

        } catch (error) {
            console.error("Failed to cancel escrow:", error);
            // Rethrow the error to be handled by the caller
            throw new Error(`Cancellation failed. Check if accounts are correct and signed.`);
        }
    }
    async function exchangeEscrow(
        escrowPDA: PublicKey,
        initializerKey: PublicKey,
        depositTokenMint: PublicKey,
        receiveTokenMint: PublicKey,
    ): Promise<{ escrow_pda: string; initializerKey: string; }> {

        const takerKey = anchorWallet?.publicKey!;
        const vaultAccountPDA = getVaultPDA(escrowPDA);
        const globalStatsPDA = getGlobalStatsPDA(PROGRAM_ID);

        const takerDepositTokenAccount = await ensureATA(
            receiveTokenMint,
            takerKey,
            sendTransaction,
        );

        const takerReceiveTokenAccount = await ensureATA(
            depositTokenMint,
            takerKey,
            sendTransaction,
        );

        const initializerReceiveTokenAccount = await ensureATA(
            receiveTokenMint,
            initializerKey,
            sendTransaction,
        );

        try {
            const tx = await program!.methods
                .exchange()
                .accounts({
                    taker: takerKey,
                    takerDepositTokenAccount,
                    takerReceiveTokenAccount,
                    initializerReceiveTokenAccount,
                    escrowState: escrowPDA,
                    vaultAccount: vaultAccountPDA,
                    globalStats: globalStatsPDA,
                    initializerDepositMint: depositTokenMint,
                    takerExpectedMint: receiveTokenMint,
                    initializerKey: initializerKey,
                    tokenProgram: TOKEN_2022_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .rpc();

            console.log("Escrow exchange successful! Transaction:", tx);
            return { escrow_pda: escrowPDA.toBase58(), initializerKey: initializerKey.toBase58() };

        } catch (error) {
            console.error("Failed to execute escrow exchange:", error);
            throw new Error(`Exchange failed. Ensure all token accounts are correctly initialized and the constraints are met.`);
        }
    }

    const userEscrows = async () => {
        const { data } = await axios.get(`${API_BASE}/api/escrows/${publicKey}`)
        const escrows: Escrow[] = []
        console.log("data", data, "data")
        try {
            for (const { account, publicKey, status } of data) {
                const [tokenAMetadata, tokenBMetadata] = await Promise.all([
                    fetchTokenMetadata(new PublicKey(account.initializerDepositTokenMint)),
                    fetchTokenMetadata(new PublicKey(account.takerExpectedTokenMint))
                ]);

                const initialAmount = account.initializerAmount.toString(10);
                const expectedAmount = account.takerExpectedAmount.toString(10);

                const enhancedEscrow: Escrow = {
                    status,
                    publicKey,
                    account,
                    tokenA: {
                        amount: initialAmount,
                        metadata: tokenAMetadata,
                    },
                    tokenB: {
                        amount: expectedAmount,
                        metadata: tokenBMetadata,
                    },
                };
                escrows.push(enhancedEscrow)
            };

        }
        catch (error) {
            console.log("some error ", error)
        }
        console.log("escrows", escrows)
        return escrows
    }
    return { initializeEscrow, fetchAllEscrows, cancelEscrow, exchangeEscrow, userEscrows, fetchGlobalStats };
}
