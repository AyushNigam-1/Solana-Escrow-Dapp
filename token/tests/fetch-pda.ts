import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "../target/idl/escrow.json";  assert { type: "json" } // Your IDL

describe("fetch-pda", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = new Program(idl as anchor.Idl, provider);

    it("Fetches Escrow PDA Data", async () => {
        const pdaPubkey = new PublicKey("GoaAyqZ5QCdhFzG38NsYHGyX6icpxKp2531VJNNW5RnP");  // Your PDA

        try {
            const escrowAccount = await program.account.escrowState.fetch(pdaPubkey);
            console.log("Escrow PDA Data:", JSON.stringify(escrowAccount, null, 2));
        } catch (error: any) {
            if (error.message.includes("Account does not exist")) {
                console.log("PDA does not exist or is empty.");
            } else {
                console.error("Fetch Error:", error);
            }
        }
    });
});