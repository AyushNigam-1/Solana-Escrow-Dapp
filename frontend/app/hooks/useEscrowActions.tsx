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

export const useEscrowActions = () => {
    const { program, PROGRAM_ID, sendTransaction, publicKey, anchorWallet, getEscrowStatePDA, getVaultPDA } = useProgram()

    async function fetchAllEscrows(
    ): Promise<Escrow[]> {
        try {
            console.log("Fetching all EscrowState accounts...");

            if (!program) {
                console.warn("Program not loaded; returning empty escrow list.");
                return [];
            }
            const allEscrowAccounts = await (program.account as any).escrowState.all() as EscrowAccount[];
            console.log(`Found ${allEscrowAccounts.length} escrow accounts. `);
            console.log(allEscrowAccounts);
            const enhancedEscrows: Escrow[] = [];

            for (const escrow of allEscrowAccounts) {
                const { account, publicKey } = escrow;
                const [tokenAMetadata, tokenBMetadata] = await Promise.all([
                    fetchTokenMetadata(account.initializerDepositTokenMint),
                    fetchTokenMetadata(account.takerExpectedTokenMint)
                ]);

                // Format amounts (BN to decimal string) and seed (Buffer to hex)
                const initialAmount = account.initializerAmount.toString(10); // Convert BN to decimal string
                const expectedAmount = account.takerExpectedAmount.toString(10); // Convert BN to decimal string
                const seedBuffer = Buffer.from(account.uniqueSeed).toString('hex');

                // Construct the final enhanced object
                const enhancedEscrow: Escrow = {
                    publicKey: publicKey.toBase58(),
                    bump: account.bump,
                    seedHex: seedBuffer,
                    initializerKey: account.initializerKey.toBase58(),

                    initializerReceiveTokenAccount: account.initializerReceiveTokenAccount.toBase58(),
                    initializerDepositTokenAccount: account.initializerDepositTokenAccount.toBase58(),
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


    const initializeEscrow = async (
        initializerAmount: number,
        takerExpectedAmount: number,
        initializerDepositMint: PublicKey,
        takerExpectedMint: PublicKey
    ) => {
        if (!program || !publicKey) {
            throw new Error("Wallet not connected or program not loaded.");
        }

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
            return { tx: txSignature, escrowStatePDA };

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
            const tx = await program!.methods
                .cancel()
                .accounts({
                    initializer: initializerKey,
                    initializerDepositTokenAccount: initializerDepositTokenAccountKey,
                    vaultAccount: vaultAccountPDA,
                    escrowState: escrowPDA,
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
    ): Promise<string> {
        const takerKey = anchorWallet?.publicKey;

        if (!takerKey) {
            throw new Error("Wallet not connected. Taker must be a signer.");
        }
        if (!program) {
            throw new Error("Anchor program not initialized.");
        }

        // 1. Derive the Vault PDA Address
        // The vault PDA is derived using a static seed "vault" and the Escrow State PDA Key.
        const vaultAccountPDA = getVaultPDA(escrowPDA);
        const takerDepositTokenAccount = await ensureATA(
            depositTokenMint,
            takerKey,
            sendTransaction
        );
        const takerReceiveTokenAccount = await ensureATA(
            receiveTokenMint,
            takerKey,
            sendTransaction
        );
        const initializerReceiveTokenAccount = await ensureATA(
            depositTokenMint,
            initializerKey,
            sendTransaction
        );

        console.log(`[Exchange] Taker (Signer): ${takerKey.toBase58()}`);
        console.log(`[Exchange] Escrow State PDA: ${escrowPDA.toBase58()}`);
        console.log(`[Exchange] Vault Account PDA: ${vaultAccountPDA.toBase58()}`);

        try {
            // 2. Build the transaction instruction
            const tx = await program!.methods
                .exchange()
                .accounts({
                    taker: takerKey,
                    takerDepositTokenAccount,
                    takerReceiveTokenAccount,
                    initializerReceiveTokenAccount,
                    escrowState: escrowPDA,
                    vaultAccount: vaultAccountPDA,
                    initializerKey, // The original seller's key for constraint check
                    tokenProgram: TOKEN_2022_PROGRAM_ID, // Assuming standard SPL Token Program
                })
                // 3. Send the transaction
                .rpc();

            console.log("Escrow exchange successful! Transaction:", tx);
            return escrowPDA.toBase58();

        } catch (error) {
            console.error("Failed to execute escrow exchange:", error);
            // Rethrow the error to be handled by the UI
            throw new Error(`Exchange failed. Ensure all token accounts are correctly initialized and the constraints are met.`);
        }
    }
    return { initializeEscrow, fetchAllEscrows, cancelEscrow, exchangeEscrow };
}
