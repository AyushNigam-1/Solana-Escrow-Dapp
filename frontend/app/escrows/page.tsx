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
                            <div>
                                <img src="https://static.vecteezy.com/system/resources/previews/024/092/856/original/ftx-token-ftt-glass-crypto-coin-3d-illustration-free-png.png" className='w-12' alt="" />
                            </div>
                            <button className='bg-green-300 p-2' onClick={() => contractActions.cancelEscrow(Buffer.from(escrow.seedHex), new PublicKey(escrow.initializerReceiveTokenAccount), new PublicKey(escrow.tokenA.metadata.mintAddress))}>Cancel</button>
                        </div>
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