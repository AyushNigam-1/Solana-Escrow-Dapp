"use client"

import React, { useEffect, useState } from 'react'
import { fetchUserTokenAccounts } from '../utils/token';
import Cookies from "js-cookie"
import { PublicKey } from '@solana/web3.js';
const page = () => {
    const [tokens , setTokens] = useState()
    const fetchAccounts = async () => {
        try {
          // Note: fetchUserTokenAccounts usually requires the Connection object too.
          const publicKey = new PublicKey(Cookies.get("user")!)
          const accounts = await fetchUserTokenAccounts(publicKey);
          console.log("Fetched Accounts:", accounts);
          setTokens(accounts)
          // console.log("User Public Key:", publicKey.toBase58());
        } catch (error) {
          console.error("Error fetching token accounts:", error);
        }
      };
        useEffect(() => {
        fetchAccounts()
        },[])
  return (
    <div className="flex gap-3">
        {
            tokens?.map((token) => {
return (
 <div className='p-3 bg-purple-300/50 flex' key={token.symbol}>
    {/* <img src="" alt="" /> */}
<div className=''>
<p>{token.name}</p>
</div>
    </div>
)
            })
        }
   
    </div>
  )
}

export default page