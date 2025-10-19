import { Connection, PublicKey } from "@solana/web3.js";
import { getTokenMetadata, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { FullTokenMetadata, OffChainMetadata, UserTokenAccount } from "../types";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// function decodeDataUri(dataUri: string): any {
//     if (!dataUri || !dataUri.startsWith('data:application/json;base64,')) {
//         throw new Error("Invalid Data URI format.");
//     }
//     const base64Content = dataUri.split(',')[1];
//     const jsonString = atob(base64Content);
//     return JSON.parse(jsonString);
// }

export async function fetchTokenMetadata(
    mintAddress: PublicKey,
    programId: PublicKey,
): Promise<FullTokenMetadata> {

    const onChainMetadata = await getTokenMetadata(
        connection,
        mintAddress,
        "confirmed",
        programId
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

function getProgramIdFromIdentifier(programIdentifier: string): PublicKey | null {
    switch (programIdentifier) {
        case "spl-token-2022":
            return TOKEN_2022_PROGRAM_ID;
        case "spl-token":
            return TOKEN_PROGRAM_ID;
        default:
            // Handle custom program ID case if necessary, or return null
            console.warn(`Unknown token program identifier: ${programIdentifier}`);
            return null;
    }
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
    console.log("rawAccounts", rawAccounts)
    const userAccounts: UserTokenAccount[] = [];

    for (const { pubkey, account } of rawAccounts) {
        // Data structure for parsed token accounts is: account.data.parsed.info
        const info = account.data.parsed.info;
        const programIdentifier = account.data.program; // <-- EXTRACT THE PROGRAM IDENTIFIER HERE
        const programId = getProgramIdFromIdentifier(programIdentifier);

        const metadata = await fetchTokenMetadata(new PublicKey(info.mint), programId!)
        const uiAmount = info.tokenAmount.uiAmount;
        const amount = info.tokenAmount.amount;
        const decimals = info.tokenAmount.decimals;
        console.log("mint", info.mint, info.owner, uiAmount)
        // Only include accounts with a positive balance and valid mint/owner
        if (uiAmount > 0 && info.mint && info.owner) {
            userAccounts.push({
                tokenAddress: String(pubkey),
                mint: info.mint,
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
    console.log("inside fetch acc", userAccounts)
    return userAccounts;
}
