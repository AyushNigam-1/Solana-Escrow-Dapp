import { Connection, PublicKey } from "@solana/web3.js";
import { getTokenMetadata, TOKEN_PROGRAM_ID } from "@solana/spl-token";

// Define the Program ID for Token-2022 (Token Extensions)
// NOTE: You should confirm this constant is also in your ContractInterface.ts
export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Define a type for the full token data (on-chain + off-chain)
export interface FullTokenMetadata {
    // On-Chain Fields
    name: string;
    symbol: string;
    uri: string;

    // Off-Chain Fields (from the decoded URI)
    description: string;
    image: string; // The URL to the token logo
    // Add other fields like attributes or properties here if needed
}

function decodeDataUri(dataUri: string): any {
    if (!dataUri || !dataUri.startsWith('data:application/json;base64,')) {
        throw new Error("Invalid Data URI format.");
    }

    const base64Content = dataUri.split(',')[1];

    // Use the browser's native base64 decoding function
    // For Node.js/Server-side rendering, you might need Buffer.from(base64Content, 'base64').toString('utf8');
    const jsonString = atob(base64Content);
    return JSON.parse(jsonString);
}

/**
 * Fetches and parses all metadata (on-chain and off-chain) for a Token-2022 mint address.
 * * @param mintAddress The PublicKey of the token mint.
 * @returns A promise that resolves to the combined token metadata object.
 */
export async function fetchTokenMetadata(
    mintAddress: PublicKey,
): Promise<FullTokenMetadata> {

    // 1. Fetch on-chain metadata (name, symbol, uri)
    const onChainMetadata = await getTokenMetadata(
        connection,
        mintAddress,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
    );
    console.log(mintAddress)
    if (!onChainMetadata) {
        throw new Error(`Metadata not found for mint: ${mintAddress.toBase58()}`);
    }

    // 2. Decode and fetch off-chain metadata (image, description) from the URI
    const offChainData = decodeDataUri(onChainMetadata.uri);

    // 3. Combine and return
    return {
        name: onChainMetadata.name,
        symbol: onChainMetadata.symbol,
        uri: onChainMetadata.uri,
        description: offChainData.description || "",
        image: offChainData.image || "" // Use a placeholder if image is missing
    };
}
export interface UserTokenAccount {
    address: PublicKey; // The address of the Token Account (not the mint)
    mint: PublicKey;    // The Mint address (Token A or Token B)
    amount: number;     // The balance held in the account (as a whole number)
    uiAmount: number;   // The balance held in the account (with decimals applied)
    decimals: number;   // The decimals of the associated mint
    name: string;
    symbol: string;
    description: string;
    image: string
}

export async function fetchUserTokenAccounts(
    owner: PublicKey,
): Promise<UserTokenAccount[]> {

    // Use getParsedTokenAccountsByOwner for cleaner data, supporting both programs
    const [token2022Accounts, legacyTokenAccounts] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID }),
        connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }),
    ]);

    const rawAccounts = [...token2022Accounts.value, ...legacyTokenAccounts.value];

    const userAccounts: UserTokenAccount[] = [];

    for (const { pubkey, account } of rawAccounts) {
        // Data structure for parsed token accounts is: account.data.parsed.info
        const info = account.data.parsed.info;
        const metadata = await fetchTokenMetadata(new PublicKey(info.mint))
        // console.log("metadata", metadata)
        // console.log(info.mint.toBase58())
        const uiAmount = info.tokenAmount.uiAmount;
        const amount = info.tokenAmount.amount;
        const decimals = info.tokenAmount.decimals;

        // Only include accounts with a positive balance and valid mint/owner
        if (uiAmount > 0 && info.mint && info.owner) {
            userAccounts.push({
                address: pubkey,
                mint: new PublicKey(info.mint),
                amount: parseInt(amount, 10),
                uiAmount,
                decimals,
                name: metadata.name,
                symbol: metadata.symbol,
                description: metadata.description || "",
                image: metadata.image || "" // Use a placeholder if image is missing
            });
        }
    }

    return userAccounts;
}
