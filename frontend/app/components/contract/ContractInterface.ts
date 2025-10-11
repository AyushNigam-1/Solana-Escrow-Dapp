// import * as anchor from '@coral-xyz/anchor';
// import { PublicKey, Keypair, Connection } from '@solana/web3.js';
// import { useProgram } from '../../hooks/useProgram'; // Renamed import for clarity, assuming this is the context hook

// // Define the PDA seed constant used in your Rust program

// export const useEscrowActions = () => {
//     // Assuming useEscrowProgram (the context hook) returns your Escrow Program instance
//     const { program, wallet, connection, PROGRAM_ID , PDA_SEEDS } = useProgram(); 

//     const getEscrowStatePDA = (initializerKey: PublicKey) => {
//         // const [escrowStatePDA] = PublicKey.findProgramAddressSync(
//         //     [PDA_SEEDS, initializerKey.toBuffer()],
//         //     PROGRAM_ID
//         // );
//         // return escrowStatePDA;
//     };

//     /**
//      * Initiates a new Escrow trade.
//      * @param initializerAmount - Amount of Token A to deposit (u64).
//      * @param takerExpectedAmount - Amount of Token B expected in return (u64).
//      * @param initializerDepositTokenAccount - Account holding Token A (e.g., Seller's ATA for Token A).
//      * @param initializerReceiveTokenAccount - Account where Token B will be received (e.g., Seller's ATA for Token B).
//      * @param initializerDepositMint - Mint of Token A (e.g., Token A Mint address).
//      * @param takerExpectedMint - Mint of Token B (e.g., Token B Mint address).
//      */
//     const initializeEscrow = async (
//         initializerAmount: number,
//         takerExpectedAmount: number,
//         initializerDepositTokenAccount: PublicKey,
//         initializerReceiveTokenAccount: PublicKey,
//         initializerDepositMint: PublicKey,
//         takerExpectedMint: PublicKey
//     ) => {
//         if (!program || !wallet) {
//             throw new Error("Wallet not connected or program not loaded.");
//         }

//         const initializerKey = wallet.publicKey;
//         // 1. Calculate the Escrow State PDA address
//         const escrowStatePDA = getEscrowStatePDA(initializerKey);

//         // 2. We need a Keypair for the Vault Account itself (not its authority)
//         // Note: Your Rust code uses `init` on both escrow_state AND vault_account,
//         // so we need to generate keys for both if they don't exist, though Anchor typically handles the vault authority PDA derivation internally.
//         // Since `vault_account` is just initialized as a TokenAccount, we'll create a new one.
        
//         // **IMPORTANT:** Since the Vault Account is derived *from* the escrow state in your Anchor `Exchange` and `Cancel` contexts (`#[account(mut, token::authority = escrow_state)]`), 
//         // we'll let Anchor's `methods.initialize().accounts({...})` handle the vault creation and derivation for us, simplifying the client.
//         // However, since `vault_account` is marked `init`, we need a dedicated new Keypair for it. Let's generate it.
//         const vaultAccount = anchor.web3.Keypair.generate();
        
//         // Convert amounts to Anchor's internal BN (BigNumber) format
//         const initializerAmountBN = new anchor.BN(initializerAmount);
//         const takerExpectedAmountBN = new anchor.BN(takerExpectedAmount);

//         try {
//             console.log("Initializing Escrow Transaction...");
//             console.log("Escrow State PDA:", escrowStatePDA.toBase58());
//             console.log("New Vault Token Account (Keypair):", vaultAccount.publicKey.toBase58());

//             const tx = await program.methods
//                 .initialize(
//                     initializerAmountBN,
//                     takerExpectedAmountBN
//                 )
//                 .accounts({
//                     // Rust struct: Initialize<'info>
//                     initializer: initializerKey,
//                     initializerDepositTokenAccount: initializerDepositTokenAccount,
//                     initializerDepositTokenMint: initializerDepositMint,
//                     takerExpectedTokenMint: takerExpectedMint,
//                     initializerReceiveTokenAccount: initializerReceiveTokenAccount,
//                     escrowState: escrowStatePDA,
//                     vaultAccount: vaultAccount.publicKey, // The new vault account
//                     systemProgram: anchor.web3.SystemProgram.programId,
//                     tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID, // Use Anchor's built-in ID for the token program
//                     rent: anchor.web3.SYSVAR_RENT_PUBKEY, // SYSVAR_RENT_PUBKEY is required if Rent is passed
//                 })
//                 .signers([vaultAccount]) // Signers: Wallet + the newly created vault keypair (since it's `init`)
//                 .rpc();

//             return { tx, escrowStatePDA };

//         } catch (error) {
//             console.error("Error initializing escrow:", error);
//             throw new Error("Failed to initialize escrow. Check console for details.");
//         }
//     };

//     return { initializeEscrow, getEscrowStatePDA };
// };
