import { useState, useRef, useEffect } from "react";
import { useMedia } from "react-use";
import { useLocation } from "react-router-dom";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, Transaction, PublicKey } from '@solana/web3.js'
import { NATIVE_MINT } from '@solana/spl-token'
import {
  Token,
  TokenAmount,
  TOKEN_PROGRAM_ID
} from "@raydium-io/raydium-sdk";
import { toast } from "react-toastify";
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import ProgressBar from "../../components/ui/progressbar";
import clsx from 'clsx'
import { Link } from "react-router-dom";
import { format } from "date-fns"
import Chart from "../../components/tradingview";
import { getToken, getThreadData, reply, mentionReply, trade, getTradeHistory, getMarketId } from "../../api/token";
import { swap } from "../../engine/swap";
import { getUserId } from "../../utils";
import { useContract } from "../../contexts/ContractContext";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Header } from "../../components/Header";
import { TOKEN_DECIMALS } from "../../engine/consts";
import { Config } from "../../engine/config";
import { send, jitoSend } from "../../engine/utils";
import { connection } from "../../engine/config";

const ProgressTheme = {
  base: 'bg-[#141414] rounded-full',
  size: {
    'sm': 'h-2'
  },
  color: {
    'white': 'bg-white'
  }
}

interface ContractContextType {
  isPoolCreated: (baseToken: string, quoteMint: PublicKey) => Promise<boolean>;
  getBuyTx: (token: string, amount: number) => Promise<any>;
  getSellTx: (token: string, amount: number) => Promise<any>;
  isPoolComplete: (baseToken: string, quoteMint: PublicKey) => Promise<boolean>;
  getWithdraw2Tx: (baseToken: string) => Promise<any>;
}

export const TokenPage = (): JSX.Element => {
  // const { query } = useRouter();
  // const { addr } = query;
  const location = useLocation();
  const addr = location.pathname.split("/")[2];

  const walletCtx = useAnchorWallet();
  const { isPoolComplete: isPoolCompleted } = useContract() as ContractContextType;

  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false)
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false)
  const [isSlippageDialogOpen, setIsSlippageDialogOpen] = useState(false)
  const [currentMode, setCurrentMode] = useState('buy')
  const [currentTab, setCurrentTab] = useState('Thread')
  const [amount, setAmount] = useState(0)
  interface TokenInfo {
    name: string;
    ticker: string;
    desc: string;
    logo: string;
    twitter: string;
    telegram: string;
    website: string;
    cdate: Date;
    marketCap: number;
    virtLiq: number;
    walletAddr: string;
    username: string;
    avatar: string;
    tokenBalance: number;
    solBalance: number;
    replies: number;
    bondingCurveProgress: number;
    kingOfTheHillProgress: number;
    crownDate: Date;
    tokensAvailableForSale: number;
    realQuoteReserve: number;
    tokenHolderDistribution: any[];
    hardcap: number;
    kingcap: number;
  }

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [currentCoin, setCurrentCoin] = useState('sol')
  const [threadData, setThreadData] = useState<any[] | null>(null);
  const [tradeHistory, setTradeHistory] = useState<any[] | null>(null);
  const [postType, setPostType] = useState('normal')
  const [mentionReplyId, setMentionReplyId] = useState('')
  const [chartType, setChartType] = useState('pump chart')
  const [isMobile, setIsMobile] = useState(false)
  const [isBook, setIsBook] = useState(false)
  const below600 = useMedia('(max-width: 600px)')
  const below800 = useMedia('(max-width: 800px)')
  const [isPoolComplete, setIsPoolComplete] = useState(false)

  const [visibleSection, setVisibleSection] = useState('buy-sell');
  const [activeButton, setActiveButton] = useState('buy-sell');

  const handleButtonClick = (section: string) => {
    setVisibleSection(section);
    setActiveButton(section);
  };

  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth > 640);
    };
    // Set the initial state
    handleResize();
    // Add event listener for window resize
    window.addEventListener('resize', handleResize);
    // Cleanup the event listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (addr !== undefined) {
        getTokenInfo()
        getThreadInfo()
        getTradeHistoryInfo()
      }
    }, 5000)
    return () => clearInterval(interval);
  }, [addr])

  useEffect(() => {
    if (walletCtx?.publicKey !== null)
      checkCompleted()
  }, [walletCtx])

  useEffect(() => {
    setIsMobile(below600)
  }, [below600])
  useEffect(() => {
    setIsBook(below800)
  }, [below800])

  useEffect(() => {
    if (addr !== undefined) {
      getTokenInfo()
      if (currentTab === 'Thread')
        getThreadInfo()
      else
        getTradeHistoryInfo()
      checkCompleted()
    }
  }, [addr, currentTab, walletCtx?.publicKey])

  const checkCompleted = async () => {
    if (walletCtx?.publicKey !== null && addr !== undefined) {
      const result = await isPoolCompleted(addr, NATIVE_MINT)
      setIsPoolComplete(result)
    }
  }

  const getTradeHistoryInfo = async () => {
    const result = await getTradeHistory(addr)
    setTradeHistory(result)
  }

  const getTokenInfo = async () => {
    const userId = getUserId()
    // console.log("addr === ", addr, "userId === ", userId) 
    const result = await getToken(addr, userId)
    // const result = await getToken(addr, "6793c433b41e179bb177a97a")
    // console.log("tokenInfo === ", result)
    setTokenInfo(result)
  }

  const getThreadInfo = async () => {
    if (walletCtx?.publicKey) {
      const userId = getUserId()
      const result = await getThreadData(addr, userId)
      // console.log(result)
      setThreadData(result)
    }
  }

  const onChangeAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (Number(e.target.value) < 0) return;
    setAmount(Number(e.target.value));
  };

  const onTrade = () => {
    if (!walletCtx) {
      toast.error('No Wallet Connected!');
      return;
    }

    if (Number(amount) == 0) {
      toast.warning('Please input amount');
      return;
    }

    if (currentMode === 'buy') {
      if (tokenInfo?.solBalance || 0 < amount) {
        toast.error('Insufficient balance!');
        return;
      }
    } else {
      if (tokenInfo?.tokenBalance || 0 < amount) {
        toast.error('Insufficient balance!');
        return;
      }
    }

    setIsTradeDialogOpen(true);
  };

  const handleReply = async (comment: React.RefObject<HTMLTextAreaElement>, imageFile: File | null) => {
    if (!walletCtx) {
      toast.error("Please connect wallet!")
      return
    }
    if (comment.current && comment.current.value === '') {
      toast.error("Please add a comment!")
      return
    }

    await reply(addr, comment.current!.value, imageFile)
    getThreadInfo()
    setIsPostDialogOpen(false)
  }

  const handleMentionReply = async (replyMentionId: string, comment: React.RefObject<HTMLTextAreaElement>, imageFile: File | null) => {
    if (!walletCtx) {
      toast.error("Please connect wallet!")
      return
    }
    if (comment.current!.value === '') {
      toast.error("Please add a comment!")
      return
    }

    await mentionReply(replyMentionId, comment.current!.value, imageFile)
    getThreadInfo()
    setIsPostDialogOpen(false)
  }






  // Chart y-axis labels data
  const yAxisLabels = [
    { value: "90k", top: 0 },
    { value: "80k", top: 45 },
    { value: "70k", top: 90 },
    { value: "60k", top: 135 },
    { value: "50k", top: 180 },
    { value: "40k", top: 225 },
    { value: "30k", top: 270 },
    { value: "20k", top: 315 },
    { value: "10k", top: 360 },
    { value: "0k", top: 405 },
  ];

  // Chart horizontal grid lines
  const gridLines = [
    { top: 242 },
    { top: 288 },
    { top: 332 },
    { top: 378 },
    { top: 422 },
    { top: 468 },
    { top: 512 },
    { top: 558 },
    { top: 602 },
    { top: 648 },
  ];

  // Chart bars data (blue for increase, red for decrease)
  const chartBars = [
    { left: "20%", top: 558, height: 91, color: "#32ccee", width: 18 },
    {
      left: "25%",
      top: 496,
      height: 91,
      color: "#32ccee",
      width: 18,
      isImage: true,
    },
    { left: "30%", top: 474, height: 91, color: "#32ccee", width: 18 },
    { left: "35%", top: 467, height: 91, color: "#32ccee", width: 18 },
    { left: "40%", top: 371, height: 46, color: "#32ccee", width: 18 },
    { left: "45%", top: 344, height: 46, color: "#32ccee", width: 18 },
    { left: "50%", top: 496, height: 46, color: "#32ccee", width: 18 },
    { left: "55%", top: 214, height: 139, color: "#32ccee", width: 18 },
    { left: "60%", top: 382, height: 148, color: "#32ccee", width: 18 },
    { left: "65%", top: 261, height: 148, color: "#32ccee", width: 18 },
    { left: "70%", top: 542, height: 46, color: "#ee2424", width: 18 },
    { left: "75%", top: 478, height: 46, color: "#ee2424", width: 18 },
    { left: "80%", top: 484, height: 46, color: "#ee2424", width: 18 },
    {
      left: "85%",
      top: 300,
      height: 105,
      color: "#32ccee",
      width: 18,
      isImage: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#100425] flex flex-col justify-center w-full">
      <div className="w-full mx-auto relative min-h-screen">
        {/* Header with Logo and Connect Wallet */}
        <Header />
        {/* <div className="relative w-full min-h-screen p-4 sm:p-6 md:p-8"> */}
          {/* Background gradient */}
          <div className="fixed w-[650px] h-[650px] top-[476px] right-0 md:right-[50px] rounded-[324.87px] rotate-[-6.23deg] blur-[350px] [background:linear-gradient(133deg,rgba(220,0,211,1)_54%,rgba(12,250,245,1)_100%)] opacity-50 md:opacity-100" />

          {/* <div className="relative z-10 flex flex-col lg:flex-row gap-6 sm:gap-8 md:gap-12">
            <Card className="flex-grow basis-full lg:basis-2/3 min-h-[20rem] sm:min-h-[30rem] rounded-[25px] shadow-[-6px_4px_10px_#00000040] backdrop-blur-[70px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(70px)_brightness(100%)] border-0">
              <CardContent className="p-0 h-full relative">
                <div className="absolute w-8 sm:w-11 h-[420px] top-[31px] left-[12px] sm:left-[21px]">
                  {yAxisLabels.map((label, index) => (
                    <div
                      key={index}
                      className="absolute [font-family:'Inter',Helvetica] font-bold text-[#868b93] text-[10px] sm:text-xs tracking-[0] leading-[normal]"
                      style={{
                        top: `${label.top}px`,
                        left: index === 9 ? "4px" : index === 8 ? "2px" : "0",
                      }}
                    >
                      {label.value}
                    </div>
                  ))}
                </div>

                <div className="absolute left-[3rem] sm:left-[4.5rem] right-2 sm:right-4 top-[31px] bottom-4">
                  {gridLines.map((line, index) => (
                    <div
                      key={index}
                      className="absolute w-full h-px bg-[#868b9359]"
                      style={{ top: `${line.top - 242}px` }}
                    />
                  ))}

                  {chartBars.map((bar, index) =>
                    bar.isImage ? (
                      <img
                        key={index}
                        className="absolute"
                        alt="Rectangle"
                        src="/rectangle-29.svg"
                        style={{
                          width: `${bar.width}px`,
                          height: `${bar.height}px`,
                          top: `${bar.top - 242}px`,
                          left: bar.left,
                        }}
                      />
                    ) : (
                      <div
                        key={index}
                        className="absolute"
                        style={{
                          width: `${bar.width}px`,
                          height: `${bar.height}px`,
                          top: `${bar.top - 242}px`,
                          left: bar.left,
                          backgroundColor: bar.color,
                        }}
                      />
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="flex-grow basis-full lg:basis-1/3 min-h-[20rem] sm:min-h-[30rem] rounded-[25px] shadow-[-6px_4px_10px_#00000040] backdrop-blur-[70px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(70px)_brightness(100%)] border-0">
              <CardContent className="p-4 sm:p-6 flex flex-col items-center h-full">
                <div className="text-center [font-family:'Inter',Helvetica] font-bold text-[#32ccee] text-base sm:text-[19px] tracking-[0] leading-[normal] mb-8 sm:mb-12">
                  Token Name
                </div>

                <div className="w-full mb-4">
                  <div className="[font-family:'Inter',Helvetica] font-bold text-white text-base sm:text-[19px] tracking-[0] leading-[normal] mb-2">
                    Amount (SOL)
                  </div>
                  <div className="relative">
                    <Input
                      className="w-full h-[46px] bg-[#868b9359] rounded-[10px] border border-solid border-[#7f678d] [font-family:'Inter',Helvetica] font-bold text-white text-base sm:text-[19px] px-3"
                      defaultValue="3"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="[font-family:'Inter',Helvetica] font-bold text-white text-base sm:text-[19px]">
                        SOL
                      </span>
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[url(/group-1.png)] bg-[100%_100%]">
                        <img
                          className="w-[16px] sm:w-[19px] h-3 sm:h-4 mt-1.5 ml-1"
                          alt="Group"
                          src="/group.png"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full mb-6 sm:mb-8 relative">
                  <Input
                    className="w-full h-[46px] bg-[#868b9359] rounded-[10px] border border-solid border-[#7f678d] [font-family:'Inter',Helvetica] font-bold text-[#ffffff80] text-base sm:text-[19px] px-3"
                    defaultValue="95031332"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 [font-family:'Inter',Helvetica] font-bold text-white text-base sm:text-[19px] tracking-[0] leading-[normal]">
                    Tokens
                  </div>
                </div>

                <Button className="w-full sm:w-[186px] h-[41px] bg-[#32ee80] rounded-xl [font-family:'Inter',Helvetica] font-bold text-white text-base sm:text-[19px] hover:bg-[#2bd972]">
                  Place Trade
                </Button>

                <div className="mt-auto pt-6">
                  <div className="[font-family:'Inter',Helvetica] font-medium text-[#ffffff80] text-[10px] tracking-[0] leading-[normal] whitespace-nowrap text-center mb-1">
                    Observation &amp; Disclaimer:
                  </div>
                  <div className="w-full [font-family:'Inter',Helvetica] font-normal text-[#ffffff80] text-[10px] text-center tracking-[0] leading-4">
                    Nodump ensures that users cannot sell their coins during the
                    pre-launch phase. This safeguards againstrug pulls, protecting
                    investors and fostering trust. By preventing premature sales,
                    Nodump accelerates the process of launching coins securely and
                    efficiently.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div> */}
        {/* </div> */}
        
        



        <div className={`section ${(visibleSection === 'buy-sell' || isLargeScreen) ? 'active' : 'hidden'} flex justify-between py-2 ml-2 items-center bg-black`}>
          <div className='flex flex-row w-full gap-4 max-sm:hidden'>
            <span className='text-sm text-[#808080]'>{tokenInfo?.name}</span>
            <span className='text-sm text-[#808080]'>Ticker: {tokenInfo?.ticker}</span>
            <span className='text-sm text-green-300'>Market cap: ${tokenInfo?.marketCap.toFixed(2)}</span>
            <span className='text-sm text-green-300'>Virtual liquidity: ${tokenInfo?.virtLiq !== null ? tokenInfo?.virtLiq.toFixed(0) : '9,737'}</span>
            <div className="flex items-center text-[#C0C0C0]">
              <label htmlFor="copy-ca">CA:</label>
              <input
                id="copy-ca"
                className="py-0.5 px-1 ml-2 block w-full border border-gray-700 rounded-s-sm text-sm focus-visible:outline-1 focus-visible:outline-dashed disabled:opacity-50 disabled:pointer-events-none bg-black/10"
                readOnly
                type="text"
                value={addr}
              />
              <button
                className="cursor-pointer bg-black/20 px-2 py-0.5 inline-flex items-center min-w-fit rounded-e-sm border border-s-0 border-gray-700 text-sm !text-[#808080] hover:bg-black/40 focus-visible:outline-1 focus-visible:outline"
                onClick={() => {
                  const inputElement = document.getElementById('copy-ca') as HTMLInputElement | null;
                  const inputValue = inputElement ? inputElement.value : '';
                  navigator.clipboard.writeText(inputValue);
                  alert('Content copied to clipboard');
                }}
              >
                copy
              </button>
            </div>
          </div>
          {/* <div className='flex gap-2 hidden sm:inline-flex'>
          <p className='text-sm text-green-300'>created by</p>
          {tokenInfo?.avatar !== null && tokenInfo?.avatar !== undefined && (
            <img
              src={`${import.meta.env.VITE_PUBLIC_AVATAR_URL}/${tokenInfo?.avatar}`}
              width={12}
              height={12}
              alt=""
            />
          )}
          <Link href={`/profile/${tokenInfo?.walletAddr}`} className={`text-sm text-white hover:underline bg-green-300 rounded`}>{tokenInfo?.username}</Link>
        </div> */}
        </div>
        <section className='z-10 flex flex-col sm:flex-row font-sans'>
          <div className={`section ${(visibleSection === 'buy-sell' || isLargeScreen) ? 'active' : 'hidden'} z-10 flex sm:hidden flex-col w-full border-l-2 border-[#282828] bg-black`}>
            <p className='text-sm text-green-300 ml-4 mt-2'>Market cap: ${tokenInfo?.marketCap.toFixed(2)}</p>
            <div className="flex items-center p-2 mx-2 text-[#C0C0C0]">
              <label htmlFor="copy-ca">CA:</label>
              <input
                id="copy-ca"
                className="py-0.5 px-1 ml-2 block w-full border border-gray-700 rounded-s-sm text-sm focus-visible:outline-1 focus-visible:outline-dashed disabled:opacity-50 disabled:pointer-events-none bg-black/10"
                readOnly
                type="text"
                value={addr}
              />
              <button
                className="cursor-pointer bg-black/20 px-2 py-0.5 inline-flex items-center min-w-fit rounded-e-sm border border-s-0 border-gray-700 text-sm !text-[#808080] hover:bg-black/40 focus-visible:outline-1 focus-visible:outline"
                onClick={() => {
                  const inputElement = document.getElementById('copy-ca') as HTMLInputElement | null;
                  const inputValue = inputElement ? inputElement.value : '';
                  navigator.clipboard.writeText(inputValue);
                  alert('Content copied to clipboard');
                }}
              >
                copy
              </button>
            </div>
            <div className="flex flex-col p-4 bg-[#121212] rounded-xl m-3">
              {/*<div className='flex gap-2'>
                <div className='relative w-full'>
                  <button type="button" className={clsx('rounded-md text-base text-center py-3 uppercase w-full', currentMode === 'buy' ? 'bg-green-400 text-black font-bold' : 'bg-transparent text-[#808080]')} onClick={() => setCurrentMode('buy')}>buy</button>
                </div>
                <div className='relative w-full'>
                  <button type="button" className={clsx('rounded-md text-base text-center py-3 uppercase w-full', currentMode === 'sell' ? 'bg-red-400 text-black font-bold' : 'bg-transparent text-[#808080]')} onClick={() => setCurrentMode('sell')}>sell</button>
                </div>
              </div>*/}
              <div className='flex flex-col gap-3 pt-6'>
                <div className='flex flex-row-reverse'>
                  {/* <button type='button' className={clsx('bg-[#363636] rounded-full px-4 py-[10px] text-sm text-white', currentMode === 'buy' ? 'visible' : 'invisible')} onClick={() => {
                  if (currentCoin === 'sol')
                    setCurrentCoin(tokenInfo?.ticker)
                  else
                    setCurrentCoin('sol')
                }}>switch to {currentCoin === 'sol' ? tokenInfo?.ticker : 'SOL'}</button> */}
                  <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setIsSlippageDialogOpen(true)}>Set max slippage</button>
                </div>
                <div className='relative'>
                  <input value={amount} onChange={onChangeAmount} type='text' className='border-gray-200 border-2 text-white p-2 w-full bg-transparent rounded placeholder-white' placeholder='0.0' />
                  {currentMode === 'buy' ? (
                    <div className='absolute right-4 inset-y-4 flex items-center gap-[10px]'>
                      <p className='text-sm text-white uppercase'>{currentCoin === 'sol' ? 'SOL' : tokenInfo?.ticker}</p>
                      <img
                        className='rounded-full'
                        src={currentCoin === 'sol' ? '/sol.png' : tokenInfo?.logo}
                        width={34}
                        height={34}
                        alt="sol"
                      />
                    </div>
                  ) : (
                    <div className='absolute right-4 inset-y-4 flex items-center gap-[10px]'>
                      <p className='text-sm text-white uppercase'>{tokenInfo?.ticker}</p>
                      <img
                        className='rounded-full'
                        src={tokenInfo?.logo}
                        width={34}
                        height={34}
                        alt="coin"
                      />
                    </div>
                  )}
                </div>
                {currentMode === 'buy' ? (
                  <div className='flex gap-1'>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount(0)}>reset</button>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount(1)}>1 SOL</button>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount(5)}>5 SOL</button>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount(10)}>10 SOL</button>
                  </div>
                ) : (
                  <div className='flex gap-1'>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount(0)}>reset</button>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount((tokenInfo?.tokenBalance || 0) / 4)}>25%</button>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount((tokenInfo?.tokenBalance || 0) / 2)}>50%</button>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount(((tokenInfo?.tokenBalance || 0) / 4) * 3)}>75%</button>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount(tokenInfo?.tokenBalance || 0)}>100%</button>
                  </div>
                )}
                <button type='button' className="bg-green-400 rounded-md py-2 text-black text-base font-bold mt-2" onClick={onTrade}>Place trade</button>
              </div>
            </div>
          </div>

          <div className='z-10 flex flex-col w-full px-1'>
            {isPoolComplete === true && (
              <div className='flex items-center gap-2 bg-[#86efac] p-4 rounded-md w-fit'>
                <p className='text-black text-xl'>raydium pool seeded! view the coin on raydium</p>
                <a href={`https://dexscreener.com/solana/${addr}`} target='_blank' className='text-xl font-medium hover:underline text-[#6cc9c6]'>here</a>
              </div>
            )}
            {isPoolComplete === true && (
              <div className='flex gap-2 pb-2'>
                <div className={clsx('rounded-md text-base px-2 py-1 cursor-pointer', chartType === 'pump chart' ? 'bg-[#86efac] text-black' : 'text-white')} onClick={() => setChartType('pump chart')}>Pump chart</div>
                <div className={clsx('rounded-md text-base px-2 py-1 cursor-pointer', chartType === 'current chart' ? 'bg-[#86efac] text-black ' : 'text-white')} onClick={() => setChartType('current chart')}>Current chart</div>
              </div>
            )}
            {/* Luka: show on chart */}
            {addr !== undefined && tokenInfo !== null && chartType === 'pump chart' && (visibleSection === 'chart' || isLargeScreen) && (
              <Chart stock={"Stock"} interval="1" width="100%" height="100%" tokenId={addr} symbol={tokenInfo?.ticker + "/Pump"} />
            )}
            {chartType === 'current chart' && (
              <iframe className={`w-full h-[600px]`} src={`https://dexscreener.com/solana/${addr}?embed=1&theme=dark&trades=0&info=0`}></iframe>
            )}
            <div className='flex flex-col gap-[17px] px-2 sm:px-10 sm:py-6'>
              <div className='sm:flex sm:gap-6 hidden'>
                <button type='button' className={clsx('text-base', currentTab === 'Thread' ? 'font-bold text-white' : 'text-[#808080]')} onClick={() => setCurrentTab('Thread')}>Thread</button>
                <button type='button' className={clsx('text-base', currentTab === 'Trades' ? 'font-bold text-white' : 'text-[#808080]')} onClick={() => setCurrentTab('Trades')}>Trades</button>
              </div>
              {(currentTab === 'Thread' && isLargeScreen) || (visibleSection === 'buy-sell' && !isLargeScreen) ? (
                <div className='flex flex-col gap-1'>
                  <div className='flex flex-col gap-[10px] p-1 bg-[#121212] rounded-sm'>
                    <div className='flex gap-1 items-center'>
                      <img
                        src={(tokenInfo?.avatar !== null && tokenInfo?.avatar !== undefined) ? `${import.meta.env.VITE_PUBLIC_AVATAR_URL}/${tokenInfo?.avatar}` : '/logo.png'}
                        width={16}
                        height={16}
                        alt=""
                      />
                      <Link to={`/profile/${tokenInfo?.walletAddr}`} className='bg-green-300 rounded-[4px] text-sm px-1 hover:underline !text-black'>{tokenInfo?.username}</Link>
                      {/* <p className='text-xs text-[#808080]'>{format(new Date(tokenInfo?.cdate), "MM/dd/yyyy, HH:mm:ss")}</p> */}
                    </div>
                    <div className='flex gap-[22px]'>
                      {tokenInfo?.logo !== null && (
                        <img
                          className='h-fit rounded-md'
                          src={tokenInfo?.logo}
                          width={128}
                          height={128}
                          alt=""
                        />
                      )}
                      <div className='flex flex-col'>
                        <div className='flex flex-row gap-4'>
                          <p className='text-sm text-white flex flex-col'>
                            <span className='font-bold'>{`${tokenInfo?.name} (ticker: ${tokenInfo?.ticker})`}</span>
                            <span className='text-[#808080]'>{tokenInfo?.desc}</span>
                          </p>
                          
                          <img
                            src="/sol.png"
                            width={24}
                            height={24}
                            alt=""
                            className='mb-auto'
                          />
                        </div>
                        {/* <div className='flex flex-col'>
                          <p className='text-sm text-white'>Create by: <span className='text-[#808080]'>{tokenInfo?.username}</span></p>
                          <p className='text-sm text-white'>Market cap: <span className='text-[#808080]'>{(tokenInfo?.marketCap / 1000).toFixed(2)}k</span></p>
                          <p className='text-sm text-white'>Replies: <span className='text-[#808080]'>{tokenInfo?.replies}</span></p>
                        </div> */}
                      </div>
                    </div>
                  </div>
                  {threadData !== null && threadData.map((item, index) => {
                    return (
                      <div key={index} className='flex flex-col gap-2 p-1 bg-[#121212] rounded-sm'>
                        <div className='flex gap-1 items-center'>
                          <img
                            src={(item.avatar !== null && item.avatar !== undefined) ? `${import.meta.env.VITE_PUBLIC_AVATAR_URL}/${item.avatar}` : '/logo.png'}
                            width={16}
                            height={16}
                            alt=""
                          />
                          <Link to={`/profile/${item.walletAddr}`} className='bg-green-300 rounded-[4px] text-sm px-1 hover:underline !text-black'>{item.username}</Link>
                          <p className='text-xs text-[#808080]'>{format(new Date(item.cdate), "MM/dd/yyyy, HH:mm:ss")}</p>
                          {/* <div className='flex gap-2 items-center'>
                          <div className='cursor-pointer' onClick={async () => {
                            if (item.liked === true)
                              await dislikeReply(item.replyMentionId)
                            else
                              await likeReply(item.replyMentionId)
                            getThreadInfo()
                          }}>
                            <svg width="16" height="16" viewBox="0 0 15 15" fill="#ef4444" xmlns="http://www.w3.org/2000/svg"><path d="M1.35248 4.90532C1.35248 2.94498 2.936 1.35248 4.89346 1.35248C6.25769 1.35248 6.86058 1.92336 7.50002 2.93545C8.13946 1.92336 8.74235 1.35248 10.1066 1.35248C12.064 1.35248 13.6476 2.94498 13.6476 4.90532C13.6476 6.74041 12.6013 8.50508 11.4008 9.96927C10.2636 11.3562 8.92194 12.5508 8.00601 13.3664C7.94645 13.4194 7.88869 13.4709 7.83291 13.5206C7.64324 13.6899 7.3568 13.6899 7.16713 13.5206C7.11135 13.4709 7.05359 13.4194 6.99403 13.3664C6.0781 12.5508 4.73641 11.3562 3.59926 9.96927C2.39872 8.50508 1.35248 6.74041 1.35248 4.90532Z" fill={item.liked === true ? '#ef4444' : 'white'} fillRule="evenodd" clipRule="evenodd"></path></svg>
                          </div>
                          <p className='text-xs text-[#808080]'>{item.likes}</p>
                          <p className='text-xs text-[#808080] cursor-pointer hover:underline' onClick={() => {
                            setMentionReplyId(item.replyMentionId)
                            setIsPostDialogOpen(true)
                          }}>#{item.replyMentionId}</p>
                        </div> */}
                          {item.buySell === 1 && (
                            <p className='flex gap-1 items-center text-green-300'>
                              {`bought ${item.quoteAmount} SOL`}
                            </p>
                          )}
                          {item.buySell === 2 && (
                            <p className='flex gap-1 items-center text-red-600'>
                              {`sold ${item.baseAmount}${tokenInfo?.ticker}`}
                            </p>
                          )}
                        </div>
                        <div className='flex gap-[22px]'>
                          {item.image !== null && (
                            <img
                              className='h-fit rounded-md'
                              src={`${import.meta.env.VITE_PUBLIC_IMAGE_URL}/${item.image}`}
                              width={128}
                              height={128}
                              alt=""
                            />
                          )}
                          <p className='text-sm text-white'>{item.comment}</p>
                        </div>
                      </div>
                    )
                  })}
                  <p className='flex text-xl font-semibold hover:underline cursor-pointer w-fit m-auto' onClick={() => {
                    setMentionReplyId('')
                    setIsPostDialogOpen(true)
                  }}>
                    [Post a reply]
                  </p>
                </div>
              ) : (visibleSection === 'transactions' || isLargeScreen) && (
                // Luka: show on txs
                <table className="w-full text-[#808080] text-sm">
                  <thead className="border-2 border-[#282828]">
                    <tr>
                      <th className="py-2 text-center align-middle">account</th>
                      <th className="py-2 text-center align-middle">type</th>
                      <th className="py-2 text-center align-middle">SOL</th>
                      <th className="py-2 text-center align-middle">{tokenInfo?.ticker || 'Token'}</th>
                      {isLargeScreen && <th className="py-2 text-center align-middle">Time</th>}
                      {isLargeScreen == true ?
                        <th className="py-2 text-center align-middle">transaction</th> : <th className="py-2 text-center align-middle">txn</th>}

                    </tr>
                  </thead>
                  <tbody>
                    {tradeHistory === null ? (
                      <tr>
                        <td colSpan={6} className="text-center text-white py-4 align-middle">
                          No data
                        </td>
                      </tr>
                    ) : tradeHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-white py-4 align-middle">
                          No data
                        </td>
                      </tr>
                    ) : (
                      tradeHistory.map((item, index) => (
                        <tr key={index} className="!bg-[#121212] border-2 border-[#282828]">
                          <td className="flex items-center justify-center my-3 sm:px-3 text-center align-middle">
                            <div className="image rounded-full overflow-hidden">
                              <img
                                width={16}
                                height={16}
                                src={item.avatar ? `${import.meta.env.VITE_PUBLIC_AVATAR_URL}/${item.avatar}` : "/logo.png"}
                                alt="avatar"
                              />
                            </div>
                            <Link
                              to={`/profile/${item.walletAddr}`}
                              className="px-1 bg-white rounded-[4px] text-sm text-black"
                            >
                              {item.username}
                            </Link>
                          </td>
                          <td className="px-3 text-center align-middle">
                            <span className={item.isBuy ? "text-green-300" : "text-red-600"}>
                              {item.isBuy ? "Buy" : "Sell"}
                            </span>
                          </td>
                          <td className="text-center align-middle">{item.quoteAmount?.toFixed(4)}</td>
                          <td className="text-center align-middle">
                            {item.baseAmount >= 1000000
                              ? `${(item.baseAmount / 1000000).toFixed(2)}m`
                              : item.baseAmount >= 1000
                                ? `${(item.baseAmount / 1000).toFixed(2)}k`
                                : item.baseAmount.toFixed(2)}
                          </td>
                          {isLargeScreen &&
                            <td className="text-center align-middle">
                              {new Date(item.date).toLocaleString()}
                            </td>}
                          <td className="text-center align-middle flex justify-center">
                            <a
                              href={`https://solscan.io/tx/${item.txhash}`}
                              target="_blank"
                              className="text-sm hover:underline"
                            >
                              {isLargeScreen == true ?
                                item.txhash?.substr(0, 6) :
                                <svg
                                  width="15"
                                  height="15"
                                  viewBox="0 0 15 15"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="text-gray-400"
                                >
                                  <path
                                    d="M3 2C2.44772 2 2 2.44772 2 3V12C2 12.5523 2.44772 13 3 13H12C12.5523 13 13 12.5523 13 12V8.5C13 8.22386 12.7761 8 12.5 8C12.2239 8 12 8.22386 12 8.5V12H3V3L6.5 3C6.77614 3 7 2.77614 7 2.5C7 2.22386 6.77614 2 6.5 2H3ZM12.8536 2.14645C12.9015 2.19439 12.9377 2.24964 12.9621 2.30861C12.9861 2.36669 12.9996 2.4303 13 2.497L13 2.5V2.50049V5.5C13 5.77614 12.7761 6 12.5 6C12.2239 6 12 5.77614 12 5.5V3.70711L6.85355 8.85355C6.65829 9.04882 6.34171 9.04882 6.14645 8.85355C5.95118 8.65829 5.95118 8.34171 6.14645 8.14645L11.2929 3H9.5C9.22386 3 9 2.77614 9 2.5C9 2.22386 9.22386 2 9.5 2H12.4999H12.5C12.5678 2 12.6324 2.01349 12.6914 2.03794C12.7504 2.06234 12.8056 2.09851 12.8536 2.14645Z"
                                    fill="currentColor"
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                  ></path>
                                </svg>}
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="z-10 flex flex-col sm:max-w-sm w-full border-l-2 border-t-2 border-[#282828] pb-20 bg-black">
            <div className="hidden sm:flex flex-col p-4">
              {/* <div className='flex gap-2'>
                <div className='relative w-full'>
                  <button type="button" className={clsx('rounded-md text-base text-center py-3 uppercase w-full border', currentMode === 'buy' ? 'bg-green-400 text-black font-bold' : 'bg-transparent text-[#808080]')} onClick={() => setCurrentMode('buy')}>buy</button>
                </div>
                <div className='relative w-full'>
                  <button type="button" className={clsx('rounded-md text-base text-center py-3 uppercase w-full border', currentMode === 'sell' ? 'bg-red-400 text-black font-bold' : 'bg-transparent text-[#808080]')} onClick={() => setCurrentMode('sell')}>sell</button>
                </div>
              </div> */}
              
              <div className='hidden sm:flex flex-col gap-3 pt-6'>
                <div className='flex flex-row-reverse'>
                  {/* <button type='button' className={clsx('bg-[#363636] rounded-full px-4 py-[10px] text-sm text-white', currentMode === 'buy' ? 'visible' : 'invisible')} onClick={() => {
                  if (currentCoin === 'sol')
                    setCurrentCoin(tokenInfo?.ticker)
                  else
                    setCurrentCoin('sol')
                }}>switch to {currentCoin === 'sol' ? tokenInfo?.ticker : 'SOL'}</button> */}
                  <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setIsSlippageDialogOpen(true)}>Set max slippage</button>
                </div>
                <div className='relative'>
                  <input value={amount} onChange={onChangeAmount} type='text' className='border-green-400 border-2 text-white p-2 w-full bg-transparent rounded placeholder-white' placeholder='0.0' />
                  {currentMode === 'buy' ? (
                    <div className='absolute right-4 inset-y-4 flex items-center gap-[10px]'>
                      <p className='text-sm text-white uppercase'>{currentCoin === 'sol' ? 'SOL' : tokenInfo?.ticker}</p>
                      <img
                        className='rounded-full'
                        src={currentCoin === 'sol' ? '/sol.png' : tokenInfo?.logo}
                        width={34}
                        height={34}
                        alt="sol"
                      />
                    </div>
                  ) : (
                    <div className='absolute right-4 inset-y-4 flex items-center gap-[10px]'>
                      <p className='text-sm text-white uppercase'>{tokenInfo?.ticker}</p>
                      <img
                        className='rounded-full'
                        src={tokenInfo?.logo}
                        width={34}
                        height={34}
                        alt="coin"
                      />
                    </div>
                  )}
                </div>
                {currentMode === 'buy' ? (
                  <div className='flex gap-1'>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount(0)}>reset</button>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount(1)}>1 SOL</button>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount(5)}>5 SOL</button>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount(10)}>10 SOL</button>
                  </div>
                ) : (
                  <div className='flex gap-1'>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount(0)}>reset</button>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount((tokenInfo?.tokenBalance || 0) / 4)}>25%</button>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount((tokenInfo?.tokenBalance || 0) / 2)}>50%</button>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount(((tokenInfo?.tokenBalance || 0) / 4) * 3)}>75%</button>
                    <button type='button' className='bg-[#363636] px-4 py-1 rounded-md text-sm text-white' onClick={() => setAmount(tokenInfo?.tokenBalance || 0)}>100%</button>
                  </div>
                )}
                <button type='button' className="bg-green-400 rounded-md py-2 text-black text-base font-bold mt-2" onClick={onTrade}>Place trade</button>
              </div>
            </div>
            <div className='flex justify-center gap-9 py-5 mx-auto bg-[#121212] border-t-2 border-r-2 border-b-2 border-[#282828] w-full sm:block'>
              {tokenInfo?.twitter !== null && (
                <a href={`${tokenInfo?.twitter}`} target='_blank' className='flex justify-center items-center gap-2'>
                  <p className='text-sm font-semibold text-white'>Twitter</p>
                  <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.4932 14.5713L10.8025 7.91176L10.2722 7.15858L6.91672 2.39479L6.63872 2H2.51562L3.52121 3.42805L7.98264 9.76281L8.51295 10.5152L12.0976 15.605L12.3757 15.9994H16.4988L15.4932 14.5713ZM12.8657 15.0879L9.14154 9.80001L8.61123 9.04729L4.28969 2.91142H6.1486L9.64345 7.87364L10.1738 8.62636L14.7246 15.0878H12.8657V15.0879Z" fill="white" />
                    <path d="M8.61175 9.047L9.14206 9.79971L8.51335 10.5148L3.68954 15.9989H2.5L7.98304 9.7624L8.61175 9.047Z" fill="white" />
                    <path d="M16.0034 2L10.8036 7.91176L10.1748 8.62636L9.64453 7.87364L10.2732 7.15858L13.7956 3.15211L14.8139 2H16.0034Z" fill="white" />
                  </svg>
                </a>
              )}
              {tokenInfo?.telegram !== null && (
                <a href={`${tokenInfo?.telegram}`} target='_blank' className='flex justify-center items-center gap-2'>
                  <p className='text-sm font-semibold text-white'>Telegram</p>
                  <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.4053 2.49219L2 8.31948V9.16179L6.12586 10.4355L7.43071 14.6217L8.47232 14.6215L10.1517 12.9033L13.6968 15.5072L14.3868 15.2446L17 2.9913L16.4053 2.49219ZM13.669 14.3961L9.00003 10.9667L8.47965 11.6751L9.4362 12.3777L8.07747 13.7426L7.0113 10.3222L13.1867 6.63502L12.7361 5.88029L6.46982 9.6217L3.43831 8.68586L15.9677 3.61745L13.669 14.3961Z" fill="white" />
                  </svg>
                </a>
              )}
              {tokenInfo?.website !== null && (
                <a href={`${tokenInfo?.website}`} target='_blank' className='flex justify-center items-center gap-2'>
                  <p className='text-sm font-semibold text-white'>Website</p>
                  <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.5 0.5625C7.83122 0.5625 6.19992 1.05735 4.81238 1.98448C3.42484 2.9116 2.34338 4.22936 1.70477 5.77111C1.06616 7.31286 0.899065 9.00936 1.22463 10.6461C1.55019 12.2828 2.35378 13.7862 3.53379 14.9662C4.7138 16.1462 6.21721 16.9498 7.85393 17.2754C9.49064 17.6009 11.1871 17.4338 12.7289 16.7952C14.2706 16.1566 15.5884 15.0752 16.5155 13.6876C17.4427 12.3001 17.9375 10.6688 17.9375 9C17.935 6.76301 17.0452 4.61837 15.4634 3.03658C13.8816 1.45479 11.737 0.565031 9.5 0.5625ZM9.5 16.3125C8.33844 16.3125 7.12232 14.8151 6.51875 12.375H12.4813C11.8777 14.8151 10.6616 16.3125 9.5 16.3125ZM6.29038 11.25C6.06988 9.7581 6.06988 8.2419 6.29038 6.75H12.7096C12.8212 7.49478 12.8765 8.24691 12.875 9C12.8765 9.75309 12.8212 10.5052 12.7096 11.25H6.29038ZM2.1875 9C2.18791 8.23587 2.30864 7.47657 2.54525 6.75H5.16088C4.94638 8.24233 4.94638 9.75767 5.16088 11.25H2.54525C2.30864 10.5234 2.18791 9.76413 2.1875 9ZM9.5 1.6875C10.6616 1.6875 11.8777 3.18488 12.4813 5.625H6.51875C7.12232 3.18488 8.33844 1.6875 9.5 1.6875ZM13.8391 6.75H16.4548C16.9316 8.2121 16.9316 9.7879 16.4548 11.25H13.8391C13.9458 10.5047 13.9996 9.75286 14 9C13.9996 8.24714 13.9458 7.49526 13.8391 6.75ZM15.9806 5.625H13.6366C13.3863 4.40157 12.8955 3.24004 12.1927 2.20781C13.8229 2.85795 15.1666 4.07012 15.9806 5.625ZM6.80732 2.20781C6.10451 3.24004 5.6137 4.40157 5.36338 5.625H3.01944C3.83345 4.07012 5.17711 2.85795 6.80732 2.20781ZM3.01944 12.375H5.36338C5.6137 13.5984 6.10451 14.76 6.80732 15.7922C5.17711 15.142 3.83345 13.9299 3.01944 12.375ZM12.1927 15.7922C12.8955 14.76 13.3863 13.5984 13.6366 12.375H15.9806C15.1666 13.9299 13.8229 15.142 12.1927 15.7922Z" fill="white" />
                  </svg>
                </a>
              )}
            </div>
            <div className={`section ${(visibleSection === 'information' || isLargeScreen) ? 'active' : 'hidden'} flex flex-col gap-4 p-6`}>                 {/* Luka: show on info */}
              <div className='flex gap-[22px] items-center'>
                <img
                  src={tokenInfo?.logo}
                  className='rounded-md'
                  width={128}
                  height={128}
                  alt=""
                />
                <div className='flex flex-col gap-2'>
                  <div className='flex flex-row gap-2'>
                    <p className='text-base font-bold text-white'>{tokenInfo?.name} [ticker: {tokenInfo?.ticker}]</p>
                    <img
                      src="/sol.png"
                      width={24}
                      height={24}
                      alt=""
                      className='h-6 w-6'
                    />
                  </div>
                  <div className='flex flex-col'>
                    <p className='text-sm text-white'>Create by: <span className='text-[#808080]'>{tokenInfo?.username}</span></p>
                    <p className='text-sm text-white'>Market cap: <span className='text-[#808080]'>{((tokenInfo?.marketCap || 0) / 1000).toFixed(2)}k</span></p>
                    {/* <p className='text-sm text-white'>Market cap: <span className='text-[#808080]'>${tokenInfo?.marketCap.toFixed(2)}</span></p> */}
                    <p className='text-sm text-white'>Replies: <span className='text-[#808080]'>{tokenInfo?.replies}</span></p>
                  </div>
                </div>
              </div>
              <div className='flex flex-col gap-2'>
                <p className='text-sm text-white font-medium'>bonding curve progress: {tokenInfo?.bondingCurveProgress.toFixed(1)}%</p>
                {/* <Progress progress={tokenInfo!.bondingCurveProgress} size="sm" color="white" theme={ProgressTheme} /> */}
                <ProgressBar value={tokenInfo?.bondingCurveProgress} className="h-2" />
              </div>
              <p className='text-xs font-medium text-[#808080]'>
                when the market cap reaches ${tokenInfo?.hardcap?.toFixed(0)} all the liquidity from the bonding curve will be deposited into Raydium and burned. progression increases as the price goes up.
                <br />
                <br />
                there are {isPoolComplete ? 0 : (tokenInfo?.tokensAvailableForSale !== null ? tokenInfo?.tokensAvailableForSale.toFixed(0) : '751,404,142')} tokens still available for sale in the bonding curve and there is {isPoolComplete ? 0 : (tokenInfo?.realQuoteReserve !== null ? tokenInfo?.realQuoteReserve.toFixed(4) : '1,213')} SOL in the bonding curve.
              </p>
              <div className='flex flex-col gap-2'>
                {tokenInfo?.crownDate ? (
                  <p className='text-base text-[#ffff00] font-medium'>Crowned king of the hill on {tokenInfo?.crownDate?.toLocaleDateString()}</p>
                ) : (
                  <>
                    <p className='text-sm text-white font-medium'>king of the hill progress: {tokenInfo?.kingOfTheHillProgress.toFixed(1)}%</p>
                    {/* <Progress progress={tokenInfo!.kingOfTheHillProgress} size="sm" color="white" theme={ProgressTheme} /> */}
                    <ProgressBar value={tokenInfo?.kingOfTheHillProgress} className="h-2" />
                    <p className='text-xs font-medium text-[#808080]'>
                      dethrone the current king at a ${tokenInfo?.kingcap?.toFixed(0)} mcap
                    </p>
                  </>
                )}
              </div>
              {/* <div className='text-base font-bold text-white border-b border-dotted border-[#282828] w-fit'>Crowned king of the hill on 17:19:57 15/05/2024</div> */}
              <div className='flex flex-col gap-3'>
                <p className='text-base font-semibold text-white'>Holder distribution</p>
                <div className='flex flex-col gap-2 text-sm text-white/[.80]'>
                  {tokenInfo?.tokenHolderDistribution.map((item, index) => {
                    return (
                      <div key={index} className='flex justify-between'>
                        <a href={`https://solscan.io/account/${item.walletAddr}`} target='_blank' className='hover:underline'>{index + 1}. {item.username} {item.bio === null ? '' : `(${item.bio})`}</a>
                        <p>{item.holdPercent.toFixed(2)}%</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="sm:hidden md:relative fixed bottom-0 z-10 w-full flex justify-around border-t-2 border-gray-200 py-4 bg-[#5c5f66]">
            <button className={`text-sm px-4 py-2 font-sans ${activeButton === 'information' ? 'text-white font-semibold' : 'text-black'
              }`}
              onClick={() => handleButtonClick('information')}>
              [info]
            </button>
            <button className={`text-sm px-4 py-2 font-sans ${activeButton === 'chart' ? 'text-white font-semibold' : 'text-black'
              }`}
              onClick={() => handleButtonClick('chart')}>
              [chart]
            </button>
            <button className={`text-sm px-4 py-2 font-sans ${activeButton === 'buy-sell' ? 'text-white font-semibold' : 'text-black'
              }`}
              onClick={() => handleButtonClick('buy-sell')}>
              [buy/sell]
            </button>
            <button className={`text-sm px-4 py-2 font-sans ${activeButton === 'transactions' ? 'text-white font-semibold' : 'text-black'
              }`}
              onClick={() => handleButtonClick('transactions')}>
              [txs]
            </button>
          </div>
          <PostDialog isPostDialogOpen={isPostDialogOpen} setIsPostDialogOpen={setIsPostDialogOpen} handleReply={handleReply} mentionReplyId={mentionReplyId} handleMentionReply={handleMentionReply} />
          <TradeDialog isTradeDialogOpen={isTradeDialogOpen} setIsTradeDialogOpen={setIsTradeDialogOpen} tokenMint={addr} ticker={tokenInfo?.ticker || ''} amount={amount} isBuy={currentMode === 'buy'} />
          <SlippageDialog isSlippageDialogOpen={isSlippageDialogOpen} setIsSlippageDialogOpen={setIsSlippageDialogOpen} />
        </section>
      </div>
    </div>
  );
};

function PostDialog({
  isPostDialogOpen,
  setIsPostDialogOpen,
  handleReply,
  mentionReplyId,
  handleMentionReply,
}: {
  isPostDialogOpen: boolean;
  setIsPostDialogOpen: (value: boolean) => void;
  handleReply: (comment: React.RefObject<HTMLTextAreaElement>, imageFile: File | null) => void;
  mentionReplyId: string;
  handleMentionReply: (replyMentionId: string, comment: React.RefObject<HTMLTextAreaElement>, imageFile: File | null) => void;
}) {
  const comment = useRef<HTMLTextAreaElement | null>(null)
  const [imageName, setImageName] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  return (
    <Transition appear show={isPostDialogOpen}>
      <Dialog as="div" className='relative z-30 focus:outline-none' onClose={() => setIsPostDialogOpen(false)}>
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 bg-black/80">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 transform-[scale(95%)]"
              enterTo="opacity-100 transform-[scale(100%)]"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 transform-[scale(100%)]"
              leaveTo="opacity-0 transform-[scale(95%)]"
            >
              <DialogPanel className="flex flex-col gap-5 p-5 w-full max-w-xl rounded-xl bg-[#030303] border border-white backdrop-blur-2xl">
                <div className="flex flex-col gap-2 w-full">
                  <p className='text-2xl font-bold text-black'>Add a comment</p>
                  <textarea ref={comment} className="w-full h-[160px] rounded-md px-6 py-4 border border-white text-[#808080] bg-[#121212] text-base resize-none" placeholder='Comment'></textarea>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <p className='text-2xl font-bold text-white'>Image (Optional)</p>
                  <div className='relative'>
                    <label htmlFor="postImage" className='absolute right-4 inset-y-3.5'>
                      <div className="bg-white rounded-md p-3 text-xs text-black cursor-pointer">Choose Image</div>
                      <input id='postImage' type='file' className='hidden' accept='image/*' onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setImageName(e.target.files[0].name)
                          setImageFile(e.target.files[0])
                        }
                        else {
                          setImageName('')
                          setImageFile(null)
                        }
                      }} />
                    </label>
                    <input type="text" className="w-full h-[69px] rounded-md px-6 border border-white text-[#808080] bg-[#121212] text-base" placeholder='Choose Image' value={imageName} disabled />
                  </div>
                </div>
                <div className='flex flex-col gap-3 items-center'>
                  <button type='button' className='bg-green-400 rounded-md w-full h-[50px] text-xl text-black font-bold' onClick={() => {
                    if (mentionReplyId === '')
                      handleReply(comment, imageFile)
                    else
                      handleMentionReply(mentionReplyId, comment, imageFile)
                  }}>Post Reply</button>
                  <button type='button' className='rounded-xl h-[50px] text-xl text-white hover:font-bold' onClick={() => setIsPostDialogOpen(false)}>[Cancel]</button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

function TradeDialog({ isTradeDialogOpen, setIsTradeDialogOpen, tokenMint, ticker, amount, isBuy }: { 
  isTradeDialogOpen: boolean; 
  setIsTradeDialogOpen: (value: boolean) => void; 
  tokenMint: string; 
  ticker: string; 
  amount: number; 
  isBuy: boolean; 
}) {
  const comment = useRef<HTMLTextAreaElement | null>(null)
  const walletCtx = useAnchorWallet();
  const {
    isPoolCreated,
    getBuyTx,
    getSellTx,
    isPoolComplete,
    getWithdraw2Tx
  } = useContract() as ContractContextType;

  const onTrade = async () => {
    if (!walletCtx) {
      toast.error('No Wallet Connected!');
      return;
    }

    const isPoolCompleted = await isPoolComplete(tokenMint, NATIVE_MINT);
    if (isPoolCompleted) {
      // swap on Raydium
      const id = toast.loading(`Trading '${ticker}'...`);

      try {
        let inputTokenAmount;
        let outputToken;

        if (isBuy) {
          inputTokenAmount = new TokenAmount(Token.WSOL, BigInt(Math.trunc(Number(amount) * LAMPORTS_PER_SOL)));
          outputToken = new Token(TOKEN_PROGRAM_ID, tokenMint, TOKEN_DECIMALS);
        }
        else {
          inputTokenAmount = new TokenAmount(new Token(TOKEN_PROGRAM_ID, tokenMint, TOKEN_DECIMALS),
            BigInt(Math.trunc(Number(amount) * (10 ** TOKEN_DECIMALS))));
          outputToken = Token.WSOL;
        }

        const marketId = await getMarketId(tokenMint, Token.WSOL.mint.toBase58());
        // console.log('marketId:', marketId);
        const txHashes = await swap(walletCtx, inputTokenAmount, outputToken, new PublicKey(marketId), isBuy);
        toast.dismiss(id);

        if (txHashes.length === 0) {
          toast.error('Swap failed!');
          return;
        }

        toast.success('Swap complete!');

        // await trade(tokenMint, isBuy,
        //   isBuy ? 0 : Number(amount), // To do - cryptoprince
        //   isBuy ? Number(amount) : 0, // To do - cryptoprince
        //   txHashes[0], 
        //   comment.current.value
        // );

        setIsTradeDialogOpen(false);
      } catch (err) {
        console.error(err);
        toast.dismiss(id);
        if (err instanceof Error) {
          toast.error(err.message);
        } else {
          toast.error('An unknown error occurred.');
        }
      }

      return;
    }

    const created = await isPoolCreated(tokenMint, NATIVE_MINT);
    if (!created) {
      toast.error(`Pool not created for token '${tokenMint}'`);
      return;
    }

    const id = toast.loading(`Trading ${ticker}...`);

    try {
      let tx = null;

      if (isBuy)
        tx = new Transaction().add(await getBuyTx(tokenMint, Number(amount)));
      else
        tx = new Transaction().add(await getSellTx(tokenMint, Number(amount)));
      
      const txHash = import.meta.env.VITE_PUBLIC_IS_MAINNET === "true" ? await jitoSend(connection, tx, walletCtx, parseFloat(Config.JITO_FEE)) : await send(connection, walletCtx, tx);
      toast.dismiss(id);
      if (txHash === "") {
        toast.error('Trade failed!');
        return;
      }

      let tokenAmount = 0
      await connection.getTransaction(txHash!).then((res) => {
        console.log("Rider result", res)
        if (isBuy) {
          if (res && res.meta && res.meta.postTokenBalances && res.meta.preTokenBalances) {
            const postAmount = res.meta.postTokenBalances[3]?.uiTokenAmount?.uiAmount || 0;
            const preAmount = res.meta.preTokenBalances[3]?.uiTokenAmount?.uiAmount || 0;
            tokenAmount = postAmount - preAmount;
          }
        } else {
          if (res && res.meta && res.meta.postBalances && res.meta.preBalances) {
            tokenAmount = (res.meta.postBalances[0] - res.meta.preBalances[0]) / LAMPORTS_PER_SOL;
          }
        }
      });

      console.log('tokenAmount:', tokenAmount);
      toast.success('Trade complete!');

      await trade(tokenMint, isBuy,
        isBuy ? Number(tokenAmount) : Number(amount), // To do - cryptoprince
        isBuy ? Number(amount) : Number(tokenAmount), // To do - cryptoprince
        txHash!,
        comment.current!.value
      );

      setIsTradeDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.dismiss(id);
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('An unknown error occurred.');
      }
    }
  };

  return (
    <Transition appear show={isTradeDialogOpen}>
      <Dialog as="div" className='relative z-30 focus:outline-none' onClose={() => setIsTradeDialogOpen(false)}>
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 bg-black/80">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 transform-[scale(95%)]"
              enterTo="opacity-100 transform-[scale(100%)]"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 transform-[scale(100%)]"
              leaveTo="opacity-0 transform-[scale(95%)]"
            >
              <DialogPanel className="flex flex-col gap-10 p-10 w-full max-w-xl rounded-xl bg-[#030303] border border-white backdrop-blur-2xl">
                <div className='flex flex-col gap-6'>
                  <div className="flex flex-col gap-2">
                    <p className='text-2xl font-bold text-white'>Add a comment</p>
                    <textarea ref={comment as React.RefObject<HTMLTextAreaElement>} className="w-full h-[160px] rounded-md px-6 py-4 border border-white text-[#808080] bg-[#121212] text-base resize-none" placeholder='Comment'></textarea>
                  </div>
                  <p className='text-xl text-white'>
                    {isBuy ? (`Buy '${ticker}' with ${amount} SOL`) : (`Sell ${amount} '${ticker}'`)}
                  </p>
                </div>
                <div className='flex flex-col gap-3 items-center'>
                  <button type='button' className='bg-green-400 rounded-md w-full h-[50px] text-xl text-black font-bold' onClick={onTrade}>Place Trade</button>
                  <button type='button' className='rounded-md h-[50px] text-xl text-white hover:font-bold' onClick={() => setIsTradeDialogOpen(false)}>[Cancel]</button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

function SlippageDialog({ isSlippageDialogOpen, setIsSlippageDialogOpen }: { isSlippageDialogOpen: boolean; setIsSlippageDialogOpen: (value: boolean) => void }) {
  const slippage = useRef<HTMLInputElement | null>(null)

  return (
    <Transition appear show={isSlippageDialogOpen}>
      <Dialog as="div" className='relative z-30 focus:outline-none' onClose={() => setIsSlippageDialogOpen(false)}>
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 bg-black/80">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 transform-[scale(95%)]"
              enterTo="opacity-100 transform-[scale(100%)]"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 transform-[scale(100%)]"
              leaveTo="opacity-0 transform-[scale(95%)]"
            >
              <DialogPanel className="flex flex-col gap-10 p-10 w-full max-w-xl rounded-xl bg-[#030303] border border-white backdrop-blur-2xl">
                <div className='flex flex-col gap-6'>
                  <div className="flex flex-col gap-2">
                    <p className='text-2xl font-bold text-white'>Set max slippage (%)</p>
                    <input ref={slippage} type='number' className="w-full h-[58px] rounded-md px-6 py-4 border border-white text-[#808080] bg-[#121212] text-base resize-none" />
                  </div>
                  <p className='text-xl text-white'>This is the maximum amount of slippage you are willing to accept when placing trades</p>
                </div>
                <div className='flex flex-col gap-3 items-center'>
                  <button type='button' className='bg-green-400 rounded-md w-full h-[50px] text-xl font-bold text-black' onClick={() => setIsSlippageDialogOpen(false)}>Place Trade</button>
                  <button type='button' className='rounded-md h-[50px] text-xl text-white hover:font-bold' onClick={() => setIsSlippageDialogOpen(false)}>[Cancel]</button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}