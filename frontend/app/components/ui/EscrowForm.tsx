import React, { useState } from 'react';
import { EscrowFormModalProps } from '@/app/types/props';
import { EscrowFormState } from '@/app/types/states';
import { useMutations } from '@/app/hooks/useMutations';


type FormElement = HTMLInputElement | HTMLSelectElement;

const initialFormState: EscrowFormState = {
    initializerAmount: '',
    takerExpectedAmount: '',
    initializerDepositMint: '',
    takerExpectedMint: '',
    durationValue: '7',
    durationUnit: 'days'
};

export const EscrowFormModal: React.FC<EscrowFormModalProps> = ({ isOpen, onClose, initializerDepositMint }) => {

    const { createEscrow, isMutating } = useMutations()
    const [formData, setFormData] = useState<EscrowFormState>(initialFormState);;
    const [successPDA, setSuccessPDA] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<FormElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleClose = () => {
        if (!isMutating) {
            onClose();
            setTimeout(() => {
                setSuccessPDA(null);
                setFormData(initialFormState);
            }, 300);
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
                className={`bg-white/5 rounded-xl shadow-2xl w-full max-w-lg transition-all duration-300 ease-out ${modalClasses} p-6 space-y-6`}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
                <div className=" dark:border-gray-700 flex justify-between items-center ">
                    <h2 className="text-2xl font-bold text-white ">Create Deal</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                        disabled={isMutating}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <hr className="border-t border-gray-600" />
                <form onSubmit={(e) => {
                    e.preventDefault();
                    setSuccessPDA(null);
                    // reset();
                    createEscrow.mutate({ formData, initializerDepositMint });
                }} className=" space-y-6">
                    <InputGroup label="Token A Mint Address" name="initializerDepositMint" value={initializerDepositMint} onChange={handleChange} placeholder="Base58 Mint Address (Token A)" disabled />
                    <InputGroup label="Deposit Amount (Token A)" name="initializerAmount" type="number" value={formData.initializerAmount} onChange={handleChange} placeholder="e.g., 10000" disabled={isMutating} />
                    <InputGroup label="Token B Mint Address" name="takerExpectedMint" value={formData.takerExpectedMint} onChange={handleChange} placeholder="Base58 Mint Address (Token B)" disabled={isMutating} />
                    <InputGroup label="Expected Amount (Token B)" name="takerExpectedAmount" type="number" value={formData.takerExpectedAmount} onChange={handleChange} placeholder="e.g., 10" disabled={isMutating} />
                    <div className="space-y-2 flex gap-3">
                        <InputGroup
                            type="number"
                            name="durationValue"
                            value={formData.durationValue}
                            onChange={handleChange}
                            placeholder="e.g., 7"
                            label=' Escrow Expiration Duration'
                            disabled={isMutating}
                        />

                        <div className="flex flex-col space-x-3">
                            {/* Select for the unit (Duration Unit) */}
                            <label htmlFor="durationUnit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Duration
                            </label>
                            <select
                                name="durationUnit"
                                value={formData.durationUnit}
                                onChange={handleChange}
                                // Styling to match InputGroup, using fixed width
                                className="max-w-max px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm  dark:bg-gray-700 dark:text-gray-200 disabled:bg-gray-100 disabled:dark:bg-gray-600 transition appearance-none"
                                required
                                disabled={isMutating}
                            >
                                <option value="days">Days</option>
                                <option value="hours">Hours</option>
                                <option value="mins">Minutes</option>
                                <option value="sec">Seconds</option>
                            </select>
                        </div>
                    </div>
                    {/* {isError && (
                        <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded-lg text-sm">
                            Error: {error.message}
                        </div>
                    )} */}

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
                        disabled={isMutating || !!successPDA}
                        className={`w-full py-3 rounded-xl text-white font-bold transition duration-150 ${isMutating || !!successPDA
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-violet-900/70 hover:bg-violet-700/90 shadow-md hover:shadow-lg'
                            }`}
                    >
                        {isMutating ? (
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
    name: keyof EscrowFormState;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    type?: string;
    disabled: boolean;
}> = ({ label, name, value, onChange, placeholder, type = 'text', disabled }) => (
    <div className='w-full '>
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
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm  dark:bg-gray-700 dark:text-gray-200 disabled:bg-gray-100 disabled:dark:bg-gray-600 transition"
        />
    </div>
);


