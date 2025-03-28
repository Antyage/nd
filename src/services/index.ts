import { AuthService } from "./auth.service";

export const authService = new AuthService(`${import.meta.env.VITE_PUBLIC_BACKEND_URL}/auth`);
