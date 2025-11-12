"use client"

import React, { useMemo, useState } from 'react'
import { useEscrowActions } from '@/app/hooks/useEscrowActions';
import { useQuery } from '@tanstack/react-query';
import { useProgram } from '@/app/hooks/useProgram';
import numeral from 'numeral';
import { Escrow } from '@/app/types';
import { useMutations } from '@/app/hooks/useMutations';

const page = () => {

    const [pendingId, setPendingId] = useState<string | null>(null);
    const { exchangeEscrow, cancelEscrow, isMutating } = useMutations({ setPendingId })
    const { publicKey } = useProgram()
    const contractActions = useEscrowActions();
    const [searchQuery, setSearchQuery] = useState<string | null>("")

    const {
        data,
        isLoading,
        isFetching,
        isError: isQueryError,
        error,
        refetch,
    } = useQuery<Escrow[]>({
        queryKey: ["AllEscrows"],
        queryFn: () => contractActions.fetchAllEscrows(),
        staleTime: 1000 * 3000,
    });

    const filteredData = useMemo(() => {
        if (!searchQuery) {
            return data;
        }
        const lowerCaseQuery = searchQuery.toLowerCase().trim();
        return data?.filter(escrow => {
            return (
                escrow.tokenA.metadata.name.toLowerCase().includes(lowerCaseQuery) ||
                escrow.tokenA.metadata.symbol.toLowerCase().includes(lowerCaseQuery) ||
                escrow.tokenB.metadata.name.toLowerCase().includes(lowerCaseQuery) ||
                escrow.tokenB.metadata.symbol.toLowerCase().includes(lowerCaseQuery) ||
                escrow.tokenA.metadata.mintAddress.toLowerCase().includes(lowerCaseQuery) ||
                escrow.tokenB.metadata.mintAddress.toLowerCase().includes(lowerCaseQuery) ||
                escrow.account.initializerKey.toLowerCase().includes(lowerCaseQuery)
            );
        });
    }, [data, searchQuery]);

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
                        <input type="text" id="simple-search" className="bg-white/5  text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 " placeholder="Search Token" required onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className={` py-2 px-4 flex items-center gap-2 rounded-lg text-white transition-all transform hover:scale-[1.01] ${isFetching
                            ? 'bg-white/5  cursor-not-allowed'
                            : 'bg-violet-900/70'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`size-6 ${isFetching ? 'animate-spin' : ''}`}>
                            <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className=''>
                {isLoading || isFetching ? (
                    <div className='flex justify-center col-span-4 p-8 items-center'>
                        <svg className="animate-spin h-6 w-6 text-violet-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                ) :
                    isQueryError ? (
                        <p className='text-center col-span-4 text-red-400 text-2xl '>Error fetching escrows. Please check your connection.</p>
                    ) :
                        (filteredData?.length != 0) ?
                            <>
                                <div className="grid grid-cols-12 gap-4">
                                    {filteredData?.map((escrow) =>
                                        <div key={escrow.publicKey.toBase58()} className='flex gap-5 flex-col col-span-3 bg-white/5 p-3 rounded-xl' >
                                            <div className='space-y-2 text-center'>
                                                <p className='text-lg font-semibold'>{escrow.tokenA.metadata.name}</p>
                                                <div className='flex gap-2 items-end bg-gray-50/5 p-2 rounded-xl justify-center' >
                                                    <img src={escrow.tokenA.metadata.image} className='w-10' alt="" />
                                                    <p className="text-4xl font-semibold text-white leading-none ">                               {numeral(escrow.tokenA.amount).format('0a')} </p>
                                                    <p className="text-gray-300">{escrow.tokenA.metadata.symbol}</p>
                                                </div>
                                            </div>

                                            <div className='flex items-center gap-1 justify-center'>
                                                <hr className="border-t border-gray-600 w-full" />
                                                <span className='p-2 rounded-full bg-white/5'>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                                                    </svg>
                                                </span>
                                                <hr className="border-t border-gray-600 w-full" />
                                            </div>
                                            <div className='space-y-2 text-center'>
                                                <p className='font-semibold'>{escrow.tokenB.metadata.name}</p>
                                                <div className='flex gap-2 items-end bg-gray-50/5 p-2 rounded-xl justify-center' >
                                                    <img src={escrow.tokenB.metadata.image} className='w-10' alt="" />
                                                    <p className="text-4xl font-semibold text-white leading-none "> {numeral(escrow.tokenB.amount).format('0a')} </p>
                                                    <p className="text-gray-300">{escrow.tokenB.metadata.symbol}</p>
                                                </div>
                                            </div>
                                            {
                                                publicKey?.toString() == escrow.account.initializerKey.toString() ?
                                                    <button className='bg-red-300/80 p-2 rounded-lg mt-auto flex gap-2 items-center justify-center w-full text-gray-900' onClick={() => cancelEscrow.mutate({ uniqueSeed: escrow.account.uniqueSeed.toString(), initializerDepositTokenAccount: escrow.account.initializerDepositTokenAccount, tokenAMintAddress: escrow.tokenA.metadata.mintAddress, escrowPda: escrow.publicKey })}> {(pendingId == escrow.account.uniqueSeed.toString() && isMutating) ? <svg className="animate-spin -ml-1 mr-3 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg> : <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                    </svg>
                                                        Cancel</>} </button>
                                                    : <>
                                                        <button className='p-2 bg-violet-900/70 rounded-lg mt-auto flex gap-2 items-center justify-center w-full'
                                                            onClick={() => exchangeEscrow.mutate({ uniqueSeed: escrow.account.uniqueSeed.toString(), initializerKey: escrow.account.initializerKey, escrowPDA: escrow.publicKey.toString(), depositTokenMint: escrow.tokenA.metadata.mintAddress, receiveTokenMint: escrow.tokenB.metadata.mintAddress })}
                                                        >
                                                            {(pendingId == escrow.account.uniqueSeed.toString() && isMutating) ? <svg className="animate-spin -ml-1 mr-3 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg> : <>
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                                                    <path fillRule="evenodd" d="M15.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H7.5a.75.75 0 0 1 0-1.5h11.69l-3.22-3.22a.75.75 0 0 1 0-1.06Zm-7.94 9a.75.75 0 0 1 0 1.06l-3.22 3.22H16.5a.75.75 0 0 1 0 1.5H4.81l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                                                                </svg>
                                                                Swap
                                                            </>}
                                                        </button>
                                                    </>
                                            }
                                        </div>
                                    )}
                                </div>
                            </>
                            :
                            !searchQuery && <p className='text-center col-span-4 text-gray-400 text-2xl'>No active escrows found.</p>
                }
                {filteredData?.length === 0 && searchQuery && (
                    <div className="lg:col-span-4 p-8 rounded-xl text-center text-gray-400">
                        <p className="text-xl font-medium">No Deals found matching "{searchQuery}"</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default page