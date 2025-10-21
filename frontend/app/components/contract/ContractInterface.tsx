import * as anchor from '@coral-xyz/anchor';
import {
    Keypair,
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    TransactionMessage,
    VersionedTransaction
} from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    getAccount,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    getMint,
    AccountLayout,
    createInitializeAccountInstruction,
    getAssociatedTokenAddressSync
} from "@solana/spl-token";
import { useProgram } from '../../hooks/useProgram';

export const useEscrowActions = () => {
    const { program, PROGRAM_ID, wallet, PDA_SEEDS, connection, sendTransaction, publicKey } = useProgram()

    const ensureATA = async (mint: PublicKey): Promise<PublicKey> => {
        const owner = publicKey!; // Connected wallet PK

        // NEW: Detect token program ID based on mint owner
        const mintInfo = await connection.getAccountInfo(mint);
        if (!mintInfo) {
            throw new Error(`Mint account does not exist: ${mint.toBase58()}`);
        }
        console.log('Mint Owner:', mintInfo.owner.toBase58());  // Log for debug: Tokenkeg... (legacy) or Tokenz... (2022)

        const tokenProgramId = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID)
            ? TOKEN_2022_PROGRAM_ID
            : TOKEN_PROGRAM_ID;

        console.log('Using Token Program ID:', tokenProgramId.toBase58());

        // Derive ATA with detected tokenProgramId
        const ata = await getAssociatedTokenAddress(
            mint,
            owner,
            false,  // allowOwnerOffCurve (rarely true)
            tokenProgramId, // ← Pass detected ID
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        try {
            await getAccount(connection, ata, undefined, tokenProgramId);  // Pass tokenProgramId to getAccount too
            console.log("✅ ATA already exists:", ata.toBase58());
            return ata;
        } catch (err) {
            console.log("⚠️ ATA not found. Creating new ATA...");

            // Balance check
            const balance = await connection.getBalance(owner);
            console.log('SOL Balance (SOL):', balance / 1e9);
            if (balance < 2_000_000) {
                throw new Error(`Insufficient SOL: ${balance / 1e9} SOL (need ~0.002)`);
            }

            // Optional: Validate mint details
            const mintData = await getMint(connection, mint, 'confirmed', tokenProgramId);
            console.log('Mint Decimals:', mintData.decimals);  // Quick sanity check

            // Fetch latest blockhash
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

            // Create ix with detected tokenProgramId
            const ix = createAssociatedTokenAccountInstruction(
                owner, // payer
                ata,   // associated token account
                owner, // owner
                mint,
                tokenProgramId,                          // ← Key: Detected Token program
                ASSOCIATED_TOKEN_PROGRAM_ID              // Explicit ATA program
            );

            // LOG the programId to verify (should be ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL)
            console.log('ATA Ix Program ID:', ix.programId.toBase58());
            if (ix.programId.toBase58() !== 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL') {
                throw new Error('Invalid Associated Token Program ID!');
            }

            // Compile to VersionedTransaction
            const messageV0 = new TransactionMessage({
                payerKey: owner,
                recentBlockhash: blockhash,
                instructions: [ix],
            }).compileToV0Message();

            const tx = new VersionedTransaction(messageV0);

            // Simulate FIRST to catch errors early
            const sim = await connection.simulateTransaction(tx, { commitment: 'confirmed' });
            console.log('Simulation Result:', sim);
            if (sim.value.err) {
                console.error('Sim Error Details:', sim.value.err);
                throw new Error(`Simulation failed: ${JSON.stringify(sim.value.err)}`);
            }

            try {
                const signature = await sendTransaction(tx, connection, {
                    skipPreflight: false,
                    preflightCommitment: "confirmed",
                    maxRetries: 3,
                });

                await connection.confirmTransaction(
                    { signature, blockhash, lastValidBlockHeight },
                    "confirmed"
                );

                console.log("✅ Created new ATA:", ata.toBase58(), "Sig:", signature);
                return ata;
            } catch (err: any) {
                console.error('Full Send Error:', {
                    message: err.message,
                    code: err.code,
                    name: err.name,
                    stack: err.stack,
                    cause: err.cause,
                    logs: err.logs,
                });
                throw err;
            }
        }
    };


    const generateNonce = (): number => {
        // You may want a more robust nonce generator, but this is fine for a demo
        return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    };

    // PDA_SEEDS should be defined to match your Rust program definition (e.g. Buffer.from("escrow"))
    const getEscrowStatePDA = (initializerKey: PublicKey, nonce: number) => {
        const [escrowStatePDA] = PublicKey.findProgramAddressSync(
            [
                ...PDA_SEEDS,
                initializerKey.toBuffer(),
                Buffer.from(new anchor.BN(nonce).toArray("le", 8)), // nonce as u64 little-endian
            ],
            PROGRAM_ID
        );
        return escrowStatePDA;
    };
    const getMintProgramId = async (mint: PublicKey): Promise<PublicKey> => {
        try {
            // Fetch the mint account data
            const mintAccountInfo = await connection.getAccountInfo(mint);

            if (!mintAccountInfo) {
                console.warn("Mint account not found. Defaulting to standard SPL Token Program ID.");
                return TOKEN_PROGRAM_ID;
            }

            // Check if the mint's owner matches the Token-2022 Program ID
            if (mintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
                console.log(`Mint ${mint.toBase58()} is owned by Token-2022.`);
                return TOKEN_2022_PROGRAM_ID;
            }

            // Default to the standard program ID if not Token-2022
            console.log(`Mint ${mint.toBase58()} is owned by standard SPL Token.`);
            return TOKEN_PROGRAM_ID;

        } catch (e) {
            console.error("Failed to fetch mint account info, defaulting to standard SPL Token Program ID:", e);
            return TOKEN_PROGRAM_ID;
        }
    };
    const initializeEscrow = async (
        initializerAmount: number,
        takerExpectedAmount: number,
        initializerDepositMint: PublicKey,
        takerExpectedMint: PublicKey
    ) => {
        if (!program || !publicKey) {
            throw new Error("Wallet not connected or program not loaded.");
        }

        const initializerKey = publicKey;

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
        const nonce = generateNonce();
        const escrowStatePDA = getEscrowStatePDA(initializerKey, nonce);

        // Ensure ATAs exist
        const initializerDepositTokenAccount = await ensureATA(initializerDepositMint);
        const initializerReceiveTokenAccount = await ensureATA(takerExpectedMint);

        // Convert amounts to Anchor's internal BN (BigNumber) format
        const initializerAmountBN = new anchor.BN(initializerAmount);
        const takerExpectedAmountBN = new anchor.BN(takerExpectedAmount);
        const vaultAccountPDA = getAssociatedTokenAddressSync(
            initializerDepositMint,       // mint
            escrowStatePDA,               // owner (escrow PDA)
            true,                         // allowOwnerOffCurve (MUST be true for PDAs)
            tokenProgramToUse             // token program id (SPL or Token-2022)
        );
        console.log("Initializing Escrow Transaction (using dynamic Token Program ID)...");
        console.log("Initializer:", initializerKey.toBase58());
        console.log("Nonce:", nonce);
        console.log("Initializer Deposit Mint:", initializerDepositMint.toBase58());
        console.log("Taker Expected Mint:", takerExpectedMint.toBase58());
        console.log("Initializer Deposit Token Account:", initializerDepositTokenAccount.toBase58());
        console.log("Initializer Receive Token Account:", initializerReceiveTokenAccount.toBase58());
        console.log("Escrow State PDA:", escrowStatePDA.toBase58());
        console.log("Initializer Amount (BN):", initializerAmountBN.toString());
        console.log("Taker Expected Amount (BN):", takerExpectedAmountBN.toString());
        try {
            console.log("Initializing Escrow Transaction...");
            // ... your existing logs ...

            const ix = await program.methods
                .initialize(
                    initializerAmountBN,
                    takerExpectedAmountBN,
                    new anchor.BN(nonce)
                )
                .accounts({
                    initializer: initializerKey,
                    initializerDepositTokenAccount: initializerDepositTokenAccount,
                    initializerDepositTokenMint: initializerDepositMint,
                    takerExpectedTokenMint: takerExpectedMint,
                    initializerReceiveTokenAccount: initializerReceiveTokenAccount,
                    escrowState: escrowStatePDA,
                    vaultAccount: vaultAccountPDA,  // Derived ATA
                    systemProgram: SystemProgram.programId,
                    tokenProgram: tokenProgramToUse,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .instruction();  // Raw ix (no tx)

            // ← FIXED: Fetch blockhash with lastValidBlockHeight for V0
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

            // ← UPDATED: Compile to VersionedTransaction (V0 style, like ATA example)
            const messageV0 = new TransactionMessage({
                payerKey: initializerKey,  // Explicit fee payer/signer
                recentBlockhash: blockhash,
                instructions: [ix],  // Main ix (no preInstructions in this snippet)
            }).compileToV0Message();

            const tx = new VersionedTransaction(messageV0);

            // ← UPDATED: Simulate FIRST to catch errors early (like ATA example)
            const sim = await connection.simulateTransaction(tx, { commitment: 'confirmed' });
            console.log('Simulation Result:', sim);
            if (sim.value.err) {
                console.error('Sim Error Details:', sim.value.err);
                console.error('Sim Logs:', sim.value.logs?.join('\n') || 'No logs');
                throw new Error(`Simulation failed: ${JSON.stringify(sim.value.err)}`);
            }
            console.log('✅ Simulation passed! Proceeding to send...');

            // ← FIXED: Sign with wallet (ensures initializer signed)
            // const signedTx = await (wallet as any).signTransaction(tx);
            // ← UPDATED: Send with options (like ATA example)
            const txSignature = await sendTransaction(tx, connection, {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
                maxRetries: 3,
            });

            // // ← UPDATED: Confirm with V0 format (signature + blockhash + lastValidBlockHeight)
            await connection.confirmTransaction(
                {
                    signature: txSignature,
                    blockhash,
                    lastValidBlockHeight
                },
                'confirmed'
            );

            console.log("✅ Escrow Initialized! Sig:", txSignature);
            return { tx: txSignature, escrowStatePDA };

        } catch (error: any) {
            console.error("Error initializing escrow:", error);
            if (error.logs) {
                console.error("Program Logs:", error.logs);
            }
            // ← NEW: Signer debug
            // console.error('Signer Debug:', {
            //     initializerKey: initializerKey.toBase58(),
            //     feePayer: tx.feePayer?.toBase58(),
            //     walletPK: publicKey.toBase58(),
            //     connected: wallet.connected,
            // });
            throw new Error("Failed to initialize escrow. Check console for details.");
        }

    };
    return { initializeEscrow, getEscrowStatePDA };
}

// 6p4btTU4ACWJpqT55t9ccmfFruoPJzb1fy7cBSCtaqvo
// qsKv7R4yhPanCgBcgLmH9gBcnWTbw2ANLoMvTZD3JTi