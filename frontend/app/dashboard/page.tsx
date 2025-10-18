"use client"
import React, { useEffect, useState } from 'react'
import { fetchUserTokenAccounts } from '../utils/token';
import Cookies from "js-cookie"
import { PublicKey } from '@solana/web3.js';
import { UserTokenAccount } from '../types';
import { EscrowFormModal } from '../components/ui/EscrowFormModal';

const page = () => {
  const [tokens, setTokens] = useState<UserTokenAccount[]>()
  const fetchAccounts = async () => {
    try {
      // Note: fetchUserTokenAccounts usually requires the Connection object too.
      const publicKey = new PublicKey(Cookies.get("user")!)
      const tokens = await fetchUserTokenAccounts(publicKey);
      console.log("Fetched Accounts:", tokens);
      setTokens(tokens)
    } catch (error) {
      console.error("Error fetching token accounts:", error);
    }
  };
  useEffect(() => {
    fetchAccounts()
  }, [])
  const [isOpen, setOpen] = useState(false)
  return (
    <div className="flex gap-3 p-3">
      {
        tokens?.map((token) => {
          return (
            <>

              <div className='bg-gray-100/10 flex p-6 rounded-lg' key={token.symbol}>
                {/* <img src="" alt="" /> */}
                <div className='flex flex-col gap-6' >
                  <div className='flex gap-3 items-center'>
                    <img src="https://cdn-icons-png.flaticon.com/512/6001/6001527.png" className='w-16  rounded-full ' alt="" />
                    <div>
                      <h3 className='text-2xl font-bold'>{token.name}</h3>
                      <p className='text-gray-300'>{token.amount} Units</p>
                    </div>
                  </div>
                  <div>
                    <p className='text-xl' >{token.description}</p>
                  </div>
<button className='p-2 bg-purple-300/30 rounded-lg' onClick={() => setOpen(true)} >Sell</button>
                </div>
              </div>
            </>
          )
        })
      }
      <EscrowFormModal isOpen={isOpen} onClose={() => setOpen(false)} />

    </div>
  )
}

export default page