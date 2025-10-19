"use client"
import React, { useEffect, useState } from 'react'
import { fetchUserTokenAccounts } from '../utils/token';
import Cookies from "js-cookie"
import { PublicKey } from '@solana/web3.js';
import { UserTokenAccount } from '../types';
import { EscrowFormModal } from '../components/ui/EscrowFormModal';

const page = () => {
  const [tokens, setTokens] = useState<UserTokenAccount[]>()
  const [mintAddress, setMintAddress] = useState<string>("")
  const [tokenAccount, setTokenAccount] = useState<string>("")
  const [isOpen, setOpen] = useState(false)

  const fetchAccounts = async () => {
    try {
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


  return (
    <div className="flex gap-3 p-3">
      {
        tokens?.map((token) => {
          return (
            <div className='bg-gray-100/10 flex p-6 rounded-lg' key={token.symbol}>
              <div className='flex flex-col gap-6' >
                <div className='flex gap-1 items-center'>
                  <img src={token.image} className='w-16  rounded-full ' alt="" />
                  <div>
                    <h3 className='text-2xl font-bold'>{token.name}</h3>
                    <p className='text-gray-300'>{token.amount} Units</p>
                  </div>
                </div>
                <div>
                  <p className='text-xl' >{token.description}</p>
                </div>
                <button className='p-2 bg-purple-300/30 rounded-lg' onClick={() => { setOpen(true); setMintAddress(token.mint); setTokenAccount(token.tokenAddress) }} >Sell</button>
              </div>
            </div>
          )
        })
      }
      <EscrowFormModal isOpen={isOpen} onClose={() => setOpen(false)} initializerDepositTokenAccount={tokenAccount} initializerDepositMint={mintAddress} />
    </div>
  )
}

export default page