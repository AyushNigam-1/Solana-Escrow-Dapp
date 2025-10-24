import { Connection, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { getTokenMetadata, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID, getAccount, getMint, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { FullTokenMetadata, OffChainMetadata, UserTokenAccount } from "../types";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

export const ensureATA = async (mint: PublicKey, publicKey: PublicKey, sendTransaction: any): Promise<PublicKey> => {
    const owner = publicKey!; // Connected wallet PK

    // NEW: Detect token program ID based on mint owner
    const mintInfo = await connection.getAccountInfo(mint);
    if (!mintInfo) {
        throw new Error(`Mint account does // function decodeDataUri(dataUri: string): any {
//     if (!dataUri || !dataUri.startsWith('data:application/json;base64,')) {
//         throw new Error("Invalid Data URI format.");
//     }
//     const base64Content = dataUri.split(',')[1];
//     const jsonString = atob(base64Content);
//     return JSON.parse(jsonString);
// }not exist: ${mint.toBase58()}`);
    }
    console.log('Mint Owner:', mintInfo.owner.toBase58());  // Log for debug: Tokenkeg... (legacy) or Tokenz... (2022)

    const tokenProgramId = mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID)
        ? TOKEN_2022_PROGRAM_ID
        : TOKEN_PROGRAM_ID;

    console.log('Using Token Program ID:', tokenProgramId.toBase58());

    // Derive ATA with detected tokenProgramId
    const ata = await getAssociatedTokenAddress(
        mint,
        owner,
        false,  // allowOwnerOffCurve (rarely true)
        tokenProgramId, // ← Pass detected ID
        ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    try {
        await getAccount(connection, ata, undefined, tokenProgramId);  // Pass tokenProgramId to getAccount too
        console.log("✅ ATA already exists:", ata.toBase58());
        return ata;
    } catch (err) {
        console.log("⚠️ ATA not found. Creating new ATA...");

        // Balance check
        const balance = await connection.getBalance(owner);
        console.log('SOL Balance (SOL):', balance / 1e9);
        if (balance < 2_000_000) {
            throw new Error(`Insufficient SOL: ${balance / 1e9} SOL (need ~0.002)`);
        }

        // Optional: Validate mint details
        const mintData = await getMint(connection, mint, 'confirmed', tokenProgramId);
        console.log('Mint Decimals:', mintData.decimals);  // Quick sanity check

        // Fetch latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

        // Create ix with detected tokenProgramId
        const ix = createAssociatedTokenAccountInstruction(
            owner, // payer
            ata,   // associated token account
            owner, // owner
            mint,
            tokenProgramId,                          // ← Key: Detected Token program
            ASSOCIATED_TOKEN_PROGRAM_ID              // Explicit ATA program
        );

        // LOG the programId to verify (should be ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL)
        console.log('ATA Ix Program ID:', ix.programId.toBase58());
        if (ix.programId.toBase58() !== 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL') {
            throw new Error('Invalid Associated Token Program ID!');
        }

        // Compile to VersionedTransaction
        const messageV0 = new TransactionMessage({
            payerKey: owner,
            recentBlockhash: blockhash,
            instructions: [ix],
        }).compileToV0Message();

        const tx = new VersionedTransaction(messageV0);

        // Simulate FIRST to catch errors early
        const sim = await connection.simulateTransaction(tx, { commitment: 'confirmed' });
        console.log('Simulation Result:', sim);
        if (sim.value.err) {
            console.error('Sim Error Details:', sim.value.err);
            throw new Error(`Simulation failed: ${JSON.stringify(sim.value.err)}`);
        }

        try {
            const signature = await sendTransaction(tx, connection, {
                skipPreflight: false,
                preflightCommitment: "confirmed",
                maxRetries: 3,
            });

            await connection.confirmTransaction(
                { signature, blockhash, lastValidBlockHeight },
                "confirmed"
            );

            console.log("✅ Created new ATA:", ata.toBase58(), "Sig:", signature);
            return ata;
        } catch (err: any) {
            console.error('Full Send Error:', {
                message: err.message,
                code: err.code,
                name: err.name,
                stack: err.stack,
                cause: err.cause,
                logs: err.logs,
            });
            throw err;
        }
    }
};

export const getMintProgramId = async (mint: PublicKey): Promise<PublicKey> => {
    try {
        // Fetch the mint account data
        const mintAccountInfo = await connection.getAccountInfo(mint);

        if (!mintAccountInfo) {
            console.warn("Mint account not found. Defaulting to standard SPL Token Program ID.");
            return TOKEN_PROGRAM_ID;
        }

        // Check if the mint's owner matches the Token-2022 Program ID
        if (mintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
            console.log(`Mint ${mint.toBase58()} is owned by Token-2022.`);
            return TOKEN_2022_PROGRAM_ID;
        }

        // Default to the standard program ID if not Token-2022
        console.log(`Mint ${mint.toBase58()} is owned by standard SPL Token.`);
        return TOKEN_PROGRAM_ID;

    } catch (e) {
        console.error("Failed to fetch mint account info, defaulting to standard SPL Token Program ID:", e);
        return TOKEN_PROGRAM_ID;
    }
};
export const generateUniqueSeed = (): Buffer => {
    // window.crypto.getRandomValues generates secure random numbers for the Uint8Array
    const buffer = new Uint8Array(8);
    if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(buffer);
    } else {
        // Fallback for Node.js environments (like certain testing setups) 
        // Note: For a true browser/dapp environment, the above line is sufficient.
        console.warn("Using insecure fallback for random seed generation. Ensure window.crypto is available.");
        for (let i = 0; i < 8; i++) {
            buffer[i] = Math.floor(Math.random() * 256);
        }
    }
    // Convert the Uint8Array to a Buffer, which is what PDA calculations prefer
    return Buffer.from(buffer);
};

export async function fetchTokenMetadata(
    mintAddress: PublicKey,
): Promise<FullTokenMetadata> {
    const programId = await getMintProgramId(mintAddress);
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
        image: offChainData.image || "", // Use a placeholder if image is missing
        mintAddress: mintAddress.toBase58(),
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

        const metadata = await fetchTokenMetadata(new PublicKey(info.mint))
        const uiAmount = info.tokenAmount.uiAmount;
        const amount = info.tokenAmount.amount;
        const decimals = info.tokenAmount.decimals;
        console.log("mint", info.mint, info.owner, uiAmount)
        // Only include accounts with a positive balance and valid mint/owner
        if (info.mint && info.owner) {
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
