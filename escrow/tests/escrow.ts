import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
// import { Escrow } from "../target/types/my_escrow_program"; // <-- ADJUST THIS IMPORT PATH
import { Escrow } from "../target/types/escrow";
import * as anchor from "@coral-xyz/anchor"

// Seeds must match the Rust program definition: seeds = [b"global-stats"]
const GLOBAL_STATS_SEED = "global-stats";

describe("GLOBAL_STATS_INITIALIZATION", () => {
  // Use the default provider (from anchor.toml)
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Load the program. Replace Escrow with your program's IDL type name.
  const program = anchor.workspace.Escrow as Program<Escrow>;

  // The 'admin' key is the wallet defined in your Anchor provider/configuration
  const admin = provider.wallet.publicKey;

  // Calculate the PDA before the test runs
  const [globalStatsPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from(GLOBAL_STATS_SEED)],
    program.programId
  );

  console.log(`---`);
  console.log(`Admin Wallet (Payer): ${admin.toBase58()}`);
  console.log(`GlobalStats PDA (Expected): ${globalStatsPDA.toBase58()}`);
  console.log(`---`);

  it("Initializes the GlobalStats account (if not already done)", async () => {
    try {
      console.log("Attempting to initialize GlobalStats...");

      const txSignature = await program.methods
        // Call the instruction defined in your Rust program
        .initializeGlobalStats()
        .accounts({
          admin: admin,
          globalStats: globalStatsPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log(`✅ GlobalStats Initialized!`);
      console.log(`Transaction Signature: ${txSignature}`);

    } catch (error) {
      // Check if the error is due to the account already being initialized (ProgramError)
      if (error instanceof Error && error.message.includes("already in use")) {
        console.log("⚠️ GlobalStats account already initialized. No action taken.");
      } else {
        console.error("❌ Failed to initialize GlobalStats:", error);
        throw error;
      }
    }
  });
});