"use client"
import React, { useMemo, useState } from 'react'
import Cookies from "js-cookie"
import { EscrowFormModal } from '../../components/ui/EscrowForm';
import Header from '@/app/components/ui/Header';
import Loader from '@/app/components/ui/Loader';

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
              <thead className="text-sm text-body bg-white/5  rounded-base ">
                <tr>
                  <th scope="col" className="px-6 py-3 font-bold  text-lg w-1/5">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold text-lg w-1/5">
                    Balance
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold text-lg w-1/5">
                    Mint Address
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold text-lg w-1/5">
                    Token Address
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold text-lg w-1/5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData?.map((token) => {
                  return (
                    <tr className="border-b border-white/5">
                      <td className="px-6 py-4 ">
                        <div className="flex items-end gap-2">
                          <img
                            src={token.image}
                            className='w-6 rounded-full object-cover'
                          />
                          <p className="text-xl font-semibold text-white ">
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
                        <button className='p-2 bg-violet-900/70 rounded-lg mt-auto flex gap-2 items-center justify-center' onClick={() => { setOpen(true); setMintAddress(token.mint) }} >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                            <path fillRule="evenodd" d="M15.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H7.5a.75.75 0 0 1 0-1.5h11.69l-3.22-3.22a.75.75 0 0 1 0-1.06Zm-7.94 9a.75.75 0 0 1 0 1.06l-3.22 3.22H16.5a.75.75 0 0 1 0 1.5H4.81l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                          </svg>
                          Swap
                        </button>
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