"use client"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"; // still need this import for the button
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { fetchUserTokenAccounts } from "./utils/token"
import { useRouter } from "next/router";
import { cookies } from "next/headers";
function App() {
  const { publicKey, connected } = useWallet();
  const [accounts, setAccounts] = useState()
  const router = useRouter()
  useEffect(() => {
    if (publicKey) {
      const fetchAccounts = async () => {
        try {
          // Note: fetchUserTokenAccounts usually requires the Connection object too.
          const accounts = await fetchUserTokenAccounts(publicKey);
          console.log("Fetched Accounts:", accounts);
          console.log("User Public Key:", publicKey.toBase58());
        } catch (error) {
          console.error("Error fetching token accounts:", error);
        }
      };
      fetchAccounts();
      cookies.set("user", publicKey)
      router.push("/dashboard")
    }

    // Dependency array: Rerun the effect whenever the publicKey or connection object changes.
  }, [publicKey, connected]);

  // console.log(connected)

  return (
    <>
      <WalletMultiButton />
      <div className="mt-8 p-6 bg-gray-800 border border-purple-500/50 rounded-xl shadow-2xl">
        {publicKey ? (
          <div className="text-center">
            <p className="font-extrabold text-2xl text-green-400 mb-2">
              Wallet Connected!
            </p>
            <p className="text-sm text-gray-400">
              Your Public Key (Address):
            </p>
            <code className="break-all inline-block p-2 mt-1 bg-gray-900 rounded-lg text-yellow-300 shadow-inner">
              {publicKey.toBase58()}
            </code>

            {/* Integration point for your custom hooks */}
            {/* <div className="mt-6">
                <h3 className="text-xl font-semibold mb-3 text-purple-400">Your Tokens</h3>
                {loading && <p className="text-sm text-gray-500">Loading token balances...</p>}
                {accounts.length > 0 && (
                  <ul className="list-disc list-inside text-left mx-auto max-w-sm">
                    {accounts.map(acc => (
                      <li key={acc.address.toBase58()} className="text-gray-300">
                        {acc.uiAmount} {acc.mint.toBase58().substring(0, 4)}...
                      </li>
                    ))}
                  </ul>
                )}
              </div> */}

          </div>
        ) : (
          <p className="text-center font-semibold text-lg text-red-400">
            Please connect your wallet to interact with the Escrow DApp.
          </p>
        )}
      </div>
    </>
  );
}

export default App;