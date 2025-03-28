import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { UserCircleIcon } from "@heroicons/react/20/solid";
import { useLogin } from "../hooks/auth/useLogin";
import { useLogout } from "../hooks/auth/useLogout";
import useIsMounted from "./useIsMounted";
import { DATATYPE_LASTTOKEN, DATATYPE_LASTTRADE } from "../engine/consts";
import DialogModal from "./dialogModal";

export const Header = () => {
  const navigate = useNavigate();
  const wallet = useAnchorWallet();
  const { login } = useLogin();
  const { logout } = useLogout();

  const mounted = useIsMounted();

  const [ws, setWs] = useState<WebSocket | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const div1Ref = useRef<HTMLDivElement | null>(null);
  const div2Ref = useRef<HTMLDivElement | null>(null);
  const [lastTokenInfo, setLastTokenInfo] = useState(null);
  const [lastTradeInfo, setLastTradeInfo] = useState(null);
  const baseURL = `${import.meta.env.VITE_PUBLIC_SOCKET_URL}`;

  useEffect(() => {
    if (wallet?.publicKey !== null)
      login(wallet?.publicKey.toBase58());
    if (!wallet) logout();
  }, [wallet]);

  useEffect(() => {
    const websocket = new WebSocket(baseURL);
    setWs(websocket);
    websocket.onopen = () => {
      console.log("websocket opened!");
    };

    websocket.onmessage = (event) => {
      console.log("websocket onmessage!");
      const data = JSON.parse(atob(event.data)).message;

      if (data.type === DATATYPE_LASTTOKEN) setLastTokenInfo(data.data);
      else if (data.type === DATATYPE_LASTTRADE) {
        setLastTradeInfo(data.data);
        getCheckoutStatus();
      }
    };
  }, []);

  const getCheckoutStatus = () => {
    if (div1Ref.current) {
      if (div1Ref.current.classList.contains("animate-shake") === true)
        div1Ref.current.classList.remove("animate-shake");
      else div1Ref.current.classList.add("animate-shake");

      if (div2Ref.current && div2Ref.current.classList.contains("animate-shake") === true)
        div2Ref.current.classList.remove("animate-shake");
      else if (div2Ref.current) div2Ref.current.classList.add("animate-shake");
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 sm:mb-8 md:mb-12 px-4 md:px-[58px] pt-4 md:pt-7 gap-4">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <img
          className="h-[80px] sm:h-[100px] md:h-[114px] object-contain cursor-pointer"
          alt="Nodump Logo"
          src="/logo.svg"
          onClick={() => navigate("/")}
        />
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center">
            <div
              className="text-white text-lg hover:underline hover:font-bold sm:text-xl px-4 py-2 rounded-md transition-colors"
              onClick={() => setIsDialogOpen(true)}>
              [How it works]
            </div>
            {/* <Link
              to="/create"
              className="text-white text-lg sm:text-xl  hover:underline hover:font-bold px-4 py-2 rounded-md transition-colors"
            >
              [Create]
            </Link> */}
          </div>
          <div className="flex items-center gap-4">
            {/* <Link
              to="/token"
              className="text-white text-lg sm:text-xl  hover:underline hover:font-bold px-4 py-2 rounded-md transition-colors"
            >
              [Token]
            </Link> */}
            <div className="flex items-center gap-3">
              <a
                href="https://"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white transition-colors"
              >
                <img
                  width={20}
                  height={20}
                  alt="telegram"
                  src="/telegram-logo.webp"
                />
              </a>
              <a
                href="https://"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white transition-colors"
              >
                <img
                  width={20}
                  height={20}
                  alt="x"
                  src="/x-logo.webp"
                />
              </a>
              <a
                href="https://"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white transition-colors"
              >
                <img
                  width={20}
                  height={20}
                  alt="instagram"
                  src="/instagram-logo.webp"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="text-white text-lg sm:text-xl font-medium flex">
        {/* [Connect Wallet] */}
        {mounted && <WalletMultiButton style={{backgroundColor: 'transparent'}} />}
        {wallet?.publicKey !== null && (
          <Link to={`/profile/${wallet?.publicKey.toBase58()}`}>
            <UserCircleIcon className="size-12 fill-white" />
          </Link>
        )}
      </div>
      <DialogModal 
        isDialogOpen={isDialogOpen} 
        setIsDialogOpen={setIsDialogOpen}
      />
    </div>
  );
};