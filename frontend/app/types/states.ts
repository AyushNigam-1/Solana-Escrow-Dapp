export interface EscrowFormState {
    initializerAmount: string;
    takerExpectedAmount: string;
    initializerDepositMint?: string;
    takerExpectedMint: string;
    durationValue: string;
    durationUnit: 'days' | 'hours' | 'mins' | 'sec';
}