"use client"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"; // still need this import for the button
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";

function App() {
  // const network = WalletAdapterNetwork.Devnet;

  const { publicKey, connected } = useWallet();
  const router = useRouter()
  const API_BASE = "http://localhost:3000"
  const { mutate: submit, isPending, isError, error } = useMutation({
    mutationFn: async (address: string) => {
      const { data } = await axios.get(`${API_BASE}/api/user/${address}`);
      return data;
    },
    onSuccess: (data) => {
      console.log("User fetched or created:", data);
      Cookies.set("user", data);
      // router.push("/dashboard");
    },
    onError: (error) => {
      console.error("Error fetching/creating user:", error);
    },
  });

  useEffect(() => {
    if (connected && publicKey) {
      submit(publicKey.toBase58());
    }
  }, [connected, publicKey]);

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