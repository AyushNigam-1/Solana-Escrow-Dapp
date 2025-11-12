import { useMutation, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie"
import { PublicKey } from "@solana/web3.js";
import { useEscrowActions } from "./useEscrowActions";
import axios from "axios";
import { Dispatch, SetStateAction } from 'react'; // <-- Import these two types
import { Escrow, EscrowData, ExchangeParams } from "../types";
import { toast } from "react-toastify"
interface MutationHookProps {
    setPendingId: Dispatch<SetStateAction<string | null>>;
}

export const useMutations = ({ setPendingId }: MutationHookProps) => {
    const publicKey = Cookies.get("user")!
    const contractActions = useEscrowActions();
    const API_BASE = "http://127.0.0.1:3000"
    const queryClient = useQueryClient();

    const updateEscrow = useMutation({
        mutationFn: async ({
            address,
            updatedEscrow,
        }: {
            address: string;
            updatedEscrow: { escrow_pda: string; status: string };
        }) => {
            const response = await axios.put(
                `${API_BASE}/api/escrows/${address}`,
                updatedEscrow,
                {
                    headers: { "Content-Type": "application/json" },
                }
            );
            return response.data;
        },
        onSuccess: (data) => {
            console.log("✅ Escrow updated successfully:", data);
        },
        onError: (error) => {
            console.error("❌ Failed to update escrow:", error);
        },
    });


    const exchangeEscrow = useMutation({
        // The mutationFn takes the single ExchangeParams object from the mutate() call.
        mutationFn: async (params: ExchangeParams): Promise<{ escrow_pda: string; initializerKey: string; }> => {
            setPendingId(params.uniqueSeed!)
            return await contractActions.exchangeEscrow(
                new PublicKey(params.escrowPDA),
                new PublicKey(params.initializerKey),
                new PublicKey(params.depositTokenMint),
                new PublicKey(params.receiveTokenMint),
            )
        },
        onSuccess: (data: { escrow_pda: string, initializerKey: string }) => {
            setPendingId(null);
            updateEscrow.mutate({ address: data.initializerKey, updatedEscrow: { escrow_pda: data.escrow_pda, status: "Completed" } })
            queryClient.setQueryData<Escrow[]>(['AllEscrows'], (escrows) => {
                return escrows ? escrows.filter(escrow => escrow.publicKey.toBase58() !== data.escrow_pda) : [];
            });
            toast.success("Successfully Exchanged Deal")

        },
        onError: (error) => {
            setPendingId(null);
            console.error("Escrow exchange failed:", error);
            // Optionally, return a user-friendly error message
            throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error during exchange.'}`);
        },
    });


    const cancelEscrow = useMutation({
        mutationFn: async (escrow: EscrowData) => {
            setPendingId(escrow.uniqueSeed.toString())
            return await contractActions.cancelEscrow(
                Buffer.from(escrow.uniqueSeed),
                new PublicKey(escrow.initializerDepositTokenAccount),
                new PublicKey(escrow.tokenAMintAddress),
                new PublicKey(escrow.escrowPda)
            );
        },
        onSuccess: (data) => {
            setPendingId(null);
            console.log(data)
            updateEscrow.mutate({ address: publicKey?.toString()!, updatedEscrow: { escrow_pda: data, status: "Cancelled" } })
            queryClient.setQueryData<Escrow[]>(['AllEscrows'], (escrows) => {
                return escrows ? escrows.filter(escrow => escrow.publicKey.toBase58() !== data) : [];
            });
            toast.success("Successfully Cancelled Deal")
        },
        onError: (error) => {
            setPendingId(null);
            console.error("Escrow cancellation failed:", error);
        },
    });

    return {
        updateEscrow,
        exchangeEscrow,
        cancelEscrow,
        isMutating: updateEscrow.isPending || cancelEscrow.isPending || exchangeEscrow.isPending
    }
}