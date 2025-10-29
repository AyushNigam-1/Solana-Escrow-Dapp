import React, { useState } from 'react';
// Mock imports for runnable component demonstration
// import { PublicKey } from '@solana/web3.js';
// import { useWallet } from '@solana/wallet-adapter-react';
// import * as anchor from "@project-serum/anchor";
// import { BN } from 'bn.js';
import { useEscrowActions } from '@/app/hooks/useEscrowActions';
import { PublicKey } from '@solana/web3.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// --- END MOCK UTILITIES ---

// Component props interface
interface EscrowFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initializerDepositMint: string;
    // In a real app, you would pass these from the context:
    // initializeEscrow: typeof mockInitializeEscrow; 
    // wallet: useWallet;
    // program: typeof MOCK_PROGRAM;
}

interface FormState {
    initializerAmount: string;
    takerExpectedAmount: string;
    initializerDepositMint?: string;
    takerExpectedMint: string;
}

const initialFormState: FormState = {
    initializerAmount: '',
    takerExpectedAmount: '',
    initializerDepositMint: '',
    takerExpectedMint: '',
};

export const EscrowFormModal: React.FC<EscrowFormModalProps> = ({ isOpen, onClose, initializerDepositMint }) => {
    const contractActions = useEscrowActions();
    const [formData, setFormData] = useState<FormState>(initialFormState);
    const [successPDA, setSuccessPDA] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // const handleSubmit = async (e: React.FormEvent) => {
    //     e.preventDefault();
    //     setError(null);
    //     setSuccessPDA(null);
    //     setisPending(true);

    //     try {
    //         // 1. Validation and Conversion
    //         const requiredFields = ['initializerAmount', 'takerExpectedAmount', 'takerExpectedMint'];
    //         for (const field of requiredFields) {
    //             if (!formData[field as keyof FormState]) throw new Error(`${field} is required.`);
    //         }

    //         const initAmount = parseFloat(formData.initializerAmount);
    //         const takerAmount = parseFloat(formData.takerExpectedAmount);

    //         if (isNaN(initAmount) || initAmount <= 0 || isNaN(takerAmount) || takerAmount <= 0) {
    //             throw new Error("Amounts must be positive numbers.");
    //         }

    //         // --- CRITICAL STEP: CONVERT STRING ADDRESSES TO PUBLIC KEYS ---
    //         const depositMintPK = new PublicKey(initializerDepositMint);
    //         const expectedMintPK = new PublicKey(formData.takerExpectedMint);

    //         // 2. Call the real Escrow function with correctly typed arguments
    //         console.log("Calling initializeEscrow...");
    //         // console.log(contractActions.())
    //         // const { escrowStatePDA } = await contractActions.initializeEscrow(
    //         await contractActions.initializeEscrow(

    //             initAmount,
    //             takerAmount,
    //             depositMintPK,
    //             expectedMintPK
    //         );

    //         // setSuccessPDA(escrowStatePDA.toBase58());

    //     } catch (err) {
    //         console.error("Submission Error:", err);
    //         // Use the error message from the failed conversion or the initializeEscrow function
    //         setError((err as Error).message || "An unknown error occurred during initialization.");
    //     } finally {
    //         setisPending(false);
    //     }
    // };
    const queryClient = useQueryClient();
    const { mutate: submit, isPending, isError, error, reset } = useMutation({
        mutationFn: async () => {
            const requiredFields = ['initializerAmount', 'takerExpectedAmount', 'takerExpectedMint'];

            for (const field of requiredFields) {
                if (!formData[field as keyof typeof formData]) {
                    throw new Error(`${field} is required.`);
                }
            }

            const initAmount = parseFloat(formData.initializerAmount);
            const takerAmount = parseFloat(formData.takerExpectedAmount);

            if (isNaN(initAmount) || initAmount <= 0 || isNaN(takerAmount) || takerAmount <= 0) {
                throw new Error("Amounts must be positive numbers.");
            }
            // CRITICAL STEP: CONVERT STRING ADDRESSES TO PUBLIC KEYS
            const depositMintPK = new PublicKey(initializerDepositMint);
            const expectedMintPK = new PublicKey(formData.takerExpectedMint);

            // --- 2. Call the Escrow function ---
            return await contractActions.initializeEscrow(
                initAmount,
                takerAmount,
                depositMintPK,
                expectedMintPK
            );
        },
        onSuccess: (data) => {
            console.log("✅ Escrow Initialized Successfully! PDA:", data.escrowStatePDA.toBase58());
            queryClient.invalidateQueries({ queryKey: ['AllEscrows'] });
        },

        onError: (error) => {
            console.error("Escrow initialization failed:", error.message);
        },
    });

    const handleClose = () => {
        if (!isPending) {
            onClose();
            // Reset state on close
            setTimeout(() => {
                setSuccessPDA(null);
                setFormData(initialFormState);
            }, 300); // Wait for animation
        }
    };

    const modalClasses = isOpen
        ? 'opacity-100 translate-y-0 scale-100'
        : 'opacity-0 translate-y-4 scale-95 pointer-events-none';

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-gray-900/50 transition-opacity duration-300"
            onClick={handleClose}
        >
            <div
                className={`bg-gray-100/10 rounded-xl shadow-2xl w-full max-w-lg transition-all duration-300 ease-out ${modalClasses} p-6 space-y-6`}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
                <div className=" dark:border-gray-700 flex justify-between items-center ">
                    <h2 className="text-2xl font-bold text-white ">Create Escrow</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                        disabled={isPending}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <hr className="border-t border-gray-600" />
                <form onSubmit={(e) => {
                    e.preventDefault();
                    setSuccessPDA(null);
                    reset();
                    submit();
                }} className=" space-y-6">
                    <InputGroup label="Token A Mint Address" name="initializerDepositMint" value={initializerDepositMint} onChange={handleChange} placeholder="Base58 Mint Address (Token A)" disabled />
                    <InputGroup label="Deposit Amount (Token A)" name="initializerAmount" type="number" value={formData.initializerAmount} onChange={handleChange} placeholder="e.g., 10000" disabled={isPending} />

                    <div className='flex items-center gap-1 justify-center'>
                        <hr className="border-t border-gray-600 w-full" />
                        <span className='p-2 rounded-full bg-gray-700'>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                            </svg>
                        </span>
                        <hr className="border-t border-gray-600 w-full" />
                    </div>

                    <InputGroup label="Token B Mint Address" name="takerExpectedMint" value={formData.takerExpectedMint} onChange={handleChange} placeholder="Base58 Mint Address (Token B)" disabled={isPending} />
                    <InputGroup label="Expected Amount (Token B)" name="takerExpectedAmount" type="number" value={formData.takerExpectedAmount} onChange={handleChange} placeholder="e.g., 10" disabled={isPending} />

                    {isError && (
                        <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded-lg text-sm">
                            Error: {error.message}
                        </div>
                    )}

                    {successPDA && (
                        <div className="p-4 bg-green-100 dark:bg-green-800 rounded-lg shadow-inner text-green-800 dark:text-green-200">
                            <p className="font-semibold">✅ Escrow Initialized Successfully!</p>
                            <p className="text-xs mt-1 break-all">
                                PDA Address: <code className="font-mono text-xs">{successPDA}</code>
                            </p>
                            <button
                                onClick={handleClose}
                                type="button"
                                className="mt-3 w-full py-2 text-sm font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 transition"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending || !!successPDA}
                        className={`w-full py-3 rounded-xl text-white font-bold transition duration-150 ${isPending || !!successPDA
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-violet-900/70 hover:bg-violet-700/90 shadow-md hover:shadow-lg'
                            }`}
                    >
                        {isPending ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating...
                            </div>
                        ) : (
                            'Create'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Helper component for structured input fields
const InputGroup: React.FC<{
    label: string;
    name: keyof FormState;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    type?: string;
    disabled: boolean;
}> = ({ label, name, value, onChange, placeholder, type = 'text', disabled }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
        </label>
        <input
            id={name}
            name={name}
            type={type}
            step={type === 'number' ? 'any' : undefined}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-gray-200 disabled:bg-gray-100 disabled:dark:bg-gray-600 transition"
        />
    </div>
);


