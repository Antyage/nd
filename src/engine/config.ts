import { Connection, 
    clusterApiUrl
} from "@solana/web3.js";
import { 
    TxVersion, 
    MAINNET_PROGRAM_ID,
    DEVNET_PROGRAM_ID, 
    LOOKUP_TABLE_CACHE,
} from "@raydium-io/raydium-sdk";

const IS_MAINNET = import.meta.env.VITE_PUBLIC_IS_MAINNET || "";

const isMainNet = IS_MAINNET === "true";

export const networkUrl = !isMainNet 
    ? 'https://virulent-hidden-theorem.solana-devnet.quiknode.pro/ef28b01d86d88e6f746c46c3004728933d646816/' 
    : 'https://mainnet.helius-rpc.com/?api-key=b0436df3-87ca-4170-8ea4-6d757ec51f52';

export const PROGRAMIDS = isMainNet ? MAINNET_PROGRAM_ID : DEVNET_PROGRAM_ID;
export const BUNDLR_URL = isMainNet ? "https://node1.bundlr.network" : "https://devnet.bundlr.network";
export const addLookupTableInfo = isMainNet ? LOOKUP_TABLE_CACHE : undefined;
export const connection = new Connection(networkUrl, "confirmed");
export const makeTxVersion = TxVersion.V0; // LEGACY
export const Config = {
    BLOCK_ENGINE_URL: "tokyo.mainnet.block-engine.jito.wtf",
    JITO_FEE: "0.005"
}