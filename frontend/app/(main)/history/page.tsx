"use client"
import { EscrowFormModal } from '@/app/components/ui/EscrowForm';
import Header from '@/app/components/ui/Header';
import Loader from '@/app/components/ui/Loader';
import TableHeaders from '@/app/components/ui/TableHeaders';
import { useEscrowActions } from '@/app/hooks/useEscrowActions';
import { useMutations } from '@/app/hooks/useMutations';
import { useProgram } from '@/app/hooks/useProgram';
import { Escrow } from '@/app/types/query';
import { formatExpiry } from '@/app/utils/token';
import { useQuery } from '@tanstack/react-query';
import numeral from 'numeral';
import React, { useMemo, useState } from 'react'
import { Slide, toast, ToastContainer } from 'react-toastify';

const page = () => {
    const [isOpen, setOpen] = useState(false)
    const { publicKey } = useProgram()
    const [searchQuery, setSearchQuery] = useState<string | null>("")
    const contractActions = useEscrowActions();
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [selectedEscrow, setEscrow] = useState<Escrow | undefined>()
    const { cancelEscrow, isMutating, createEscrow } = useMutations({ setPendingId })

    const {
        data: escrows,
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["escrows", publicKey],
        queryFn: () => contractActions.userEscrows(),
        enabled: !!publicKey,
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            ),
            title: " Expired By"
        },
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>

            ),
            title: "Status"
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
        <div className='flex flex-col gap-4 font-mono'>
            <Header title="History" refetch={refetch} isFetching={isFetching} setSearchQuery={setSearchQuery} />
            <div className='gap-4'>
                {isLoading || isFetching ? (
                    <Loader />
                ) :
                    isError ? (
                        <p className='text-center col-span-4 text-red-400 text-2xl '>Error fetching escrows. Please check your connection.</p>
                    ) :
                        filteredData?.length != 0 ?
                            <div className="relative overflow-x-auto shadow-xs rounded-lg ">
                                <table className="w-full table-fixed text-sm text-left rtl:text-right text-body">
                                    <TableHeaders columns={headers} />
                                    <tbody>
                                        {filteredData?.map((escrow) => {
                                            return (
                                                <tr key={String(escrow.publicKey)} className="border-t-0 border-2  border-white/5">
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
                                                    <td className="px-6 py-4 text-xl text-gray-400">
                                                        {formatExpiry(escrow.account.expiresAt)}
                                                    </td>
                                                    <td className="px-6 py-4 text-xl text-gray-400 leading-none">
                                                        {escrow.status}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className='flex gap-4 items-center' >

                                                            {
                                                                escrow.status == "Pending" ?
                                                                    <button className='hover:text-red-500 text-red-400 items-center rounded-lg flex gap-2 text-lg w-full ' onClick={() => cancelEscrow.mutateAsync({ uniqueSeed: escrow.account.uniqueSeed.toString(), initializerDepositTokenAccount: (escrow.account.initializerDepositTokenAccount as string), tokenAMintAddress: escrow.tokenA.metadata.mintAddress, escrowPda: escrow.publicKey }).then(() => toast.success("Successfully Cancelled Deal"))}> {(pendingId == escrow.account.uniqueSeed.toString() && isMutating) ? <svg className="animate-spin -ml-1 mr-3 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg> : <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                                    </svg>
                                                                        Cancel</>} </button>
                                                                    : <>
                                                                        <button className="hover:text-violet-500 text-violet-400 rounded-lg cursor-pointer flex gap-2 items-center w-full text-lg" onClick={() => { setEscrow(escrow); setOpen(true) }}
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
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div> : !searchQuery && <p className='text-center col-span-4 text-gray-400 text-2xl'>No history available.</p>
                }
                {filteredData?.length === 0 && searchQuery && (
                    <div className="lg:col-span-4 p-8 rounded-xl text-center text-gray-400">
                        <p className="text-xl font-medium">No deals found matching "{searchQuery}"</p>
                    </div>
                )}
            </div>

            <EscrowFormModal isOpen={isOpen} onClose={() => { setOpen(false); refetch() }} data={{ initializerAmount: selectedEscrow?.account.initializerAmount!, takerExpectedAmount: selectedEscrow?.account.takerExpectedAmount!, takerExpectedMint: selectedEscrow?.account.takerExpectedTokenMint!, initializerDepositMint: selectedEscrow?.account.initializerDepositTokenMint!, durationUnit: "days", durationValue: "3" }} />
            <ToastContainer position="top-center" transition={Slide} theme='dark' />
        </div >
    )
}

export default page

