import * as anchor from '@coral-xyz/anchor';
import {
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { useProgram } from './useProgram';
import { ensureATA, fetchTokenMetadata, generateUniqueSeed, getMintProgramId } from '@/app/utils/token';
import { Escrow, EscrowAccount } from '@/app/types';
import axios from 'axios';
const API_BASE = "http://localhost:3000"
const getGlobalStatsPDA = (programId: PublicKey) => {
    const [pda, _] = PublicKey.findProgramAddressSync(
        [Buffer.from("global-stats")],
        programId
    );
    return pda;
};
export const useEscrowActions = () => {
    const { program, PROGRAM_ID, sendTransaction, publicKey, anchorWallet, getEscrowStatePDA, getVaultPDA, connection } = useProgram()

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
        takerExpectedMint: PublicKey
    ) => {
        if (!program || !publicKey) {
            throw new Error("Wallet not connected or program not loaded.");
        }
        // console.log(PROGRAM_ID.toString())
        const initializerKey = anchorWallet?.publicKey!;

        // --- STEP 1: DYNAMIC TOKEN PROGRAM DETECTION (NO HARDCODED GUARDRAIL) ---
        const depositTokenProgramId = await getMintProgramId(initializerDepositMint);
        const receiveTokenProgramId = await getMintProgramId(takerExpectedMint);

        if (!depositTokenProgramId.equals(receiveTokenProgramId)) {
            throw new Error(
                "Mints must use the same token program (both legacy SPL or both Token-2022)."
            );
        }

        const tokenProgramToUse = depositTokenProgramId;

        // --- STEP 2: Generate nonce and compute PDA ---
        const uniqueSeed = generateUniqueSeed();
        const escrowStatePDA = getEscrowStatePDA(initializerKey, uniqueSeed);

        // Ensure ATAs exist
        const initializerDepositTokenAccount = await ensureATA(initializerDepositMint, initializerKey, sendTransaction);
        const initializerReceiveTokenAccount = await ensureATA(takerExpectedMint, initializerKey, sendTransaction);

        // Convert amounts to Anchor's internal BN (BigNumber) format
        const initializerAmountBN = new anchor.BN(initializerAmount);
        const takerExpectedAmountBN = new anchor.BN(takerExpectedAmount);
        const [vaultAccountPDA] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("vault"),                      // Static seed
                escrowStatePDA.toBuffer(),                 // Key of the Escrow State Account
            ],
            PROGRAM_ID
        );
        try {
            const txSignature = await program.methods
                .initialize(
                    initializerAmountBN,
                    takerExpectedAmountBN,
                    uniqueSeed.toJSON().data
                )
                .accounts({
                    initializer: initializerKey,
                    initializerDepositTokenAccount: initializerDepositTokenAccount,
                    initializerDepositTokenMint: initializerDepositMint,
                    takerExpectedTokenMint: takerExpectedMint,
                    initializerReceiveTokenAccount: initializerReceiveTokenAccount,
                    escrowState: escrowStatePDA,
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

            console.log("✅ Escrow Initialized! Sig:", txSignature);
            const eventData = await getEventsFromSignature(txSignature, "initializeEvent");
            console.log(eventData)
            if (!eventData) {
                console.warn("Event data not found in confirmed transaction. Check program logs.");
            }
            return { tx: txSignature, escrowStatePDA, eventData };

        } catch (error: any) {
            console.error("Error initializing escrow:", error);
            if (error.logs) {
                console.error("Program Logs:", error.logs);
            }
            throw new Error("Failed to initialize escrow. Check console for details.");
        }

    };
    // async function fetchEscrowState(
    //     escrowPda: PublicKey
    // ): Promise<any> {
    //     try {
    //         // Step 1: Derive the PDA address
    //         // const escrowStatePDA = getEscrowStatePDA(anchorWallet?.publicKey!, uniqueSeed);
    //         // console.log(`Attempting to fetch data for PDA: ${escrowStatePDA.toBase58()}`);

    //         // Step 2: Fetch the account data using the PDA address
    //         // The first argument to fetch is the PDA address.
    //         const escrowData = await program!.account.escrowState.fetch(escrowPda);

    //         console.log("Successfully fetched escrow data:", escrowData);
    //         // Add the PDA and bump to the retrieved object for convenience
    //         return {
    //             ...escrowData,
    //             // pda: escrowStatePDA,
    //             // bump: bump
    //         };

    //     } catch (error) {
    //         // This is where you catch errors like:
    //         // - Account does not exist (Error: Account <ADDRESS> does not exist)
    //         // - Could not decode account data (if the IDL is wrong)
    //         console.error("Failed to fetch escrow state:", error);
    //         throw new Error(`Could not retrieve Escrow state. Check the initializer key, unique seed, and if the account exists.`);
    //     }
    // }
    async function cancelEscrow(
        uniqueSeed: Buffer,
        initializerDepositTokenAccountKey: PublicKey,
        mintAddress: PublicKey,
        escrowPDA: PublicKey
    ) {
        console.log("Cancel Escrow called with seed:", uniqueSeed.toString('hex'), initializerDepositTokenAccountKey, mintAddress);

        const vaultAccountPDA = getVaultPDA(escrowPDA);

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
        depositTokenMint: PublicKey, // Mint A (initializer_deposit_mint)
        receiveTokenMint: PublicKey, // Mint B (taker_expected_mint)
    ): Promise<{ escrow_pda: string; initializerKey: string; }> {
        const takerKey = anchorWallet?.publicKey;

        if (!takerKey) {
            throw new Error("Wallet not connected. Taker must be a signer.");
        }
        if (!program) {
            throw new Error("Anchor program not initialized.");
        }

        const programId = program.programId; // Get the ID of your Anchor program
        console.log("recieve token mint", receiveTokenMint)
        // --- 1. Derive all necessary accounts ---
        const vaultAccountPDA = getVaultPDA(escrowPDA);
        const globalStatsPDA = getGlobalStatsPDA(programId); // NEW: Global stats PDA

        const takerDepositTokenAccount = await ensureATA(
            receiveTokenMint, // Taker deposits Token B (receiveTokenMint)
            takerKey,
            sendTransaction,
        );

        const takerReceiveTokenAccount = await ensureATA(
            depositTokenMint, // Taker receives Token A (depositTokenMint)
            takerKey,
            sendTransaction,
        );

        // NOTE: This ATA must be the exact one stored in the EscrowState account
        // It's safer to read the EscrowState account to get the exact key
        // For now, we rely on the function logic matching the creation logic
        const initializerReceiveTokenAccount = await ensureATA(
            receiveTokenMint, // Initializer receives Token B (receiveTokenMint)
            initializerKey,
            sendTransaction,
            // TOKEN_2022_PROGRAM_ID // Ensure this is passed to ATA creation
        );

        console.log(`[Exchange] Taker (Signer): ${takerKey.toBase58()}`);
        // ... console logs ...

        try {
            // --- 2. Build the transaction instruction (FIXED ACCOUNTS) ---
            const tx = await program!.methods
                .exchange()
                .accounts({
                    taker: takerKey,
                    takerDepositTokenAccount,
                    takerReceiveTokenAccount,
                    initializerReceiveTokenAccount,
                    escrowState: escrowPDA,
                    vaultAccount: vaultAccountPDA,

                    // NEW: Required by the Anchor context
                    globalStats: globalStatsPDA,

                    // NEW: Mints required for CPI TransferChecked validation/decimals
                    initializerDepositMint: depositTokenMint,
                    takerExpectedMint: receiveTokenMint,

                    initializerKey: initializerKey, // The original seller's key for constraint check
                    tokenProgram: TOKEN_2022_PROGRAM_ID,

                    // NEW: Required system accounts
                    systemProgram: SystemProgram.programId,
                    // Rent is necessary for closing accounts
                    rent: SYSVAR_RENT_PUBKEY,
                })
                // 3. Send the transaction
                .rpc();

            console.log("Escrow exchange successful! Transaction:", tx);
            return { escrow_pda: escrowPDA.toBase58(), initializerKey: initializerKey.toBase58() };

        } catch (error) {
            console.error("Failed to execute escrow exchange:", error);
            throw new Error(`Exchange failed. Ensure all token accounts are correctly initialized and the constraints are met.`);
        }
    }
    const userEscrows = async () => {
        console.log(publicKey)
        const { data } = await axios.get(`${API_BASE}/api/escrows/${publicKey}`)
        const escrows: any = []
        console.log("data", data, "data")
        for (const escrow of data) {
            const [tokenAMetadata, tokenBMetadata] = await Promise.all([
                fetchTokenMetadata(new PublicKey(escrow.accept_mint)),
                fetchTokenMetadata(new PublicKey(escrow.offer_mint))
            ]);

            escrows.push({
                publicKey: escrow.escrow_pda,
                tokenA: {
                    amount: escrow.offer_amount,
                    metadata: tokenAMetadata,
                },
                tokenB: {
                    amount: escrow.offer_mint,
                    metadata: tokenBMetadata,
                },
                stauts: escrow.status
            })
        };
        console.log(escrows)
        return (escrows)
    }
    return { initializeEscrow, fetchAllEscrows, cancelEscrow, exchangeEscrow, userEscrows };
}
