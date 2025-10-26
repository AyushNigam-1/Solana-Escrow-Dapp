"use client"
import React, { useState } from 'react'
import { fetchUserTokenAccounts } from '../../utils/token';
import Cookies from "js-cookie"
import { PublicKey } from '@solana/web3.js';
import { EscrowFormModal } from '../../components/ui/EscrowFormModal';
import { useQuery } from '@tanstack/react-query';

const page = () => {
  const [mintAddress, setMintAddress] = useState<string>("")
  const [isOpen, setOpen] = useState(false)
  const publicKey = new PublicKey(Cookies.get("user")!)

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['userTokens', publicKey.toString()],
    queryFn: () => fetchUserTokenAccounts(publicKey),
    enabled: !!publicKey.toString(),
    staleTime: 1000 * 3000,
  });

  return (
    <div className="font-mono flex flex-col gap-4">
      <div className='flex justify-between' >
        <h2 className='text-3xl font-bold'>Tokens</h2>
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
      <div className='grid grid-cols-4 gap-4'>
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
        {
          !isLoading && !isError && data?.map((token) => {
            return (
              <div className='bg-gray-100/10 flex p-4 rounded-lg ' key={token.symbol}>
                <div className='flex flex-col gap-6' >
                  <div className='flex gap-1 items-center'>
                    <img src={token.image} className='w-16  rounded-full ' alt="" />
                    <div>
                      <h3 className='text-2xl font-bold line-clamp-1'>{token.name}</h3>
                      <p className='text-gray-300'>{token.amount} Units</p>
                    </div>
                  </div>
                  <div>
                    <p className='text-xl line-clamp-2' >{token.description}</p>
                  </div>
                  <button className='p-2 bg-violet-900/70 rounded-lg mt-auto flex gap-2 items-center justify-center' onClick={() => { setOpen(true); setMintAddress(token.mint) }} >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                      <path fillRule="evenodd" d="M15.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H7.5a.75.75 0 0 1 0-1.5h11.69l-3.22-3.22a.75.75 0 0 1 0-1.06Zm-7.94 9a.75.75 0 0 1 0 1.06l-3.22 3.22H16.5a.75.75 0 0 1 0 1.5H4.81l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                    </svg>

                    Swap</button>
                </div>
              </div>
            )
          })
        }
      </div>
      <EscrowFormModal isOpen={isOpen} onClose={() => setOpen(false)} initializerDepositMint={mintAddress} />
    </div>
  )
}

export default page