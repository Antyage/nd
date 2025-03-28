import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { WalletProviders } from "./contexts/WalletContext";
import ContractContextProvider from "./contexts/ContractContext";
import { Board } from "./pages/board/Board";
import { Create } from "./pages/create/Create";
import { TokenPage } from "./pages/token";
import { Profile } from "./pages/profile";

createRoot(document.getElementById("app") as HTMLElement).render(
    <>
        <WalletProviders>
            <ContractContextProvider>
                <StrictMode>
                    <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Board />} />
                        <Route path="/create" element={<Create />} />
                        <Route path="/token/:id" element={<TokenPage />} />
                        <Route path="/profile/:id" element={<Profile />} />
                    </Routes>
                    </BrowserRouter>
                </StrictMode>
            </ContractContextProvider>
        </WalletProviders>
        <ToastContainer
            autoClose={5000}
            hideProgressBar
            pauseOnHover={false}
            pauseOnFocusLoss={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
        />
    </>
);