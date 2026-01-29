import { Fragment, useState } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { ArrowLeftRight, ArrowRightIcon, CheckIcon, Clock, LinkIcon, Share, Share2, User } from 'lucide-react';
import { Escrow } from '@/app/types/query';
import InputGroup from './InputGroup';
import { truncateAddress } from '@/app/utils/token';
import numeral from 'numeral';
import { useMutations } from '@/app/hooks/useMutations';
import { toast } from 'react-toastify';
// import {
//     XMarkIcon,
//     LinkIcon,
//     CheckIcon,
//     ArrowRightIcon
// } from '@heroicons/react/24/outline'

// Types based on your provided JSON
interface TokenMetadata {
    name: string;
    symbol: string;
    image: string;
}


interface ShareDealModalProps {
    isOpen: boolean;
    closeModal: () => void;
    escrow: Escrow;
}

export default function EscrowDetails({ isOpen, closeModal, escrow }: ShareDealModalProps) {
    const [copied, setCopied] = useState(false);
    const { exchangeEscrow, cancelEscrow, isMutating } = useMutations()

    // 1. Helper to format hex expiry
    const formatExpiry = (hexTime: string) => {
        try {
            // Convert hex to decimal seconds, then to milliseconds
            const seconds = parseInt(hexTime, 16);
            const date = new Date(seconds * 1000);
            return date.toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            return "Unknown";
        }
    };

    // 2. Share Logic
    const handleCopyLink = () => {
        // Generates a link like: https://yourdapp.com/deal/255r...
        const link = `${window.location.origin}/escrows?${escrow.publicKey}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeModal}>

                {/* Backdrop */}
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white/5  p-4 text-left align-middle shadow-xl transition-all space-y-4 font-mono">

                                {/* Header */}
                                <div className=" dark:border-gray-700 flex justify-between items-center ">
                                    <h2 className="text-2xl font-bold text-white ">Escrow</h2>
                                    <button
                                        onClick={() => closeModal()}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                                    // disabled={isMutating}
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                                <hr className="border-t-2 border-white/5" />
                                {/* <InputGroup disabled={true} label='User Address' value={dealData.account.initializerKey} /> */}

                                <div className="flex justify-between items-center rounded-xl gap-4 bg-white/5">

                                    {/* Left Side: Maker Offers */}
                                    <div className=" space-y-3 p-2  w-full rounded-lg ">
                                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider text-center">Token A</p>
                                        <div className="flex gap-2 items-end justify-center">
                                            <img
                                                src={escrow.tokenA.metadata.image}
                                                alt={escrow.tokenA.metadata.symbol}
                                                className="h-8 w-8 rounded-full  object-cover "
                                            />
                                            {/* <div> */}
                                            <p className="text-3xl font-bold text-white">{numeral(escrow.tokenA.amount).format('0a')}</p>
                                            <p className="text-2xl font-medium text-gray-300">{escrow.tokenA.metadata.symbol}</p>
                                            {/* </div> */}
                                        </div>
                                    </div>
                                    <div className=" rounded-full px-3 py-4 z-10">
                                        <ArrowLeftRight className="w-8 text-gray-300" />
                                    </div>
                                    <div className="space-y-3 p-2  w-full rounded-lg ">
                                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider text-center">Token B</p>
                                        <div className="flex gap-2 items-end justify-center">
                                            <img
                                                src={escrow.tokenB.metadata.image}
                                                alt={escrow.tokenB.metadata.symbol}
                                                className="h-8 w-8 rounded-full object-cover "
                                            />
                                            <p className="text-3xl font-bold text-white">{numeral(escrow.tokenB.amount).format('0a')}</p>
                                            <p className="text-2xl font-medium text-gray-300">{escrow.tokenB.metadata.symbol}</p>
                                        </div>
                                        {/* <div>
                                        </div> */}
                                    </div>
                                </div>
                                <div className='flex gap-4' >
                                    <div className='flex flex-col gap-1 bg-white/5 p-3 rounded-xl w-full'>
                                        <h6 className='text-gray-400 text-center items-center justify-center flex gap-1'> <User className='w-4' /> Creator</h6>
                                        <p className='text-lg font-semibold text-center'>{truncateAddress(escrow.account.initializerKey)}</p>
                                    </div>
                                    <div className='flex flex-col gap-1 bg-white/5 p-3 rounded-xl w-full'>
                                        <h6 className='text-gray-400 text-center items-center justify-center flex gap-1'> <Clock className='w-4' /> Validity</h6>
                                        <p className='text-lg font-semibold text-center'>
                                            {formatExpiry(escrow.account.expiresAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className='flex flex-col gap-2 bg-white/5 p-3 rounded-xl w-full'>
                                    <h6 className='text-gray-400 text-center items-center justify-center flex gap-2'> <Share2 className='w-4' /> Shareable Link</h6>
                                    <div className='font-semibold click-pointer hover:text-purple-400' title="Click To Copy">
                                        <p className='text-lg w-full text-center'>
                                            {window.location.origin}/escrows={escrow.publicKey.toString().slice(0, 6)}...
                                        </p>
                                    </div>
                                </div>
                                <hr className="border-t-2 border-white/5" />
                                <button className='text-red-400 bg-red-400/20 rounded-lg  hover:text-red-500 text-lg flex gap-2 p-2 items-center w-full cursor-pointer justify-center' onClick={() => cancelEscrow.mutateAsync({ uniqueSeed: escrow.account.uniqueSeed.toString(), initializerDepositTokenAccount: escrow.account.initializerDepositTokenAccount, tokenAMintAddress: escrow.tokenA.metadata.mintAddress, escrowPda: escrow.publicKey }).then(() => toast.success("Successfully Cancelled Deal"))}>
                                    {/* {(pendingId == escrow.account.uniqueSeed.toString() && isMutating) ? <Loader /> : */}
                                    <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                        Cancel</>
                                    {/* // } */}
                                </button>
                                {/* Footer: Share Actions */}
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition >
    )
}