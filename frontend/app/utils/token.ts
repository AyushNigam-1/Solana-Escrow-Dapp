import { Connection, PublicKey } from "@solana/web3.js";
import { getTokenMetadata, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import axios from "axios"

export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

export interface FullTokenMetadata {
    name: string;
    symbol: string;
    uri: string;
    description: string;
    image: string;
}
interface OffChainMetadata {
    name: string;
    symbol: string;
    description: string;
    image: string;
}
function decodeDataUri(dataUri: string): any {
    if (!dataUri || !dataUri.startsWith('data:application/json;base64,')) {
        throw new Error("Invalid Data URI format.");
    }
    const base64Content = dataUri.split(',')[1];
    const jsonString = atob(base64Content);
    return JSON.parse(jsonString);
}

export async function fetchTokenMetadata(
    mintAddress: PublicKey,
): Promise<FullTokenMetadata> {

    const onChainMetadata = await getTokenMetadata(
        connection,
        mintAddress,
        "confirmed",
        TOKEN_2022_PROGRAM_ID
    );
    
    if (!onChainMetadata) {
        throw new Error(`Metadata not found for mint: ${mintAddress.toBase58()}`);
    }

    let offChainData: OffChainMetadata = { name: onChainMetadata.name, symbol: onChainMetadata.symbol, description: "", image: "" };

    try {
        const response = await fetch(onChainMetadata.uri);
        if (!response.ok) {
            throw new Error(`Failed to fetch metadata from URI: ${onChainMetadata.uri} (Status: ${response.status})`);
        }
        offChainData = await response.json();
    } catch (e) {
        console.warn(`Could not fetch or parse off-chain metadata from URI: ${onChainMetadata.uri}. Falling back to on-chain data. Error:`, e);
    }

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
        const uiAmount = info.tokenAmount.uiAmount;
        const amount = info.tokenAmount.amount;
        const decimals = info.tokenAmount.decimals;
console.log("mint",info.mint,info.owner ,uiAmount)
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
console.log("inside fetch acc" , userAccounts)
    return userAccounts;
}
