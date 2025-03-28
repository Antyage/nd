
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
// import { web3 } from '@coral-xyz/anchor'
import * as anchor from '@project-serum/anchor';
import { PublicKey, 
    SystemProgram, 
    Transaction
} from '@solana/web3.js';
import { NATIVE_MINT, 
    TOKEN_PROGRAM_ID, 
    ASSOCIATED_TOKEN_PROGRAM_ID, 
    getMint, 
    getAssociatedTokenAddressSync
} from '@solana/spl-token';
import BN from 'bn.js';

import { PUMPFUN_PROGRAM_ID, 
    FEE_PRE_DIV 
} from './constants';
import { IDL } from './idl';
import * as Keys from './keys';
import { connection } from '../../engine/config';
import { send } from "../../engine/utils";
import { TOKEN_DECIMALS } from "../../engine/consts";
import { AnchorWallet } from "@solana/wallet-adapter-react";


const getProgram = (wallet: AnchorWallet | undefined) => {
    if (!wallet) {
        // throw new WalletNotConnectedError();
        return null
    }
    const provider = new anchor.AnchorProvider(
        connection, 
        wallet, 
        anchor.AnchorProvider.defaultOptions()
    );

    const program = new anchor.Program(IDL, PUMPFUN_PROGRAM_ID, provider);
    return program;
};


export const contract_getMainStateInfo = async (walletCtx: AnchorWallet | undefined) => {
    if (!walletCtx) {
        return null
        // throw new WalletNotConnectedError();
    }

    const mainStateKey = await Keys.getMainStateKey();

    if (!(mainStateKey instanceof PublicKey)) {
        return null
        // throw new Error("Invalid mainStateKey: must be a PublicKey");
    }
    const mainStateInfo = await connection.getAccountInfo(mainStateKey);
    const program = getProgram(walletCtx);
    if (!mainStateInfo || !program) {
        return null;
    }
    
    // mainStateInfo = await program.account.mainState.fetch(mainStateKey);
    return await program.account.mainState.fetch(mainStateKey);
};

export const contract_isInitialized = async (walletCtx: AnchorWallet | undefined) => {
    const mainStateInfo = await contract_getMainStateInfo(walletCtx);
    return mainStateInfo?.initialized;
};

export const contract_initMainState = async (walletCtx: AnchorWallet | undefined) => {
    if (!walletCtx)
        throw new WalletNotConnectedError();

    const program = getProgram(walletCtx);
    const mainStateKey = await Keys.getMainStateKey();
    if (!(mainStateKey instanceof PublicKey) || !program) {
        throw new Error("Invalid mainStateKey or Program: must be a PublicKey");
    }

    const tx = new Transaction().add(
        await program.methods
            .initMainState()
            .accounts({
                mainState: mainStateKey, 
                owner: walletCtx.publicKey, 
                systemProgram: SystemProgram.programId
            })
            .instruction()
    );

    const txHash = await send(connection, walletCtx, tx);
    console.log('  initMainState txHash:', txHash);
};

export const contract_isPoolCreated = async (walletCtx: AnchorWallet | undefined, baseToken: string, quoteMint: PublicKey) => {
    if (!walletCtx) {
        console.error("Invalid wallet");
        return false
        // throw new WalletNotConnectedError();
    }

    try {
        const baseMint = new PublicKey(baseToken);
        const poolStateKey = await Keys.getPoolStateKey(baseMint, quoteMint);

        const program = getProgram(walletCtx);
        if (!(poolStateKey instanceof PublicKey) || !program) {
            console.error("Invalid poolStateKey or Program: must be a PublicKey");
            return false
        }
        const poolStateInfo = await program.account.poolState.fetch(poolStateKey);
        return poolStateInfo ? true : false;
    } catch (err) {
        console.error(err);
        return false;
    }
};

export const contract_createPoolTx = async (walletCtx: AnchorWallet | undefined, baseToken: string, baseAmount: number, quoteMint: PublicKey, quoteAmount: number) => {
    if (!walletCtx) {
        console.error("Invalid wallet");
        return null
        // throw new WalletNotConnectedError();
    }

    const creator = walletCtx.publicKey;
    const program = getProgram(walletCtx);
    const mainStateKey = await Keys.getMainStateKey();
    
    if (!(mainStateKey instanceof PublicKey) || !program) {
        console.error("Invalid mainStateKey or Program: must be a PublicKey");
        return null
    }

    const baseMint = new PublicKey(baseToken);
    if (!baseMint || !quoteMint)
        throw new Error("Invalid token");
    
    const baseMintDecimals = TOKEN_DECIMALS;
    const quoteMintDecimals = 9;
    const baseBalance = new BN(Math.floor(baseAmount * (10 ** baseMintDecimals)));
    const quoteBalance = new BN(Math.floor(quoteAmount * (10 ** quoteMintDecimals)));
    const creatorBaseAta = getAssociatedTokenAddressSync(baseMint, creator);
    const creatorQuoteAta = getAssociatedTokenAddressSync(quoteMint, creator);
    const poolStateKey = await Keys.getPoolStateKey(baseMint, quoteMint);
    if (!(poolStateKey instanceof PublicKey)) {
        console.error("Invalid poolStateKey: must be a PublicKey");
        return null
    }
    const reserverBaseAta = getAssociatedTokenAddressSync(baseMint, poolStateKey, true);
    const reserverQuoteAta = getAssociatedTokenAddressSync(quoteMint, poolStateKey, true);
    const ix = await program.methods
        .createPool({ baseAmount: baseBalance, quoteAmount: quoteBalance })
        .accounts({
            creator, 
            mainState: mainStateKey, 
            poolState: poolStateKey, 
            baseMint, 
            quoteMint, 
            creatorBaseAta, creatorQuoteAta, 
            reserverBaseAta, reserverQuoteAta,
            systemProgram: SystemProgram.programId, 
            tokenProgram: TOKEN_PROGRAM_ID, 
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
        })
        // .preInstructions([web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 })]);
        .instruction();

    return ix;
};

export const contract_buyTx = async (walletCtx: AnchorWallet | undefined, baseToken: string, solAmount: number) => {
    if (!walletCtx) {
        console.error("Invalid wallet");
        throw new WalletNotConnectedError();
    }

    const buyer = walletCtx.publicKey;
    const program = getProgram(walletCtx);
    const mainStateKey = await Keys.getMainStateKey();
    if (!(mainStateKey instanceof PublicKey) || !program) {
        throw new Error("Invalid mainStateKey or Program: must be a PublicKey");
    }
    const mainStateInfo = await program.account.mainState.fetch(mainStateKey);
    if (!mainStateInfo) {
        throw new Error("Failed to fetch mainState!");
    }

    const baseMint = new PublicKey(baseToken);
    const quoteMint = new PublicKey(NATIVE_MINT);
    if (!baseMint || !quoteMint)
        throw new Error("Invalid token");

    const poolStateKey = await Keys.getPoolStateKey(baseMint, quoteMint);
    if (!(poolStateKey instanceof PublicKey)) {
        throw new Error("Invalid poolStateKey: must be a PublicKey");
    }
    
    const quoteMintDecimals = 9;
    const balance = new BN(Math.floor(solAmount * (10 ** quoteMintDecimals)));
    const buyerBaseAta = getAssociatedTokenAddressSync(baseMint, buyer);
    const buyerQuoteAta = getAssociatedTokenAddressSync(quoteMint, buyer);
    const reserverBaseAta = getAssociatedTokenAddressSync(baseMint, poolStateKey, true);
    const reserverQuoteAta = getAssociatedTokenAddressSync(quoteMint, poolStateKey, true);
    // @ts-ignore
    const feeQuoteAta = getAssociatedTokenAddressSync(quoteMint, mainStateInfo.feeRecipient);
    
    const ix = await program.methods
        .buy(balance)
        .accounts({
            baseMint, quoteMint, 
            buyer, buyerBaseAta, buyerQuoteAta, 
            mainState: mainStateKey, 
            poolState: poolStateKey,
            // @ts-ignore
            feeRecipient: mainStateInfo.feeRecipient, feeQuoteAta, 
            reserverBaseAta, reserverQuoteAta, 
            systemProgram: SystemProgram.programId, 
            tokenProgram: TOKEN_PROGRAM_ID, 
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
        })
        // .preInstructions([web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 })]);
        .instruction();

    return ix;
};

export const contract_sellTx = async (walletCtx: AnchorWallet | undefined, baseToken: string, sellAmount: number) => {
    if (!walletCtx) {
        console.error("Invalid wallet");
        throw new WalletNotConnectedError();
    }

    const seller = walletCtx.publicKey;
    const program = getProgram(walletCtx);
    const mainStateKey = await Keys.getMainStateKey();
    if (!(mainStateKey instanceof PublicKey) || !program) {
        throw new Error("Invalid mainStateKey or Program: must be a PublicKey");
    }
    const mainStateInfo = await program.account.mainState.fetch(mainStateKey);
    if (!mainStateInfo) {
        throw new Error("Failed to fetch mainState!");
    }

    const baseMint = new PublicKey(baseToken);
    const quoteMint = new PublicKey(NATIVE_MINT);
    if (!baseMint || !quoteMint) {
        throw new Error("Invalid token");
    }
    const poolStateKey = await Keys.getPoolStateKey(baseMint, quoteMint);
    if (!(poolStateKey instanceof PublicKey)) {
        throw new Error("Invalid poolStateKey: must be a PublicKey");
    }
    
    const baseMintDecimals = TOKEN_DECIMALS;
    const sellBalance = new BN(Math.floor(sellAmount * (10 ** baseMintDecimals)));
    const sellerBaseAta = getAssociatedTokenAddressSync(baseMint, seller);
    const sellerQuoteAta = getAssociatedTokenAddressSync(quoteMint, seller);
    const reserverBaseAta = getAssociatedTokenAddressSync(baseMint, poolStateKey, true);
    const reserverQuoteAta = getAssociatedTokenAddressSync(quoteMint, poolStateKey, true);
    // @ts-ignore
    const feeQuoteAta = getAssociatedTokenAddressSync(quoteMint, mainStateInfo.feeRecipient);
    
    const ix = await program.methods
        .sell(sellBalance)
        .accounts({
            mainState: mainStateKey,
            poolState: poolStateKey,
            baseMint, quoteMint,
            seller, sellerBaseAta, sellerQuoteAta,
            reserverBaseAta, reserverQuoteAta,
            // @ts-ignore
            feeRecipient: mainStateInfo.feeRecipient, feeQuoteAta, 
            systemProgram: SystemProgram.programId, 
            tokenProgram: TOKEN_PROGRAM_ID, 
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
        })
        // .preInstructions([web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 })]);
        .instruction();

    return ix;
};

export const contract_updateMainStateInfo = async (walletCtx: AnchorWallet | undefined, owner: string, feeRecipient: string, tradingFee: number) => {
    if (!walletCtx) throw new WalletNotConnectedError();

    let newOwner = null;
    let newFeeRecipient = null;
    let newTradingFee = null;
    
    const address1 = new PublicKey(owner);
    if (!address1) throw new Error('Invalid owner address!');
    newOwner = address1;
    
    const address2 = new PublicKey(feeRecipient);
    if (!address2) throw new Error('Invalid fee recipient address!');
    newFeeRecipient = address2;
    
    const tmpFee = Math.trunc(tradingFee * FEE_PRE_DIV);
    newTradingFee = new BN(tmpFee);

    const program = getProgram(walletCtx);
    const mainStateKey = await Keys.getMainStateKey();
    if (!(mainStateKey instanceof PublicKey) || !program) {
        throw new Error("Invalid mainStateKey or Program: must be a PublicKey");
    }
    const tx = new Transaction().add(
        await program.methods.updateMainState({
            owner: newOwner, 
            feeRecipient: newFeeRecipient, 
            tradingFee: newTradingFee
        })
        .accounts({
            owner: walletCtx.publicKey, 
            mainState: mainStateKey
        })
        .instruction()
    );

    const txHash = await send(connection, walletCtx, tx);
    console.log('  updateMainState txHash:', txHash);
};

export const contract_isPoolComplete = async (walletCtx: AnchorWallet | undefined, baseToken: string, quoteMint: PublicKey) => {
    if (!walletCtx) {
        console.error("Invalid wallet");
        return false;
    }

    const baseMint = new PublicKey(baseToken);
    if (!baseMint || !quoteMint) {
        console.error("Invalid token");
        return false;
    }
    const poolStateKey = await Keys.getPoolStateKey(baseMint, quoteMint);
    const program = getProgram(walletCtx);
    if (!(poolStateKey instanceof PublicKey) || !program) {
        console.error("Invalid poolStateKey or Program: must be a PublicKey");
        return false
    }
    const poolStateInfo = await program.account.poolState.fetch(poolStateKey);

    return poolStateInfo?.complete;
};

export const contract_withdraw2Tx = async (walletCtx: AnchorWallet | undefined, baseToken: string) => {
    if (!walletCtx) {
        console.error("Invalid wallet");
        throw new WalletNotConnectedError();
    }

    const admin = walletCtx.publicKey;
    const program = getProgram(walletCtx);
    const mainStateKey = await Keys.getMainStateKey();
    if (!(mainStateKey instanceof PublicKey) || !program) {
        throw new Error("Invalid mainStateKey or Program: must be a PublicKey");
    }
    const mainStateInfo = await program.account.mainState.fetch(mainStateKey);
    if (!mainStateInfo) {
        throw new Error("Failed to fetch mainState!");
    }

    const owner = mainStateInfo.owner;

    const baseMint = new PublicKey(baseToken);
    const quoteMint = new PublicKey(NATIVE_MINT);
    if (!baseMint || !quoteMint) {
        throw new Error("Invalid token");
    }

    const poolStateKey = await Keys.getPoolStateKey(baseMint, quoteMint);
    if (!(poolStateKey instanceof PublicKey)) {
        throw new Error("Invalid poolStateKey: must be a PublicKey");
    }
    const poolStateInfo = await program.account.poolState.fetch(poolStateKey);
    if (!poolStateInfo)
        throw new Error("Failed to fetch poolState!");
    
    const reserverBaseAta = getAssociatedTokenAddressSync(baseMint, poolStateKey, true);
    const reserverQuoteAta = getAssociatedTokenAddressSync(quoteMint, poolStateKey, true);
    const adminBaseAta = getAssociatedTokenAddressSync(baseMint, admin);
    const adminQuoteAta = getAssociatedTokenAddressSync(quoteMint, admin);
    
    const ix = await program.methods
        .withdraw()
        .accounts({
            admin,
            // @ts-ignore
            owner, 
            mainState: mainStateKey, 
            poolState: poolStateKey, 
            baseMint, quoteMint, 
            reserverBaseAta, reserverQuoteAta, 
            adminBaseAta, adminQuoteAta, 
            systemProgram: SystemProgram.programId, 
            tokenProgram: TOKEN_PROGRAM_ID, 
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
        })
        // .preInstructions([web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 })]);
        .instruction();

    return ix;
};
