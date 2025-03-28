import React, { Children, FC, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
    LedgerWalletAdapter,
    WalletConnectWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';

import "@solana/wallet-adapter-react-ui/styles.css";

export const WalletProviders: FC<{ children: React.ReactNode }> = ({ children }) => {
    const network = WalletAdapterNetwork.Devnet;

    const endpoint = 'https://long-proportionate-scion.solana-mainnet.quiknode.pro/0edef4ae521901a7ce414dce4dc9f70f398af1a7/';

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new TorusWalletAdapter(),
            new LedgerWalletAdapter(),
            new WalletConnectWalletAdapter({ 
                network, 
                options: { 
                    projectId: '785f34dec460ea10d77f92ab7df4883b', 
                    relayUrl: 'wss://relay.walletconnect.com', 
                    metadata: {
                        name: 'NoDump',
                        description: 'No dump',
                        url: 'https://nodump.io',
                        icons: ['https://nodump.io/icon.png']
                    }
                } 
            }),
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                    {/* <WalletMultiButton />
                    <WalletDisconnectButton /> */}
                    { /* Your app's components go here, nested within the context providers. */ }
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};