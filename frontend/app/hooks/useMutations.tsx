import { useMutation, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie"
import { PublicKey } from "@solana/web3.js";
import { useEscrowActions } from "./useEscrowActions";
import axios from "axios";
import { MutationHookProps } from "../types/props";
import { CancelParams, ExchangeParams, UpdateParams } from "../types/params"
import { Escrow, ExchangeQuery } from "../types/query";
import { EscrowFormState } from "../types/states";


export const useMutations = ({ setPendingId }: MutationHookProps = {}) => {

    const userAddress = Cookies.get("user")!
    const contractActions = useEscrowActions();
    const API_BASE = "http://127.0.0.1:3000"
    const queryClient = useQueryClient();

    const updateEscrow = useMutation({
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
            // const response = await axios.put(
            //     `${API_BASE}/api/escrows/${address}`,
            //     escrow,
            //     {
            //         headers: { "Content-Type": "application/json" },
            //     }
            // )
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

            const initAmount = parseFloat(params.initializerAmount);
            const takerAmount = parseFloat(params.takerExpectedAmount);

            if (isNaN(initAmount) || initAmount <= 0 || isNaN(takerAmount) || takerAmount <= 0) {
                throw new Error("Amounts must be positive numbers.");
            }

            let durationInSeconds = 0;
            const value = parseInt(params.durationValue, 10);
            const unit = params.durationUnit;

            if (isNaN(value) || value <= 0) {
                throw new Error("Duration value must be a positive number.");
            }

            switch (unit) {
                case 'days':
                    durationInSeconds = value * 24 * 60 * 60;
                    break;
                case 'hours':
                    durationInSeconds = value * 60 * 60;
                    break;
                case 'mins':
                    durationInSeconds = value * 60;
                    break;
                case 'sec':
                    durationInSeconds = value;
                    break;
            }

            // Optional: Sanity check for very long durations
            if (durationInSeconds > 60 * 60 * 24 * 365 * 10) { // Limit to 10 years
                throw new Error("Duration is too long. Maximum duration is 10 years.");
            }
            // CRITICAL STEP: CONVERT STRING ADDRESSES TO PUBLIC KEYS
            const depositMintPK = new PublicKey(params.initializerDepositMint!);
            const expectedMintPK = new PublicKey(params.takerExpectedMint);

            // --- 2. Call the Escrow function ---
            return await contractActions.initializeEscrow(
                initAmount,
                takerAmount,
                depositMintPK,
                expectedMintPK,
                durationInSeconds
            );
        },
        onSuccess: ({ account, publicKey }) => {
            console.log("✅ Escrow Initialized Successfully! PDA:", account);
            updateEscrow.mutate({ address: userAddress, escrow: { account: { ...account, expiresAt: account.expiresAt.toString(10) }, status: "Pending", publicKey }, action: 'create' })
            queryClient.invalidateQueries({ queryKey: ['AllEscrows'] });
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
            updateEscrow.mutate({ address: data.initializerKey, escrow: { escrow_pda: data.escrow_pda, status: "Completed" }, action: "update" })
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
            updateEscrow.mutate({ address: userAddress?.toString()!, escrow: { escrow_pda: data, status: "Cancelled" }, action: "update" })
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
        isMutating: updateEscrow.isPending || cancelEscrow.isPending || exchangeEscrow.isPending || createEscrow.isPending
    }
}