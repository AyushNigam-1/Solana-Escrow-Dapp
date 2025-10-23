import * as anchor from '@coral-xyz/anchor';
import {
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { useProgram } from '../../hooks/useProgram';
import { ensureATA, fetchTokenMetadata, generateUniqueSeed, getMintProgramId } from '@/app/utils/token';
import { EnhancedEscrow, EscrowAccount } from '@/app/types';

export const useEscrowActions = () => {
    const { program, PROGRAM_ID, sendTransaction, publicKey, anchorWallet, getEscrowStatePDA } = useProgram()

    async function fetchAllEscrows(
    ): Promise<EnhancedEscrow[]> {
        try {
            console.log("Fetching all EscrowState accounts...");

            if (!program) {
                console.warn("Program not loaded; returning empty escrow list.");
                return [];
            }

            // Fetch raw accounts
            const allEscrowAccounts = await (program.account as any).escrowState.all() as EscrowAccount[];
            console.log(`Found ${allEscrowAccounts.length} escrow accounts. `);
            console.log(allEscrowAccounts);
            const enhancedEscrows: EnhancedEscrow[] = [];

            for (const escrow of allEscrowAccounts) {
                const { account, publicKey } = escrow;

                // Concurrently fetch metadata for both tokens involved in the trade
                const [tokenAMetadata, tokenBMetadata] = await Promise.all([
                    fetchTokenMetadata(account.initializerDepositTokenMint),
                    fetchTokenMetadata(account.takerExpectedTokenMint)
                ]);

                // Format amounts (BN to decimal string) and seed (Buffer to hex)
                const initialAmount = account.initializerAmount.toString(10); // Convert BN to decimal string
                const expectedAmount = account.takerExpectedAmount.toString(10); // Convert BN to decimal string
                const seedBuffer = Buffer.from(account.uniqueSeed).toString('hex');

                // Construct the final enhanced object
                const enhancedEscrow: EnhancedEscrow = {
                    publicKey: publicKey.toBase58(),
                    bump: account.bump,
                    seedHex: seedBuffer,
                    initializerKey: account.initializerKey.toBase58(),
                    initializerReceiveTokenAccount: account.initializerReceiveTokenAccount.toBase58(),

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
    // PDA_SEEDS should be defined to match your Rust program definition (e.g. Buffer.from("escrow"))



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
    async function cancelEscrow(
        uniqueSeed: Buffer,
        initializerDepositTokenAccountKey: PublicKey,
        mintAddress: PublicKey
    ) {
        console.log("Cancel Escrow called with seed:", uniqueSeed.toString('hex'));
        // const escrowStatePDA = getEscrowStatePDA(anchorWallet?.publicKey!, uniqueSeed);
        // const [vaultAccountPDA] = PublicKey.findProgramAddressSync(
        //     [
        //         Buffer.from("vault"),                      // Static seed
        //         escrowStatePDA.toBuffer(),                 // Key of the Escrow State Account
        //     ],
        //     PROGRAM_ID
        // );
        // // 1. Derive the Escrow State PDA address
        // // This must match the seeds defined in the Rust struct: 
        // // seeds = [ESCROW_PDA_SEED, initializer.key.as_ref(), escrow_state.unique_seed.as_ref()]
        // const initializerKey = anchorWallet?.publicKey!;
        // const tokenProgramId = await getMintProgramId(mintAddress);
        // console.log(`Attempting to cancel Escrow at: ${escrowStatePDA.toBase58()}`);
        // console.log(`Vault to close: ${vaultAccountPDA.toBase58()}`);

        // try {
        //     // 2. Build the transaction instruction
        //     const tx = await program!.methods
        //         .cancel()
        //         .accounts({
        //             initializer: initializerKey,
        //             initializerDepositTokenAccount: initializerDepositTokenAccountKey,
        //             vaultAccount: vaultAccountPDA,
        //             escrowState: escrowStatePDA,
        //             tokenProgram: tokenProgramId, // Use the SPL Token Program ID
        //         })
        //         // 3. Send the transaction
        //         .rpc();

        //     console.log("Escrow cancellation successful! ");
        //     return tx;

        // } catch (error) {
        //     console.error("Failed to cancel escrow:", error);
        //     // Rethrow the error to be handled by the caller
        //     throw new Error(`Cancellation failed. Check if accounts are correct and signed.`);
        // }
    }
    return { initializeEscrow, fetchAllEscrows, cancelEscrow };
}
// 6p4btTU4ACWJpqT55t9ccmfFruoPJzb1fy7cBSCtaqvo
// qsKv7R4yhPanCgBcgLmH9gBcnWTbw2ANLoMvTZD3JTi