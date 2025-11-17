"use client"
import React, { useMemo, useState } from 'react'
import Cookies from "js-cookie"
import { EscrowFormModal } from '../../components/ui/EscrowForm';
import Header from '@/app/components/ui/Header';
import Loader from '@/app/components/ui/Loader';
import TableHeaders from '@/app/components/ui/TableHeaders';

const page = () => {
  const [mintAddress, setMintAddress] = useState<string>("")
  const [isOpen, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("") // New state for search query

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
      return (
        token.name.toLowerCase().includes(lowerCaseQuery) ||
        token.symbol.toLowerCase().includes(lowerCaseQuery) ||
        token.mint.toLowerCase().includes(lowerCaseQuery)
      );
    });
  }, [mockData, searchQuery]);
  const headers = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
      title: "Token "
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
        </svg>

      ),
      title: "Balance"
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>

      ),
      title: "Mint Address"
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>

      ),
      title: "Token Address"
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


  const isFetching = false;
  const isError = false;
  const refetch = () => ""
  return (
    <div className="font-mono flex flex-col gap-4">
      <Header title="Tokens" refetch={refetch} isFetching={isFetching} setSearchQuery={setSearchQuery} />
      <div className='gap-4'>
        {isFetching ? (
          <Loader />
        ) :
          isError ? (
            <p className='text-center col-span-4 text-red-400 text-2xl '>Error fetching tokens. Please check your connection.</p>
          ) : <div className="relative overflow-x-auto shadow-xs rounded-lg border border-white/5 ">
            <table className="w-full table-fixed text-sm text-left rtl:text-right text-body">
              <TableHeaders columns={headers} />

              <tbody>
                {filteredData?.map((token) => {
                  return (
                    <tr className="border-t-0 border-2  border-white/5">
                      <td className="px-6 py-4 ">
                        <div className="flex items-end gap-2">
                          <img
                            src={token.image}
                            className='w-6 rounded-full object-cover'
                          />
                          <p className="text-xl font-semibold text-white line-clamp-1">
                            {token.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xl text-gray-400">
                        {token.amount}
                      </td>
                      <td className="px-6 py-4 text-xl text-gray-400 leading-none">
                        {token.mint.toString().slice(0, 12)}...
                      </td>
                      <td className="px-6 py-4 text-xl text-gray-400 leading-none">
                        {token.tokenAddress.toString().slice(0, 12)}...
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-6 items-center">
                          <button className='text-lg text-violet-400 flex gap-2 items-center justify-center' onClick={() => { setOpen(true); setMintAddress(token.mint) }} >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                              <path fillRule="evenodd" d="M15.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H7.5a.75.75 0 0 1 0-1.5h11.69l-3.22-3.22a.75.75 0 0 1 0-1.06Zm-7.94 9a.75.75 0 0 1 0 1.06l-3.22 3.22H16.5a.75.75 0 0 1 0 1.5H4.81l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                            </svg>
                            Swap
                          </button>
                          <span className='h-5 w-0.5 bg-white/20' ></span>
                          <button className='text-lg text-red-400 flex gap-1 items-center justify-center' onClick={() => { setOpen(true); setMintAddress(token.mint) }} >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        }
        {filteredData.length === 0 && searchQuery && (
          <div className="lg:col-span-4 p-8 rounded-xl text-center text-gray-400">
            <p className="text-xl font-medium">No tokens found matching "{searchQuery}"</p>
          </div>
        )}
      </div>

      <EscrowFormModal isOpen={isOpen} onClose={() => setOpen(false)} initializerDepositMint={mintAddress} />
    </div>
  )
}

export default page