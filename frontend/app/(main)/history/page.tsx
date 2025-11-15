"use client"
import Header from '@/app/components/ui/Header';
import Loader from '@/app/components/ui/Loader';
import { useEscrowActions } from '@/app/hooks/useEscrowActions';
import { useMutations } from '@/app/hooks/useMutations';
import { useProgram } from '@/app/hooks/useProgram';
import { Escrow } from '@/app/types/query';
import { useQuery } from '@tanstack/react-query';
import numeral from 'numeral';
import React, { useMemo, useState } from 'react'
import { Slide, ToastContainer } from 'react-toastify';

const page = () => {

    const { publicKey } = useProgram()
    const [searchQuery, setSearchQuery] = useState<string | null>("")
    const contractActions = useEscrowActions();
    const [pendingId, setPendingId] = useState<string | null>(null);
    const { cancelEscrow, isMutating } = useMutations({ setPendingId })

    const {
        data: escrows,
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["escrows", publicKey],
        queryFn: () => contractActions.userEscrows(),
        enabled: !!publicKey, // only run when publicKey exists
        retry: 1,
    });

    const filteredData = useMemo(() => {
        if (!searchQuery) {
            console.log("searchQuery", searchQuery)
            console.log("retunring escrows", escrows)
            return escrows;
        }

        const lowerCaseQuery = searchQuery.toLowerCase();

        return escrows!.filter(({ tokenA, tokenB }: { tokenA: any, tokenB: any }) => {
            // Filter by name, symbol, or mint address
            return (
                tokenA.metadata.name.toLowerCase().includes(lowerCaseQuery) ||
                tokenA.metadata.symbol.toLowerCase().includes(lowerCaseQuery) ||
                tokenA.metadata.mint.toLowerCase().includes(lowerCaseQuery) ||
                tokenB.metadata.name.toLowerCase().includes(lowerCaseQuery) ||
                tokenB.metadata.symbol.toLowerCase().includes(lowerCaseQuery) ||
                tokenB.metadata.mint.toLowerCase().includes(lowerCaseQuery)
            );
        });
    }, [escrows, searchQuery]);
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
        <div className='flex flex-col gap-4 font-mono'>
            <Header title="History" refetch={refetch} isFetching={isFetching} setSearchQuery={setSearchQuery} />
            <div className='gap-4'>
                {isLoading || isFetching ? (
                    <Loader />
                ) : // 2. Handle Error state if fetching failed
                    isError ? (
                        <p className='text-center col-span-4 text-red-400 text-2xl '>Error fetching escrows. Please check your connection.</p>
                    ) :
                        // filteredData?.length != 0 ? <div className="grid grid-cols-12 gap-4"> {filteredData?.map((escrow: Escrow) => (
                        //     <div className='flex gap-5 flex-col col-span-3 bg-white/5 p-3 rounded-xl' >
                        //         <div className='space-y-2 text-center'>
                        //             <p className='text-lg font-semibold'>{escrow.tokenA.metadata.name}</p>
                        //             <div className='flex gap-2 items-end bg-gray-50/5 p-2 rounded-xl justify-center' >
                        //                 <img src={escrow.tokenA.metadata.image} className='w-10' alt="" />
                        //                 <p className="text-4xl font-semibold text-white leading-none ">{numeral(escrow.tokenA.amount).format('0a')}  </p>
                        //                 <p className="text-gray-300">{escrow.tokenA.metadata.symbol}</p>
                        //             </div>
                        //         </div>
                        //         <div className='flex items-center gap-1 justify-center'>
                        //             <hr className="border-t border-gray-600 w-full" />
                        //             <span className='p-2 rounded-full bg-white/5'>
                        //                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                        //                     <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                        //                 </svg>
                        //             </span>
                        //             <hr className="border-t border-gray-600 w-full" />
                        //         </div>
                        //         <div className='space-y-2 text-center'>
                        //             <p className='font-semibold'>{escrow.tokenB.metadata.name}</p>
                        //             <div className='flex gap-2 items-end bg-gray-50/5 p-2 rounded-xl justify-center' >
                        //                 <img src={escrow.tokenB.metadata.image} className='w-10' alt="" />
                        //                 <p className="text-4xl font-semibold text-white leading-none ">{numeral(escrow.tokenB.amount).format('0a')}  </p>
                        //                 <p className="text-gray-300">{escrow.tokenB.metadata.symbol}</p>
                        //             </div>
                        //         </div>
                        //         {
                        //             escrow.status == "Pending" ?
                        //                 <button className='bg-red-300/80 p-2 rounded-lg mt-auto flex gap-2 items-center justify-center w-full text-gray-900' onClick={() => cancelEscrow.mutate({ uniqueSeed: escrow.account.uniqueSeed.toString(), initializerDepositTokenAccount: (escrow.account.initializerDepositTokenAccount as string), tokenAMintAddress: escrow.tokenA.metadata.mintAddress, escrowPda: escrow.publicKey })}> {(pendingId == escrow.account.uniqueSeed.toString() && isMutating) ? <svg className="animate-spin -ml-1 mr-3 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        //                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        //                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        //                 </svg> : <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        //                     <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        //                 </svg>
                        //                     Cancel</>} </button>
                        //                 : <>
                        //                     <button className={`p-2 ${escrow.status == "Completed" ? 'bg-violet-900/70 ' : 'bg-red-300/80'} rounded-lg mt-auto flex gap-2 items-center justify-center w-full`} disabled
                        //                     >
                        //                         {escrow.status == "Completed" ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        //                             <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        //                         </svg>
                        //                             :
                        //                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        //                                 <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        //                             </svg>
                        //                         } {escrow.status}
                        //                     </button>
                        //                 </>
                        //         }
                        //     </div>
                        // )
                        // )}
                        // </div>
                        //     :
                        //     !searchQuery && <p className='text-center col-span-4 text-gray-400 text-2xl '>No active escrows found.</p>
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
                                            Expired By
                                        </th>
                                        <th scope="col" className="px-6 py-3 font-bold text-lg w-1/5">
                                            Status
                                        </th>
                                        {/* <th scope="col" className="px-6 py-3 font-bold text-lg w-1/5">
                                            Token Address
                                        </th> */}
                                        <th scope="col" className="px-6 py-3 font-bold text-lg w-1/5">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData?.map((escrow) => {
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
                                                <td className="px-6 py-4 text-xl text-gray-400">
                                                    {formatExpiry(escrow.account.expiresAt)}
                                                </td>
                                                <td className="px-6 py-4 text-xl text-gray-400 leading-none">
                                                    {escrow.status}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {
                                                        escrow.status == "Pending" ?
                                                            <button className='bg-red-300/80 p-2 rounded-lg mt-auto flex gap-2 items-center justify-center w-full text-gray-900' onClick={() => cancelEscrow.mutate({ uniqueSeed: escrow.account.uniqueSeed.toString(), initializerDepositTokenAccount: (escrow.account.initializerDepositTokenAccount as string), tokenAMintAddress: escrow.tokenA.metadata.mintAddress, escrowPda: escrow.publicKey })}> {(pendingId == escrow.account.uniqueSeed.toString() && isMutating) ? <svg className="animate-spin -ml-1 mr-3 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg> : <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                            </svg>
                                                                Cancel</>} </button>
                                                            : <>
                                                                <button className="p-2 bg-violet-900/70 rounded-lg mt-auto flex gap-2 items-center justify-center w-full" disabled
                                                                >
                                                                    {escrow.status == "Completed" ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                                    </svg>
                                                                        :
                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`size-6 ${isFetching ? 'animate-spin' : ''}`}>
                                                                            <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd" />
                                                                        </svg>
                                                                    } Re-Create
                                                                </button>
                                                            </>
                                                    }
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                }
            </div>
            <ToastContainer position="top-center" transition={Slide} theme='dark' />

        </div >
    )
}

export default page