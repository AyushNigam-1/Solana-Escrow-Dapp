import { useWallet, useConnection, type AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { useMemo } from "react";
import idl from "../target/idl/escrow.json";

export const useProgram = () => {
    const { connection } = useConnection();
    const { wallet, publicKey, sendTransaction } = useWallet(); // ✅ useWallet instead of useAnchorWallet()

    const PROGRAM_ID = new PublicKey(idl.address);
    const PDA_SEEDS = [new TextEncoder().encode("escrow")];

    const [escrowAccountKey] = PublicKey.findProgramAddressSync(
        PDA_SEEDS,
        PROGRAM_ID
    );

    const provider = useMemo(() => {
        if (!wallet || !publicKey) return null;
        return new anchor.AnchorProvider(connection, wallet.adapter as any, anchor.AnchorProvider.defaultOptions());
    }, [connection, wallet, publicKey]);

    const program = useMemo(() => {
        if (!provider) return null;
        return new anchor.Program(idl as anchor.Idl, provider);
    }, [provider]);

    return {
        program,
        wallet,
        publicKey,
        connection,
        sendTransaction, // ✅ add this
        escrowAccountKey,
        PDA_SEEDS,
        PROGRAM_ID
    };
};
