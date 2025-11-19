import { useMutation, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie"
import { PublicKey } from "@solana/web3.js";
import { useEscrowActions } from "./useEscrowActions";
import axios from "axios";
import { MutationHookProps } from "../types/props";
import { CancelParams, ExchangeParams, UpdateParams } from "../types/params"
import { Escrow, ExchangeQuery } from "../types/query";
import { EscrowFormState } from "../types/states";
import { convertTimeToSeconds } from "../utils/duration";

export const useMutations = ({ setPendingId }: MutationHookProps = {}) => {

    const userAddress = Cookies.get("user")!
    const contractActions = useEscrowActions();
    const API_BASE = "http://127.0.0.1:3000"
    const queryClient = useQueryClient();

    const updateEscrowDb = useMutation({
        mutationFn: async ({
            address,
            escrow,
            action
        }: UpdateParams) => {
            console.log(action)
            const response = action == "update" ? await axios.put(
                `${API_BASE}/api/escrows/${address}`,
                escrow,
                {
                    headers: { "Content-Type": "application/json" },
                }
            ) : await axios.post(`${API_BASE}/api/escrows/${address}`, escrow, {
                headers: { "Content-Type": "application/json" },
            });

            return response.data;
        },
        onSuccess: (data) => {
            console.log("✅ Escrow updated successfully:", data);

        },
        onError: (error) => {
            console.error("❌ Failed to update escrow:", error);
        },
    });

    const createEscrow = useMutation({
        mutationFn: async (params: EscrowFormState) => {
            return await contractActions.initializeEscrow(
                parseFloat(params.initializerAmount),
                parseFloat(params.takerExpectedAmount),
                new PublicKey(params.initializerDepositMint),
                new PublicKey(params.takerExpectedMint),
                convertTimeToSeconds(Number(params.durationValue), params.durationUnit)!
            );
        },
        onSuccess: ({ account, publicKey }) => {
            console.log("✅ Escrow Initialized Successfully! PDA:", account);
            updateEscrowDb.mutate({ address: userAddress, escrow: { account: { ...account, expiresAt: account.expiresAt.toString(10) }, createdAt: new Date().toISOString(), status: "Pending", publicKey }, action: 'create' })
            queryClient.invalidateQueries({ queryKey: ['AllEscrows'] });
            queryClient.invalidateQueries({ queryKey: ['history', userAddress] })
        },

        onError: (error) => {
            console.error("Escrow initialization failed:", error.message);
        },
    });

    const exchangeEscrow = useMutation({
        mutationFn: async (params: ExchangeParams): Promise<ExchangeQuery> => {
            setPendingId!(params.uniqueSeed!)
            return await contractActions.exchangeEscrow(
                new PublicKey(params.escrowPDA),
                new PublicKey(params.initializerKey),
                new PublicKey(params.depositTokenMint),
                new PublicKey(params.receiveTokenMint),
            )
        },
        onSuccess: (data: ExchangeQuery) => {
            setPendingId!(null);
            updateEscrowDb.mutate({ address: data.initializerKey, escrow: { escrow_pda: data.escrow_pda, status: "Completed" }, action: "update" })
            queryClient.setQueryData<Escrow[]>(['AllEscrows'], (escrows) => {
                return escrows ? escrows.filter(escrow => escrow.publicKey.toBase58() !== data.escrow_pda) : [];
            });
        },
        onError: (error) => {
            setPendingId!(null);
            console.error("Escrow exchange failed:", error);
            throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error during exchange.'}`);
        },
    });


    const cancelEscrow = useMutation({
        mutationFn: async (escrow: CancelParams) => {
            setPendingId!(escrow.uniqueSeed.toString())
            return await contractActions.cancelEscrow(
                Buffer.from(escrow.uniqueSeed),
                new PublicKey(escrow.initializerDepositTokenAccount),
                new PublicKey(escrow.tokenAMintAddress),
                new PublicKey(escrow.escrowPda)
            );
        },
        onSuccess: (data) => {
            setPendingId!(null);
            console.log(data)
            updateEscrowDb.mutate({ address: userAddress?.toString()!, escrow: { escrow_pda: data, status: "Cancelled" }, action: "update" })
            queryClient.setQueryData<Escrow[]>(['AllEscrows'], (escrows) => {
                return escrows ? escrows.filter(escrow => escrow.publicKey.toBase58() !== data) : [];
            });
        },
        onError: (error) => {
            setPendingId!(null);
            console.error("Escrow cancellation failed:", error);
        },
    });

    return {
        createEscrow,
        exchangeEscrow,
        cancelEscrow,
        isMutating: updateEscrowDb.isPending || cancelEscrow.isPending || exchangeEscrow.isPending || createEscrow.isPending
    }
}

// https://youtu.be/fMpbS0NbdQo?si=msFlOHd_yuhdtL2G