"use client"

import React, { useMemo, useState } from 'react'
import { useEscrowActions } from '@/app/hooks/useEscrowActions';
import { useQuery } from '@tanstack/react-query';
import { useProgram } from '@/app/hooks/useProgram';
import numeral from 'numeral';
import { Escrow } from '@/app/types/query';
import { useMutations } from '@/app/hooks/useMutations';
import Header from '@/app/components/ui/Header';
import Loader from '@/app/components/ui/Loader';

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
    const formatExpiry = (bnObject: any): string => {
        if (!bnObject || !bnObject.toString) {
            return 'N/A';
        }

        try {
            // 1. Convert BN object to string
            const timestampString = bnObject.toString();
            if (timestampString === '0') {
                return 'Never'; // Handle zero or no expiry
            }

            // 2. Convert seconds (standard Solana) to milliseconds
            const seconds = BigInt(timestampString);
            const milliseconds = Number(seconds * BigInt(1000));

            // 3. Create Date object and format
            const date = new Date(milliseconds);

            // Use standard date formatting for readability
            const options: Intl.DateTimeFormatOptions = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            };

            return date.toLocaleString(undefined, options);

        } catch (e) {
            console.error("Error formatting expiry date:", e);
            return 'Invalid Date';
        }
    };
    return (
        <div className='flex flex-col gap-4 font-mono' >
            <Header title="Deals" refetch={refetch} isFetching={isFetching} setSearchQuery={setSearchQuery} />
            <div className=''>
                {isLoading || isFetching ? (
                    <Loader />
                ) :
                    isQueryError ? (
                        <p className='text-center col-span-4 text-red-400 text-2xl '>Error fetching escrows. Please check your connection.</p>
                    ) :
                        (filteredData?.length != 0) ?
                            <>
                                <div className="relative overflow-x-auto shadow-xs rounded-lg border border-white/5 ">
                                    <table className="w-full table-fixed text-sm text-left rtl:text-right text-body">
                                        <thead className="text-sm text-body bg-white/5  rounded-base ">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 font-bold  text-lg w-1/5">
                                                    Token A
                                                </th>
                                                <th scope="col" className="px-6 py-3 font-bold text-lg w-1/5">
                                                    Token B
                                                </th>
                                                <th scope="col" className="px-6 py-3 font-bold text-lg w-1/5">
                                                    Creator
                                                </th>
                                                <th scope="col" className="px-6 py-3 font-bold text-lg w-1/5">
                                                    Expired By
                                                </th>
                                                <th scope="col" className="px-6 py-3 font-bold text-lg w-1/5">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData!.map((escrow) => {
                                                return (
                                                    <tr className="border-b border-white/5">
                                                        <td className="px-6 py-4 ">
                                                            <div className="flex items-end gap-2">
                                                                <img
                                                                    src={escrow.tokenA.metadata.image}
                                                                    className='w-6 rounded-full object-cover'
                                                                    alt={`${escrow.tokenA.metadata.symbol} icon`}
                                                                />
                                                                <p className="text-xl font-semibold text-white">
                                                                    {numeral(escrow.tokenA.amount).format('0a')}
                                                                </p>
                                                                <p className="text-xl text-gray-400">
                                                                    {escrow.tokenA.metadata.symbol}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 ">
                                                            <div className="flex items-end gap-2 ">
                                                                <img
                                                                    src={escrow.tokenA.metadata.image}
                                                                    className='w-6 rounded-full object-cover'
                                                                    alt={`${escrow.tokenA.metadata.symbol} icon`}
                                                                />
                                                                <p className="text-xl font-semibold text-white ">
                                                                    {numeral(escrow.tokenA.amount).format('0a')}
                                                                </p>
                                                                <p className="text-xl text-gray-400">
                                                                    {escrow.tokenA.metadata.symbol}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-baseline gap-1">
                                                                <p className="text-xl text-gray-400 leading-none">
                                                                    {escrow.account.initializerKey.toString().slice(0, 10)}...
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-xl text-gray-400">
                                                            {formatExpiry(escrow.account.expiresAt)}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {
                                                                publicKey?.toString() == escrow.account.initializerKey.toString() ?
                                                                    <button className='bg-red-300/80 p-2 rounded-lg mt-auto flex gap-2 items-center justify-center cursor-pointer text-gray-900' onClick={() => cancelEscrow.mutate({ uniqueSeed: escrow.account.uniqueSeed.toString(), initializerDepositTokenAccount: escrow.account.initializerDepositTokenAccount, tokenAMintAddress: escrow.tokenA.metadata.mintAddress, escrowPda: escrow.publicKey })}> {(pendingId == escrow.account.uniqueSeed.toString() && isMutating) ? <svg className="animate-spin -ml-1 mr-3 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg> : <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                                    </svg>
                                                                        Cancel</>} </button>
                                                                    : <>
                                                                        <button className='p-2 bg-violet-900/70 rounded-lg mt-auto flex gap-2 items-center justify-center w-full'
                                                                        // onClick={() => exchangeEscrow.mutate({ uniqueSeed: escrow.account.uniqueSeed.toString(), initializerKey: escrow.account.initializerKey, escrowPDA: escrow.publicKey.toString(), depositTokenMint: escrow.tokenA.metadata.mintAddress, receiveTokenMint: escrow.tokenB.metadata.mintAddress })}
                                                                        >
                                                                            {(pendingId == escrow.account.uniqueSeed.toString() && isMutating) ? <svg className="animate-spin -ml-1 mr-3 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                            </svg> :
                                                                                <>
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                                                                        <path fillRule="evenodd" d="M15.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H7.5a.75.75 0 0 1 0-1.5h11.69l-3.22-3.22a.75.75 0 0 1 0-1.06Zm-7.94 9a.75.75 0 0 1 0 1.06l-3.22 3.22H16.5a.75.75 0 0 1 0 1.5H4.81l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                                                                                    </svg>
                                                                                    Exchange
                                                                                </>}
                                                                        </button>
                                                                        <button className='bg-red-300/80 p-2 rounded-lg mt-auto flex gap-2 items-center justify-center  text-gray-900' > Details </button>
                                                                    </>
                                                            }
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {/* <div className="grid grid-cols-12 gap-4">
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
                                </div> */}
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