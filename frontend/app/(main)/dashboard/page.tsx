"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { fetchUserTokenAccounts } from '../../utils/token';
import Cookies from "js-cookie"
import { PublicKey } from '@solana/web3.js';
import { EscrowFormModal } from '../../components/ui/EscrowForm';
import { useQuery } from '@tanstack/react-query';
import { useProgram } from '@/app/hooks/useProgram';
// import { subscribeToEscrowEvents } from '@/app/utils/event';

const page = () => {
  const [mintAddress, setMintAddress] = useState<string>("")
  const [isOpen, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("") // New state for search query
  const { program } = useProgram()

  const publicKey = Cookies.get("user")!
  // const {
  // data,
  // isLoading,
  // isFetching,
  // isError,
  // error,
  // refetch,
  // } = useQuery({
  //   queryKey: ['userTokens', publicKey.toString()],
  //   queryFn: () => fetchUserTokenAccounts(new PublicKey(publicKey)),
  //   enabled: !!publicKey.toString(),
  //   staleTime: 1000 * 3000,
  // });
  useEffect(() => {
    if (program) {
      // subscribeToEscrowEvents("InitializeEvent", program)
    }
  }, [program])
  const mockData = [
    {
      "tokenAddress": "CVAVeiQfiiuwfTZqcsRbggsf7kYk3hnvK7GsC8ckibpC",
      "mint": "8XNvy2TzMvLH3iAvkUc4HByJ1PmR4fSPopVRm6fgGNtp",
      "amount": 999999999999999700,
      "uiAmount": 999999999.9999998,
      "decimals": 9,
      "name": "Metaplex",
      "symbol": "MTT",
      "description": "A sample token for demonstration purposes.",
      "image": "https://static.vecteezy.com/system/resources/previews/024/092/856/original/ftx-token-ftt-glass-crypto-coin-3d-illustration-free-png.png"
    },
    {
      "tokenAddress": "EkgWNo6PSAURUyweSshWxarX78hTRe7Ru8RKGNAkwgnU",
      "mint": "qsKv7R4yhPanCgBcgLmH9gBcnWTbw2ANLoMvTZD3JTi",
      "amount": 0,
      "uiAmount": 0,
      "decimals": 9,
      "name": "Only Possible On Solana",
      "symbol": "OPOS",
      "description": "Only Possible On Solana",
      "image": "https://raw.githubusercontent.com/solana-developers/opos-asset/main/assets/DeveloperPortal/image.png"
    }
  ]
  const filteredData = useMemo(() => {
    if (!searchQuery) {
      return mockData;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();

    return mockData.filter(token => {
      // Filter by name, symbol, or mint address
      return (
        token.name.toLowerCase().includes(lowerCaseQuery) ||
        token.symbol.toLowerCase().includes(lowerCaseQuery) ||
        token.mint.toLowerCase().includes(lowerCaseQuery)
      );
    });
  }, [mockData, searchQuery]);
  const isFetching = false;
  const isError = false;
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
            <input type="text" id="simple-search" className="bg-white/5  text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 " placeholder="Search Token" required onChange={(e) => setSearchQuery(e.target.value)} // Update state on change
            />
          </div>
          <button
            // onClick={() => refetch()}
            disabled={isFetching}
            className={` py-2 px-4 flex items-center gap-2 rounded-lg text-white transition-all transform
              ${isFetching
                ? 'bg-white/5  cursor-not-allowed'
                : 'bg-violet-900/70'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`size-6 ${isFetching ? 'animate-spin ' : ''}`}>
              <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <div className='grid grid-cols-4 gap-4'>
        {isFetching ? (
          <div className='flex justify-center col-span-4 p-8 items-center'>
            <svg className="animate-spin h-6 w-6 text-violet-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {/* <p className='ml-4 text-gray-400 text-xl'>Loading active escrows...</p> */}
          </div>
        ) : // 2. Handle Error state if fetching failed
          isError ? (
            <p className='text-center col-span-4 text-red-400 text-2xl '>Error fetching escrows. Please check your connection.</p>
          ) : filteredData?.map((token) => {
            return (
              <div className='bg-white/5 flex p-4 rounded-2xl' key={token.symbol}>
                <div className='flex flex-col gap-4 w-full' >
                  <div className='flex gap-2 items-center'>
                    <img src={token.image} className='w-14 rounded-full' alt="" />
                    <div>
                      <h3 className='text-2xl font-bold line-clamp-1'>{token.name}</h3>
                      <p className='text-gray-300'>{token.mint.slice(0, 25)}...  </p>
                    </div>
                  </div>
                  <div className='h-0.5 bg-gray-600 w-full' ></div>
                  <div>
                    <p className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Balance</p>
                    <p className='line-clamp-1 text-xl font-bold'>{token.amount} Units</p>
                  </div>
                  <button className='p-2 bg-violet-900/70 rounded-lg mt-auto flex gap-2 items-center justify-center' onClick={() => { setOpen(true); setMintAddress(token.mint) }} >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                      <path fillRule="evenodd" d="M15.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H7.5a.75.75 0 0 1 0-1.5h11.69l-3.22-3.22a.75.75 0 0 1 0-1.06Zm-7.94 9a.75.75 0 0 1 0 1.06l-3.22 3.22H16.5a.75.75 0 0 1 0 1.5H4.81l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                    </svg>
                    Swap
                  </button>
                </div>
              </div>
            )
          })
        }
        {filteredData.length === 0 && searchQuery && (
          <div className="lg:col-span-4 p-8 rounded-xl text-center text-gray-400">
            <p className="text-xl font-medium">No tokens found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
      <EscrowFormModal address={publicKey} isOpen={isOpen} onClose={() => setOpen(false)} initializerDepositMint={mintAddress} />
    </div>
  )
}

export default page