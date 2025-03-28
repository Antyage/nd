import { TOKEN_DECIMALS, 
    TOKEN_TOTAL_SUPPLY 
} from "./consts";
import { connection } from "./config";
import { Keypair, 
    SystemProgram, 
    PublicKey, 
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, 
    MINT_SIZE, 
    AuthorityType, 
    getMinimumBalanceForRentExemptMint, 
    createInitializeMintInstruction, 
    getAssociatedTokenAddress, 
    createAssociatedTokenAccountInstruction, 
    createMintToInstruction, 
    createSetAuthorityInstruction
} from "@solana/spl-token";
import { createCreateMetadataAccountV3Instruction, 
    PROGRAM_ID, 
} from "@metaplex-foundation/mpl-token-metadata";
import { AnchorWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { uploadMetadata } from "../api/token";


const createMint = async(mintAuthority: PublicKey, freezeAuthority: PublicKey | null, decimals: number) => {
    const keypair = Keypair.generate();
    const lamports = await getMinimumBalanceForRentExemptMint(connection);

    const ixs = [
        SystemProgram.createAccount({
            fromPubkey: mintAuthority, 
            newAccountPubkey: keypair.publicKey, 
            space: MINT_SIZE, 
            lamports, 
            programId: TOKEN_PROGRAM_ID
        }), 
        createInitializeMintInstruction(
            keypair.publicKey, 
            decimals, 
            mintAuthority, 
            freezeAuthority, 
            TOKEN_PROGRAM_ID
        )
    ];

    return { keypair, ixs };
};

const mintToken = async(mint: PublicKey, mintAuthority: PublicKey, mintAmount: bigint, decimals: number) => {
    console.log(`Minting tokens with mint ${mint} amount ${mintAmount}...`);

    const tokenAta = await getAssociatedTokenAddress(mint, mintAuthority);

    let ixs = [
        createAssociatedTokenAccountInstruction(mintAuthority, 
            tokenAta, 
            mintAuthority, 
            mint
        ), 
        createMintToInstruction(mint, 
            tokenAta, 
            mintAuthority, 
            mintAmount * BigInt(10 ** decimals)
        )
    ];

    return ixs;
}

const createMetadata = async(walletCtx: AnchorWallet, mint: PublicKey, name: string, symbol: string, description: string, imgBuffer: any, imgFile: File, websiteLink: string | undefined, twitterLink: string | undefined, tgLink: string | undefined, refAddress: string | undefined, mintAuthority: PublicKey, updateAuthority: PublicKey) => {
    // console.log(`Creating metadata with mint ${mint}...`);
    if (!walletCtx.publicKey)
        throw new Error("Wallet not connected!");

    const metadata = {
        name,
        symbol,
        description,
        website: websiteLink,
        twitter: twitterLink,
        telegram: tgLink,
        referral: refAddress
    };

    const {imageUrl, metadataUri} = await uploadMetadata(imgFile, metadata);
    if (!imageUrl || !metadataUri)
        throw new Error("Failed to upload metadata!");

    const [metadataPDA] = await PublicKey.findProgramAddress(
        [
            Buffer.from("metadata"), 
            PROGRAM_ID.toBuffer(), 
            mint.toBuffer()
        ], 
        PROGRAM_ID
    );
    // console.log(`  Got metadataAccount address: ${metadataPDA}`);

    // on-chain metadata format
    const tokenMetadata = {
        name, 
        symbol, 
        uri: metadataUri, 
        sellerFeeBasisPoints: 0, 
        creators: null, 
        collection: null, 
        uses: null
    };

    // transaction to create metadata account
    const ix = createCreateMetadataAccountV3Instruction({
            metadata: metadataPDA, 
            mint, 
            mintAuthority, 
            payer: walletCtx.publicKey, 
            updateAuthority
        }, {
            createMetadataAccountArgsV3: {
                data: tokenMetadata, 
                isMutable: true, 
                collectionDetails: null
            }
        }
    );

    return {imageUrl, ix};
};

const revokeMintAuthority = async(mint: PublicKey, mintAuthority: PublicKey) => {
    console.log(`Revoking mintAuthority of token ${mint}...`);

    const ix = createSetAuthorityInstruction(mint, 
        mintAuthority, 
        AuthorityType.MintTokens, 
        null
    );

    return ix;
};


export const createToken = async(walletCtx: AnchorWallet, name: string, ticker: string, description: string, imgBuffer: any, imgFile: File, websiteLink: string | undefined, twitterLink: string | undefined, tgLink: string | undefined, refAddress: string | undefined) => {
    // console.log(`${walletCtx.publicKey.toBase58()} is creating a new token with name: '${name}', ticker: '${ticker}', description: '${description}'`);
    // console.log(`  website: '${websiteLink}', twitterLink: '${twitterLink}', telegramLink: '${tgLink}'...`);

    if (!walletCtx.publicKey)
        throw new Error("Wallet not connected!");

    try {
        let createIxs = [];

        console.log("Creating token...");
        /* Step 1 - Create mint (feeAuthority disabled) */
        const { keypair: mintKeypair , ixs: createMintIxs } = await createMint(walletCtx.publicKey, null, TOKEN_DECIMALS);
        createIxs = createMintIxs;
        console.log('  mint:', mintKeypair.publicKey.toBase58());

        /* Step 2 - Create metadata */
        const {imageUrl, ix: metadataIx} = await createMetadata(walletCtx, mintKeypair.publicKey, name, ticker, description, imgBuffer, imgFile, websiteLink, twitterLink, tgLink, refAddress, walletCtx.publicKey, walletCtx.publicKey);
        createIxs.push(metadataIx);
        console.log('  metadata:', imageUrl);
        
        /* Step 3 - Mint tokens to owner */
        const mintIxs = await mintToken(mintKeypair.publicKey, walletCtx.publicKey, BigInt(TOKEN_TOTAL_SUPPLY), TOKEN_DECIMALS);
        createIxs = [...createIxs, ...mintIxs];
        console.log('  minted tokens to owner');

        /* Step 4 - Revoke mintAuthority */
        const revokeIx = await revokeMintAuthority(mintKeypair.publicKey, walletCtx.publicKey);
        createIxs.push(revokeIx);
        console.log('  revoked mintAuthority');

        return { mintKeypair, imageUrl, createIxs };
    } catch (err) {
        console.error(`Failed to create token: ${err}`);
        if (err instanceof Error) {
            throw new Error(`Failed to create token: ${err.message}`);
        } else {
            throw new Error(String(err));
        }
    }
};
