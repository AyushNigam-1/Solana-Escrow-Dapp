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
import TableHeaders from '@/app/components/ui/TableHeaders';
import { formatExpiry } from '@/app/utils/token';
import { Slide, toast, ToastContainer } from 'react-toastify';

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




    const headers = [
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            ),
            title: "Token A"
        },
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            ),
            title: "Token B"
        },
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
            ),
            title: "Creator"
        },
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            ),
            title: " Expiring In"
        },
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
                </svg>
            ),
            title: "Action"
        }
    ]


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
                                <div className="relative overflow-x-auto shadow-xs rounded-lg ">
                                    <table className="w-full table-fixed text-sm text-left rtl:text-right text-body">
                                        <TableHeaders columns={headers} />
                                        <tbody>
                                            {filteredData!.map((escrow) => {
                                                return (
                                                    <tr key={escrow.publicKey.toBase58()} className="border-t-0 border-2  border-white/5">
                                                        <td className="px-6 py-2">
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
                                                        <td className="px-6 py-2">
                                                            <div className="flex items-end gap-2 ">
                                                                <img
                                                                    src={escrow.tokenB.metadata.image}
                                                                    className='w-6 rounded-full object-cover'
                                                                    alt={`${escrow.tokenB.metadata.symbol} icon`}
                                                                />
                                                                <p className="text-xl font-semibold text-white ">
                                                                    {numeral(escrow.tokenB.amount).format('0a')}
                                                                </p>
                                                                <p className="text-xl text-gray-400">
                                                                    {escrow.tokenB.metadata.symbol}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-2">
                                                            <div className="flex items-baseline gap-2">
                                                                <p className="text-xl text-gray-400 leading-none">
                                                                    {escrow.account.initializerKey.toString().slice(0, 10)}...
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-2 text-xl text-gray-400">
                                                            {formatExpiry(escrow.account.expiresAt)}
                                                        </td>
                                                        <td className="px-6 py-2">
                                                            <div className='flex gap-4 items-center' >

                                                                {
                                                                    publicKey?.toString() == escrow.account.initializerKey.toString() ?
                                                                        <button className='text-red-400 hover:text-red-500 text-lg flex gap-2 p-2 items-center w-full cursor-pointer' onClick={() => cancelEscrow.mutateAsync({ uniqueSeed: escrow.account.uniqueSeed.toString(), initializerDepositTokenAccount: escrow.account.initializerDepositTokenAccount, tokenAMintAddress: escrow.tokenA.metadata.mintAddress, escrowPda: escrow.publicKey }).then(() => toast.success("Successfully Cancelled Deal"))}> {(pendingId == escrow.account.uniqueSeed.toString() && isMutating) ? <svg className="animate-spin -ml-1 mr-3 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg> : <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                                        </svg>
                                                                            Cancel</>} </button>
                                                                        : <>
                                                                            <button className='text-violet-400 text-lg hover:text-violet-500 flex gap-2 p-2 items-center w-full cursor-pointer'
                                                                                onClick={() => exchangeEscrow.mutateAsync({ uniqueSeed: escrow.account.uniqueSeed.toString(), initializerKey: escrow.account.initializerKey, escrowPDA: escrow.publicKey.toString(), depositTokenMint: escrow.tokenA.metadata.mintAddress, receiveTokenMint: escrow.tokenB.metadata.mintAddress }).then(() => toast.success("Successfully Exchanged Tokens"))}
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

                                                                        </>
                                                                }
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                            :
                            !searchQuery && <p className='text-center col-span-4 text-gray-400 text-2xl'>No active deals found.</p>
                }
                {filteredData?.length === 0 && searchQuery && (
                    <div className="lg:col-span-4 p-8 rounded-xl text-center text-gray-400">
                        <p className="text-xl font-medium">No Deals found matching "{searchQuery}"</p>
                    </div>
                )}
            </div>
            <ToastContainer position="top-center" transition={Slide} theme='dark' />
        </div>
    )
}

export default page