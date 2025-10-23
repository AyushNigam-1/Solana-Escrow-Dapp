import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";  // Token-2022 program ID
import idl from "../target/idl/escrow.json" with { type: "json" };

describe("close-escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new Program(idl as anchor.Idl, provider);

  it("Calls Cancel to Close PDA", async () => {
    const initializerPubkey = new PublicKey("9apdsHH9APVQ2EqDkPy8BH8LtJ2VtSZngYUzk4jTpbKM");  // Your initializer wallet (owner)
    const escrowPDA = new PublicKey("CgrMJZ1WFoFbQXdn7ccS4n7SexpfDDnq788ZkT4r6aqr");  // Escrow state PDA (from logs)

    // Your deposit ATA (from screenshot)
    const depositATA = new PublicKey("8dxpgH3of3MUh5JfFMSb8fRTZkiphgpuwTZARAq7Tu9o");

    // Derive vault ATA (escrow PDA as owner, deposit mint as mint, Token-2022 program)
    const depositMint = new PublicKey("6p4btTU4ACWJpqT55t9ccmfFruoPJzb1fy7cBSCtaqvo");  // Mint from screenshot
    // const vaultATA = await getAssociatedTokenAddress(
    //   depositMint,  // Mint
    //   escrowPDA,    // Owner (escrow PDA)
    //   false,        // allowOffCurve
    //   TOKEN_2022_PROGRAM_ID  // Token-2022
    // );
    const vaultATA = new PublicKey("8dxpgH3of3MUh5JfFMSb8fRTZkiphgpuwTZARAq7Tu9o");  // From screenshot
    console.log("Derived Vault ATA:", vaultATA.toBase58());  // Log for verification
    const escrowState = await program.account.escrowState.fetch(escrowPDA);
    console.log("Escrow State Found (Initialized):", JSON.stringify(escrowState, null, 2));
    // const tx = await program.methods
    //   .cancel()  // Your cancel method
    //   .accounts({
    //     initializer: initializerPubkey,
    //     initializerDepositTokenAccount: depositATA,  // Deposit ATA from screenshot
    //     vaultAccount: vaultATA,  // Derived vault ATA
    //     escrowState: escrowPDA,
    //     tokenProgram: TOKEN_2022_PROGRAM_ID,  // Token-2022
    //   })
    //   .rpc({ commitment: "confirmed" });

    // console.log("Cancel Tx Sig:", tx);
    // console.log("PDA Closed – Rent refunded. Check Explorer.");
  });
});