"use client"

import React from 'react'
import { useEscrowActions } from '@/app/components/contract/ContractInterface';
import { useQuery } from '@tanstack/react-query';
import { PublicKey } from '@solana/web3.js';

const page = () => {

    const contractActions = useEscrowActions();
    const {
        data,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: [""],
        queryFn: () => contractActions.fetchAllEscrows(),
        staleTime: 1000 * 3000,
    });

    return (
        <div className='' >
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
            {isError &&
                <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg shadow-md">
                    <p className="font-bold">Error Loading Tokens</p>
                    <p className="text-sm">{error.message || "Failed to fetch token accounts."}</p>
                </div>}

            {
                isLoading &&
                <div className="flex items-center justify-center p-8 text-lg text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow-inner">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                    Loading token balances...
                </div>

            }
            {isLoading && !isError && data?.map((escrow: any, index: any) => (
                <div key={index} className="p-4 mb-4 border border-gray-600 rounded-2xl bg-gray-800 ">
                    <div className='flex justify-between' >
                        <div className='flex flex-col gap-2' >
                            <div className='flex gap-1'>
                                <img src={escrow.tokenA.metadata.image} className='w-6' alt="" />
                                <p>{escrow.tokenA.metadata.name}</p>
                            </div>
                            <div className='flex items-end'>
                                <h2 className='text-5xl font-bold' >
                                    {escrow.tokenA.amount}
                                </h2>
                                <h2 className='text-2xl mx-2' >
                                    {escrow.tokenA.metadata.symbol}
                                </h2>
                            </div>
                        </div>
                        <div className='flex flex-col gap-2' >
                            <div className='flex gap-1'>
                                <img src={escrow.tokenB.metadata.image} className='w-6' alt="" />
                                <p>{escrow.tokenB.metadata.name}</p>
                            </div>
                            <div className='flex items-end'>
                                <h2 className='text-5xl font-bold' >
                                    {escrow.tokenB.amount}
                                </h2>
                                <h2 className='text-2xl mx-2' >
                                    {escrow.tokenB.metadata.symbol}
                                </h2>
                            </div>
                        </div>
                    </div>
                    <button className='bg-purple-300 p-2' onClick={() => contractActions.cancelEscrow(Buffer.from(escrow.seedHex, 'hex'), new PublicKey(escrow.initializerDepositTokenAccount), new PublicKey(escrow.tokenA.metadata.mintAddress), new PublicKey(escrow.publicKey))}>Cancel</button>

                </div>
            ))
            }
        </div>
    )
}

export default page