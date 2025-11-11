import { EscrowState, Escrow } from '@/app/types';
import React from 'react'

const DealListItem = ({ deal, currentAccount }: { deal: Escrow, currentAccount: string }) => {
    // const { color, bg } = getStatusStyles(deal.status);

    const creatorDisplay = currentAccount?.toString() == deal.account.initializerKey.toString() ? 'You (Creator)' : `${deal.account.initializerKey.toString().substring(0, 15)}...`;
    // const counterpartyDisplay = deal.counterpartyKey === 'You' ? 'You (Taker)' : deal.counterpartyKey;

    // Function to truncate long keys
    // const truncateKey = (key) => {
    //     if (key.length > 10) {
    //         return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    //     }
    //     return key;
    // };
    return (
        <div className="grid grid-cols-10 lg:grid-cols-12 gap-4 items-center py-4 border-b border-gray-700 bg-white/5 hover:bg-gray-700 transition duration-150 rounded-lg lg:rounded-none lg:border-l-4 lg:border-r-4 lg:border-t-2 lg:border-b-2 lg:border-transparent  mb-2 lg:mb-0">

            {/* 1. Status (Mobile: 1/6, Desktop: 1/10) */}
            {/* <div className={`col-span-1 lg:col-span-1 text-xs font-semibold px-2 py-1 rounded-full text-center ${color} ${bg}`}>
                {deal.status}
            </div> */}

            {/* 2 & 3. Gives (Mobile: 2/6, Desktop: 2/10 & 3/10) */}
            <div className="col-span-2 lg:col-span-2 flex gap-2 items-end justify-center ">
                <img src={deal.tokenA.metadata.image} className='w-8' alt="" />

                <p className="text-3xl font-semibold text-white leading-none">{deal.tokenA.amount.toString()} </p>
                <p className="text-gray-300">{deal.tokenA.metadata.symbol}</p>
            </div>

            {/* 4. Swap Icon (Mobile: 1/6, Desktop: 1/10) */}
            <div className="col-span-1 lg:col-span-1 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                    <path fillRule="evenodd" d="M15.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H7.5a.75.75 0 0 1 0-1.5h11.69l-3.22-3.22a.75.75 0 0 1 0-1.06Zm-7.94 9a.75.75 0 0 1 0 1.06l-3.22 3.22H16.5a.75.75 0 0 1 0 1.5H4.81l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                </svg>
            </div>

            {/* 5 & 6. Gets (Mobile: 2/6, Desktop: 2/10 & 3/10) */}
            <div className="col-span-2 lg:col-span-2 flex gap-2 items-end justify-center">
                <img src={deal.tokenB.metadata.image} className='w-8' alt="" />
                <p className="text-3xl font-semibold text-gray-300  leading-none">{deal.tokenB.amount.toString()} </p>
                <p className="text-gray-300">{deal.tokenB.metadata.symbol}</p>
            </div>

            {/* Separator for better mobile layout */}
            <div className="lg:hidden col-span-full border-t border-gray-700/50 my-2"></div>

            {/* 7. Creator (Desktop Only) */}
            <div className="hidden lg:block lg:col-span-3 text-2xl font-bold text-gray-300  text-center">
                <span className={currentAccount?.toString() == deal.account.initializerKey.toString() ? 'text-violet-400' : 'text-gray-300'}>
                    {creatorDisplay}
                </span>
            </div>

            {/* 8. Expires (Desktop Only) */}
            <div className="hidden lg:block lg:col-span-2  text-xl font-bold text-center">
                {/* {deal.status === 'Active' ? ( */}
                <span className="text-orange-400">{deal.account.expiresAt.toString()}</span>
                {/* ) : ( */}
                {/* <span className="text-gray-500">{deal.expiresIn}</span> */}
                {/* )} */}
            </div>

            {/* 9. Action Button (Mobile: Full Width on Second Row, Desktop: 1/10) */}
            <div className="col-span-full lg:col-span-2 flex justify-center">
                {/* {(deal.status === 'Active' || deal.status === 'Executed') ? ( */}
                <button
                    className={`w-full lg:w-auto px-4 py-2 text-xs font-bold rounded-lg text-white transition duration-200 bg-violet-900/70 hover:bg-violet-700/90 shadow-md hover:shadow-lg`}
                >
                    Swap
                    {/* {deal.actionText} */}
                </button>
                {/* ) : ( */}
                {/* <button
                        className={`w-full lg:w-auto px-4 py-2 text-xs font-bold rounded-lg text-white transition duration-200 bg-gray-600 cursor-not-allowed`}
                        disabled
                    >
                        {deal.actionText}
                    </button>
                )} */}
            </div>
        </div>
    )
}

export default DealListItem