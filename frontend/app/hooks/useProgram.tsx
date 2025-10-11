import { useMemo, useState } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import type { Escrow } from "../target/types/escrow"
import idl from "../target/idl/escrow.json";

const PROGRAM_ID = new PublicKey("o64cpAStBpuDDUeoiNuVZM8gJTZraaLbRnTxvXwfgVd");

const PDA_SEEDS = [new TextEncoder().encode("counter")];

export const useProgram = () => {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();

    const provider = useMemo(() => {
        if (!wallet) return null;
        return new anchor.AnchorProvider(
            connection,
            wallet,
            anchor.AnchorProvider.defaultOptions(),
        );
    }, [connection, wallet]);

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
        PDA_SEEDS,
        PROGRAM_ID
    };

}