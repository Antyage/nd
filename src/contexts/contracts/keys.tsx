import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, 
    ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { PUMPFUN_PROGRAM_ID, 
    MAINSTATE_PREFIX_SEED, 
    POOLSTATE_PREFIX_SEED
} from './constants';


const asyncGetPda = async (seeds: Array<Buffer | Uint8Array>, programId: PublicKey) => {
    const [pubKey, bump] = PublicKey.findProgramAddressSync(seeds, programId);
    return [pubKey, bump];
};

export const getMainStateKey = async () => {
    const [mainStateKey] = await asyncGetPda([Buffer.from(MAINSTATE_PREFIX_SEED)], 
        PUMPFUN_PROGRAM_ID
    );
    return mainStateKey;
};

export const getPoolStateKey = async (baseMint: PublicKey, quoteMint: PublicKey) => {
    const [poolStateKey] = await asyncGetPda(
        [
            Buffer.from(POOLSTATE_PREFIX_SEED), 
            baseMint.toBuffer(), 
            quoteMint.toBuffer(),
        ], 
        PUMPFUN_PROGRAM_ID
    );
    return poolStateKey;
};

export const getAssociatedTokenAccountKey = async (ownerPubkey: PublicKey, tokenMint: PublicKey) => {
    let associatedTokenAccountKey = PublicKey.findProgramAddressSync(
        [
            ownerPubkey.toBuffer(), 
            TOKEN_PROGRAM_ID.toBuffer(), 
            tokenMint.toBuffer()
        ], 
        ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];
    return associatedTokenAccountKey;
};
