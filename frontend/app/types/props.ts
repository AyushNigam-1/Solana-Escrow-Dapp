import { LucideIcon } from "lucide-react";
import { UserTokenAccount } from "./query";
import { Dispatch, SetStateAction } from "react";
import { EscrowFormState } from "./states";

export interface UseUserTokenAccountsHook {
    accounts: UserTokenAccount[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export interface MutationHookProps {
    setPendingId?: Dispatch<SetStateAction<string | null>>;
}

export interface EscrowFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initializerDepositMint?: string;
    data?: EscrowFormState
}

export interface ChartContainerProps {
    title: string;
    children: React.ReactNode;
}

export interface HeaderProps {
    title: string;
    refetch: () => void;
    setSearchQuery: (query: string) => void;
    isFetching: boolean;
}

export interface NavItemProps {
    icon: React.ReactNode;
    text: string;
    route: string;
    onNavigate: (route: string) => void; // The callback function from the parent
    isActive: boolean;
}

export interface TableHeaderProps {
    icon: React.ReactNode
    title: string
}

export interface StatCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    color: string;
}