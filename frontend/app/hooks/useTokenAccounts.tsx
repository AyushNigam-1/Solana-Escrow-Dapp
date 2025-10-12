import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { fetchUserTokenAccounts, UserTokenAccount } from "../utils/token"

interface UseUserTokenAccountsHook {
    accounts: UserTokenAccount[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export function useUserTokenAccounts(
    ownerPublicKey: PublicKey | null
): UseUserTokenAccountsHook {
    const [accounts, setAccounts] = useState<UserTokenAccount[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [refetchIndex, setRefetchIndex] = useState(0);

    const refresh = () => setRefetchIndex(prev => prev + 1);

    useEffect(() => {
        if (!ownerPublicKey) {
            setAccounts([]);
            setLoading(false);
            return;
        }

        const loadAccounts = async () => {
            setLoading(true);
            setError(null);
            try {
                const fetchedAccounts = await fetchUserTokenAccounts(ownerPublicKey);
                setAccounts(fetchedAccounts);
            } catch (err) {
                console.error("Failed to load user token accounts:", err);
                setError("Failed to fetch token accounts. Check connection and wallet.");
                setAccounts([]);
            } finally {
                setLoading(false);
            }
        };

        loadAccounts();

    }, [ownerPublicKey, refetchIndex]);

    return { accounts, loading, error, refresh };
}
