"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { useEscrowActions } from '../components/contract/ContractInterface';
import { EnhancedEscrow } from '../types';
import { useProgram } from '../hooks/useProgram';
import { PublicKey } from '@solana/web3.js';
const page = () => {

    const contractActions = useEscrowActions();
    const [escrows, setEscrows] = React.useState<EnhancedEscrow[]>([]);
    const { program } = useProgram()
    const [loading, setLoading] = useState(true);

    // --- KEY CHANGE: Memoize fetchEscrows using useCallback ---
    const fetchEscrows = useCallback(async () => {
        if (contractActions) {
            setLoading(true);
            try {
                const fetchedEscrows = await contractActions.fetchAllEscrows();
                setEscrows(fetchedEscrows);
                console.log("Fetched Escrows successfully.");
            } catch (error) {
                console.error("Error fetching escrows:", error);
            } finally {
                setLoading(false);
            }
        }
    }, [program]); // DEPENDENCY ARRAY: ONLY recreate fetchEscrows if contractActions changes.

    // --- USE EFFECT: Call the memoized function ---
    useEffect(() => {
        // Because fetchEscrows is memoized, this function call will not 
        // trigger an infinite loop. It will only run on component mount 
        // and if contractActions changes.
        fetchEscrows();
    }, [fetchEscrows]);

    return (
        <div className='flex flex-wrap justify-around' >
            {loading ? (
                <div className="flex items-center space-x-2 text-blue-600 font-semibold">
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading Escrow Trades...</span>
                </div>
            ) :
                escrows.map((escrow, index) => (
                    <div key={index} className="p-4 mb-4 border border-gray-600 rounded-2xl bg-gray-800 ">
                        <div className='flex justify-between' >
                            <div className='flex flex-col gap-2' >
                                <div className='flex gap-1'>
                                    <img src={escrow.tokenA.metadata.image} className='w-6' alt="" />
                                    <p>{escrow.tokenA.metadata.name}</p>
                                </div>
                                <div className='flex items-end'>
                                    <h2 className='text-5xl font-bold' >
                                        {escrow.tokenA.amount}
                                    </h2>
                                    <h2 className='text-2xl mx-2' >
                                        {escrow.tokenA.metadata.symbol}
                                    </h2>
                                </div>
                            </div>
                            <div className='flex flex-col gap-2' >
                                <div className='flex gap-1'>
                                    <img src={escrow.tokenB.metadata.image} className='w-6' alt="" />
                                    <p>{escrow.tokenB.metadata.name}</p>
                                </div>
                                <div className='flex items-end'>
                                    <h2 className='text-5xl font-bold' >
                                        {escrow.tokenB.amount}
                                    </h2>
                                    <h2 className='text-2xl mx-2' >
                                        {escrow.tokenB.metadata.symbol}
                                    </h2>
                                </div>
                            </div>
                        </div>
                        <button className='bg-purple-300 p-2' onClick={() => contractActions.cancelEscrow(Buffer.from(escrow.seedHex, 'hex'), new PublicKey(escrow.initializerDepositTokenAccount), new PublicKey(escrow.tokenA.metadata.mintAddress), new PublicKey(escrow.publicKey))}>Cancel</button>
                        {/* <h3 className="text-xl font-bold mb-2">Escrow #{index + 1}</h3>
                        <p><strong>PDA Address:</strong> {escrow.publicKey.toBase58()}</p>
                        <p><strong>Initializer (Seller):</strong> {escrow.account.initializerKey.toBase58()}</p>
                        <p><strong>Seed:</strong> 0x{Buffer.from(escrow.account.uniqueSeed).toString('hex')} (Bump: {escrow.account.bump})</p>
                        <p><strong>Offer:</strong> {escrow.account.initializerAmount.toString()} tokens (Mint: {escrow.account.initializerDepositTokenMint.toBase58()})</p>
                        <p><strong>Expects:</strong> {escrow.account.takerExpectedAmount.toString()} tokens (Mint: {escrow.account.takerExpectedTokenMint.toBase58()})</p>
                        <p><strong>Receiver Account:</strong> {escrow.account.initializerReceiveTokenAccount.toBase58()}</p> */}
                    </div>
                ))
            }
        </div>
    )
}

export default page