"use client"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"; // still need this import for the button
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie"
import { motion } from 'framer-motion';
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
      router.push("/dashboard");
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
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center font-mono text-white">
      {/* Floating animated background glow */}
      <motion.div
        className="absolute inset-0 -z-10"
        animate={{
          background: [
            'radial-gradient(circle at 20% 30%, rgba(99,102,241,0.2), transparent 70%)',
            'radial-gradient(circle at 80% 70%, rgba(16,185,129,0.2), transparent 70%)',
            'radial-gradient(circle at 50% 50%, rgba(79,70,229,0.2), transparent 70%)',
          ],
        }}
        transition={{
          repeat: Infinity,
          duration: 7,
          ease: 'easeInOut',
        }}
      />
      {/* Content box */}
      <motion.div
        className="backdrop-blur-md  bg-white/10 rounded-2xl shadow-2xl p-10 flex flex-col items-center text-center max-w-lg w-full mx-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.h1
          className="text-5xl font-extrabold mb-4 bg-clip-text text-gray-200 "
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Escrow Portal
        </motion.h1>

        <motion.p
          className="text-gray-400 mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Secure. Transparent. Decentralized.
          Connect your Solana wallet to begin.
        </motion.p>

        {/* Wallet Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <WalletMultiButton
            className="!bg-indigo-600 hover:!bg-indigo-500 !rounded-xl !px-8 !py-3 !text-lg !font-semibold !transition-all !duration-300"
          />
        </motion.div>

        {/* Connection state */}
        {connected && (
          <motion.p
            className="mt-6 text-sm text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Connected as{' '}
            <span className="text-indigo-400 font-medium">
              {publicKey?.toBase58().slice(0, 6)}...
              {publicKey?.toBase58().slice(-4)}
            </span>
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}

export default App;