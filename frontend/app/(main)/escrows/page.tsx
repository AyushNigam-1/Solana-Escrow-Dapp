"use client"

import React from 'react'
import { useEscrowActions } from '@/app/components/contract/ContractInterface';
import { useQuery } from '@tanstack/react-query';
import { PublicKey } from '@solana/web3.js';
import { useProgram } from '@/app/hooks/useProgram';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import numeral from 'numeral';

const page = () => {
    const { publicKey } = useProgram()
    const contractActions = useEscrowActions();
    const [pendingId, setPendingId] = React.useState<string | null>(null);
    const {
        data,
        isLoading,
        isFetching,
        isError: isQueryError,
        error: queryError,
        refetch,
    } = useQuery({
        queryKey: ["AllEscrows"],
        queryFn: () => contractActions.fetchAllEscrows(),
        staleTime: 1000 * 3000,
    });
    interface ExchangeParams {
        escrowPDA: PublicKey;
        initializerKey: PublicKey;
        takerDepositTokenAccount: PublicKey;
        takerReceiveTokenAccount: PublicKey;
        initializerReceiveTokenAccount: PublicKey;
    }
    interface EscrowData {
        seedHex: string;
        initializerDepositTokenAccount: string;
        publicKey: string;
        tokenAMintAddress: string;
    }
    const queryClient = useQueryClient();
    const { mutate: exchange, isPending: isExchanging, isError, error } = useMutation({
        // The mutationFn takes the single ExchangeParams object from the mutate() call.
        mutationFn: async (params: ExchangeParams) => {
            // Call the core function from contractActions
            const txId = await contractActions.exchangeEscrow(
                params.escrowPDA,
                params.initializerKey,
                params.takerDepositTokenAccount,
                params.takerReceiveTokenAccount,
                params.initializerReceiveTokenAccount
            );

            return { txId, escrowPDA: params.escrowPDA.toBase58() };
        },

        onSuccess: (data) => {
            // Invalidate the main list query to trigger an immediate UI refresh
            queryClient.invalidateQueries({ queryKey: ['allEscrows'] });
            console.log(`Successfully executed exchange for escrow: ${data.escrowPDA}`);
        },

        onError: (error) => {
            console.error("Escrow exchange failed:", error);
            // Optionally, return a user-friendly error message
            throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error during exchange.'}`);
        },
    });
    const { mutate, isPending } = useMutation({
        mutationFn: async (escrow: EscrowData) => {
            setPendingId(escrow.seedHex)
            const seed = Buffer.from(escrow.seedHex, 'hex');
            const initializerDepositAccount = new PublicKey(escrow.initializerDepositTokenAccount);
            const depositMint = new PublicKey(escrow.tokenAMintAddress);
            const escrowPublicKey = new PublicKey(escrow.publicKey);

            const tx = await contractActions.cancelEscrow(
                seed,
                initializerDepositAccount,
                depositMint,
                escrowPublicKey
            );

            return { txId: tx, escrowPublicKey: escrow.publicKey };
        },
        onSuccess: (data) => {
            setPendingId(null);
            queryClient.invalidateQueries({ queryKey: ['allEscrows'] });
            console.log(`Successfully cancelled escrow: ${data.escrowPublicKey}`);
        },
        onError: (error) => {
            setPendingId(null);
            console.error("Escrow cancellation failed:", error);
        },
    });
    return (
        <div className='flex flex-col gap-4 font-mono' >
            <div className='flex justify-between' >
                <h2 className='text-3xl font-bold'>Deals</h2>
                <div className='flex gap-3'>
                    <div className="relative ">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none ">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 text-gray-200">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </div>
                        <input type="text" id="simple-search" className="bg-gray-100/10  text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 " placeholder="Search Token" required />
                    </div>
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className={` py-2 px-4 flex items-center gap-2 rounded-lg text-white transition-all transform hover:scale-[1.01] ${isFetching
                            ? 'bg-gray-500 cursor-not-allowed'
                            : 'bg-violet-900/70'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                            <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd" />
                        </svg>
                        {isFetching ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>
            {isQueryError &&
                <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg shadow-md">
                    <p className="font-bold">Error Loading Tokens</p>
                    <p className="text-sm">{queryError.message || "Failed to fetch token accounts."}</p>
                </div>}

            {
                isLoading || isFetching &&
                <div className="flex items-center justify-center p-8 text-lg rounded-xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                </div>

            }
            <div className='grid grid-cols-4 gap-4'>
                {!isLoading && !isFetching && !queryError && data?.map((escrow: any, index: any) => (
                    <div key={index} className="p-4 rounded-2xl bg-gray-100/10 space-y-4">
                        <div className='flex justify-between items-end' >
                            <div className='flex flex-col gap-2' >
                                <div className='flex gap-1 '>
                                    <img src={escrow.tokenA.metadata.image} className='w-5' alt="" />
                                    <p className='text-gray-400'>{escrow.tokenA.metadata.name}</p>
                                </div>
                                <div className='flex items-end'>
                                    <h2 className='text-4xl ' >
                                        {numeral(escrow.tokenA.amount).format('0a')}
                                    </h2>
                                    <h2 className='text-2xl mx-2 text-gray-300' >
                                        {escrow.tokenA.metadata.symbol}
                                    </h2>
                                </div>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8 rotate-90">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                            </svg>
                            <div className='flex flex-col gap-2' >
                                <div className='flex gap-1'>
                                    {/* <p className='text-gray-400'>{escrow.tokenB.metadata.name.split(" ").slice(0, 2).join(" ")}...</p> */}
                                    <img src={escrow.tokenB.metadata.image} className='w-5' alt="" />
                                    <p className='text-gray-400 '>Solfire</p>
                                </div>
                                <div className='flex items-end'>
                                    <h2 className='text-4xl' >
                                        {numeral(escrow.tokenA.amount).format('0a')}
                                    </h2>
                                    <h2 className='text-2xl mx-2 text-gray-300' >
                                        {escrow.tokenB.metadata.symbol}
                                    </h2>
                                </div>
                            </div>
                        </div>
                        <div className='h-0.5 bg-gray-600 w-full' ></div>
                        <div>
                            <p className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Creator:-</p>
                            <p className='line-clamp-1'>{publicKey == escrow.initializerKey ? `You (${escrow.initializerKey.slice(0, 25) + "...)"}` : escrow.initializerKey.slice(0, 25) + "..."}</p>
                            {/* <p className='line-clamp-1'>{escrow.mint.slice(0, 25)}...</p> */}
                            {/* <p className='text-xl line-clamp-2' >{token.description}</p> */}
                        </div>
                        {
                            publicKey == escrow.initializerKey ?
                                <button className='bg-red-300 p-2 rounded-lg mt-auto flex gap-2 items-center justify-center w-full text-gray-900' onClick={() => mutate({ seedHex: escrow.seedHex, initializerDepositTokenAccount: escrow.initializerDepositTokenAccount, tokenAMintAddress: escrow.tokenA.metadata.mintAddress, publicKey: escrow.publicKey })}> {(pendingId == escrow.seedHex && isPending) ? <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg> : <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                    Cancel</>} </button>
                                : <>
                                    <button className='p-2 bg-violet-900/70 rounded-lg mt-auto flex gap-2 items-center justify-center w-full' onClick={() => { }} >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                            <path fillRule="evenodd" d="M15.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H7.5a.75.75 0 0 1 0-1.5h11.69l-3.22-3.22a.75.75 0 0 1 0-1.06Zm-7.94 9a.75.75 0 0 1 0 1.06l-3.22 3.22H16.5a.75.75 0 0 1 0 1.5H4.81l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                                        </svg>
                                        Swap</button>
                                </>
                        }
                    </div>
                ))
                }
            </div>
        </div>
    )
}

export default page