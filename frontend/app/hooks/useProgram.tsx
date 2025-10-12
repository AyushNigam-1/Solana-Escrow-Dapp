import { useMemo, useState } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import type { Escrow } from "../target/types/escrow"
import idl from "../target/idl/escrow.json";

// Replace with your deployed program's address
const PROGRAM_ID = new PublicKey("o64cpAStBpuDDUeoiNuVZM8gJTZraaLbRnTxvXwfgVd");

const PDA_SEEDS = [new TextEncoder().encode("escrow")];


export const useProgram = () => {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();

    const [escrowAccountKey] = PublicKey.findProgramAddressSync(
        PDA_SEEDS,
        PROGRAM_ID
    );

    // 2 & 3. Create the Anchor Provider
    const provider = useMemo(() => {
        if (!wallet) return null;
        return new anchor.AnchorProvider(
            connection,
            wallet,
            anchor.AnchorProvider.defaultOptions(),
        );
    }, [connection, wallet]);

    // 4. Instantiate the Program
    const program = useMemo(() => {
        if (!provider) return null;

        return new anchor.Program<Escrow>(
            idl as anchor.Idl,
            provider,
        );
    }, [provider]);

    return {
        program,
        wallet,
        connection,
        escrowAccountKey,
        PDA_SEEDS,
        PROGRAM_ID
    };

}