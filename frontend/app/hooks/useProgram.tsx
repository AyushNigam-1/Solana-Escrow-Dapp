import { useWallet, useConnection, type AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import idl from "../target/idl/escrow.json";
import type { Escrow } from "../target/types/escrow";
import { AnchorProvider, setProvider, Program } from "@coral-xyz/anchor";
export const useProgram = () => {
    const { connection } = useConnection();
    const { wallet, publicKey, sendTransaction } = useWallet(); // ✅ useWallet instead of useAnchorWallet()
    const anchorWallet = useAnchorWallet();  // ← NEW: Anchor's wallet wrapper (handles signing)
    const PROGRAM_ID = new PublicKey(idl.address);
    const PDA_SEEDS = [new TextEncoder().encode("escrow")];

    const [escrowAccountKey] = PublicKey.findProgramAddressSync(
        PDA_SEEDS,
        PROGRAM_ID
    );

    const provider = useMemo(() => {
        if (!wallet || !publicKey) return null;
        return new AnchorProvider(connection, anchorWallet as any, {
            commitment: "confirmed",
        });
    }, [connection, wallet, publicKey]);

    setProvider(provider!);
    const program = useMemo(() => {
        if (!provider) return null;
        return new Program(idl as Escrow, provider);
    }, [provider]);
    const getEscrowStatePDA = (initializerKey: PublicKey, uniqueSeed: Buffer) => {

        const [escrowStatePDA] = PublicKey.findProgramAddressSync(
            [
                ...PDA_SEEDS,
                initializerKey.toBuffer(),
                uniqueSeed
            ],
            PROGRAM_ID
        );
        return escrowStatePDA;
    };
    return {
        getEscrowStatePDA,
        program,
        wallet,
        publicKey: anchorWallet?.publicKey,
        connection,
        sendTransaction, // ✅ add this
        escrowAccountKey,
        PDA_SEEDS,
        PROGRAM_ID,
        anchorWallet
    };
};
