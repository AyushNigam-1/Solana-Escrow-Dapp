import * as anchor from '@coral-xyz/anchor';
import {
    PublicKey, Transaction
} from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    getAccount,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID
} from "@solana/spl-token";
import { useProgram } from '../../hooks/useProgram';

export const useEscrowActions = () => {
    const { program, wallet, PROGRAM_ID, PDA_SEEDS, connection, sendTransaction, publicKey } = useProgram();

    // import {
    //     getAssociatedTokenAddress,
    //     createAssociatedTokenAccountInstruction,
    //     getAccount,
    //     TOKEN_PROGRAM_ID
    // } from "@solana/spl-token";
    // import { Transaction, PublicKey } from "@solana/web3.js";

    const ensureATA = async (mint: PublicKey) => {
        if (!publicKey) throw new Error("Wallet not connected");

        const ata = await getAssociatedTokenAddress(
            mint,
            publicKey,
            false,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        try {
            await getAccount(connection, ata);
            console.log("✅ ATA exists:", ata.toBase58());
            return ata;
        } catch (error) {
            console.log("⚠️ ATA not found, creating...");

            const ix = createAssociatedTokenAccountInstruction(
                publicKey, // payer (your wallet)
                ata,       // associated token account address
                publicKey, // owner (who will own the ATA)
                mint,      // mint address
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            );

            const tx = new Transaction().add(ix);
            tx.feePayer = publicKey;
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

            console.log("Simulating...");
            const sim = await connection.simulateTransaction(tx);
            console.log("Simulation:", sim.value);

            const signature = await sendTransaction(tx, connection); // no extra object
            await connection.confirmTransaction(signature, "confirmed");

            console.log("✅ Created ATA:", ata.toBase58());
            return ata;
        }
    };



    const getEscrowStatePDA = (initializerKey: PublicKey) => {
        const [escrowStatePDA] = PublicKey.findProgramAddressSync(
            [...PDA_SEEDS, initializerKey.toBuffer()],
            PROGRAM_ID
        );
        return escrowStatePDA;
    };

    const initializeEscrow = async (
        initializerAmount: number,
        takerExpectedAmount: number,
        initializerDepositMint: PublicKey,
        takerExpectedMint: PublicKey
    ) => {
        if (!program || !wallet) {
            throw new Error("Wallet not connected or program not loaded.");
        }

        const initializerKey = publicKey!;
        // 1. Calculate the Escrow State PDA address
        const escrowStatePDA = getEscrowStatePDA(initializerKey);
        const initializerDepositTokenAccount = await ensureATA(initializerDepositMint);
        const initializerReceiveTokenAccount = await ensureATA(takerExpectedMint);
        const vaultAccount = anchor.web3.Keypair.generate();

        // Convert amounts to Anchor's internal BN (BigNumber) format
        const initializerAmountBN = new anchor.BN(initializerAmount);
        const takerExpectedAmountBN = new anchor.BN(takerExpectedAmount);

        try {
            console.log("Initializing Escrow Transaction...");
            console.log("Escrow State PDA:", escrowStatePDA.toBase58());
            console.log("New Vault Token Account (Keypair):", vaultAccount.publicKey.toBase58());

            const tx = await program.methods
                .initialize(
                    initializerAmountBN,
                    takerExpectedAmountBN
                )
                .accounts({
                    // Rust struct: Initialize<'info>
                    initializer: initializerKey,
                    initializerDepositTokenAccount: initializerDepositTokenAccount,
                    initializerDepositTokenMint: initializerDepositMint,
                    takerExpectedTokenMint: takerExpectedMint,
                    initializerReceiveTokenAccount: initializerReceiveTokenAccount,
                    escrowState: escrowStatePDA,
                    vaultAccount: vaultAccount.publicKey, // The new vault account
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID, // Use Anchor's built-in ID for the token program
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY, // SYSVAR_RENT_PUBKEY is required if Rent is passed
                })
                .signers([vaultAccount]) // Signers: Wallet + the newly created vault keypair (since it's `init`)
                .rpc();

            return { tx, escrowStatePDA };

        } catch (error) {
            console.error("Error initializing escrow:", error);
            throw new Error("Failed to initialize escrow. Check console for details.");
        }
    };

    return { initializeEscrow, getEscrowStatePDA };
};
