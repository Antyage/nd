/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PUBLIC_BACKEND_URL: string;
    readonly VITE_PUBLIC_SOCKET_URL: string;
    readonly VITE_PUBLIC_AVATAR_URL: string;
    readonly VITE_API_URL: string;
    readonly VITE_PUBLIC_IS_MAINNET: string;
    readonly VITE_PUBLIC_IMAGE_URL: string;
}
  
interface ImportMeta {
    readonly env: ImportMetaEnv;
}