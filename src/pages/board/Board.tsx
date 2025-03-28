import { SearchIcon } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Header } from "../../components/Header";
import { findTokens } from "../../api/token/index";
import { Link } from "react-router-dom";

const sortType = [
  { id: 1, name: "Sort: bump order" },
  { id: 2, name: "Sort: last reply" },
  { id: 3, name: "Sort: reply count" },
  { id: 4, name: "Sort: market cap" },
  { id: 5, name: "Sort: creation time" },
];

const orderType = [
  { id: 1, name: "Order: Descending" },
  { id: 2, name: "Order: Ascending" },
];


export const Board = (): JSX.Element => {
  const [tokenList, setTokenList] = useState<any[]>([]);
  const searchTokenName = useRef<HTMLInputElement | null>(null);
  const [sortSelected, setSortSelected] = useState(sortType[0]);
  const [orderSelected, setOrderSelected] = useState(orderType[0]);
  const [includeNSFW, setIncludeNSFW] = useState(true);
  const tokenDiv = useRef<HTMLAnchorElement | null>(null);
  const [showAnimations, setShowAnimations] = useState(true);
  const showAnimationsRef = useRef(showAnimations);
  const [creatorWallet, setCreatorWallet] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 45;


  useEffect(() => {
    getTokenList(
      searchTokenName.current!.value,
      sortSelected.name,
      orderSelected.name,
      includeNSFW
    );
    // getKingToken();

    const interval = setInterval(() => {
      if (tokenDiv.current && showAnimationsRef.current === true) {
        if (tokenDiv.current.classList.contains("animate-shake") === true)
          tokenDiv.current.classList.remove("animate-shake");
        else tokenDiv.current.classList.add("animate-shake");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getTokenList = async (tokenName: string, sort: string, order: string, nsfw: boolean) => {
    const result = await findTokens(
      tokenName,
      sort,
      order,
      nsfw === true ? 1 : 0
    );
    // console.log("result === ", result)
    setTokenList(Array.isArray(result) ? result : []);
  };

  const handleCreatorClick = (e: any, walletAddr: string) => {
    e.stopPropagation();
    setCreatorWallet(walletAddr);
    setTimeout(() => {
      window.location.href = `/profile/${creatorWallet}`;
    }, 0);
  };


  // Data for coin cards
  const topCoins = [
    {
      id: 1,
      name: "MOON RULER",
      ticker: "Token Name (TICKER)",
      description: "Short Description Short Description Short Description",
      creator: "83r38r",
      marketCap: "100M",
      isTopRuler: true,
      hasDetails: true,
    },
    {
      id: 2,
      name: "MOON RULER",
      isTopRuler: true,
      hasDetails: false,
    },
    {
      id: 3,
      name: "MOON RULER",
      isTopRuler: true,
      hasDetails: false,
    },
  ];
  // Data for coin cards to enable mapping
  // const coinCards = Array(12).fill({
  //   name: "Coin Name",
  //   image: "/coin.png",
  // });

  // Calculate pagination
  const totalPages = Math.ceil(tokenList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCoins = tokenList.slice(startIndex, endIndex);
  
  return (
    <div className="bg-[#100425] flex flex-row justify-center w-full min-h-screen">
      <div className="bg-[#100425] w-full max-w-full h-min-screen relative overflow-hidden">
        <div className="absolute w-full md:w-[650px] h-[650px] top-[346px] left-0 md:left-[-54px] rounded-[324.87px] rotate-[-6.23deg] blur-[350px] [background:linear-gradient(180deg,rgb(220,0,211)_54.43%,rgb(12,250,245)_100%)]" />
        {/* Header with logo and wallet button */}
        <Header />

        {/* SearchIcon and Create New Coin section */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center px-4 md:px-[50px] mt-6 md:mt-[61px] gap-4">
          <div className="relative w-full md:w-[498px]">
            <Input
              ref={searchTokenName}
              className="h-[45px] pl-6 pr-12 rounded-[19px] text-lg md:text-xl text-[#787878] shadow-[-1px_-1px_4px_#00000040] border-none bg-transparent w-full"
              placeholder="Search"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  getTokenList(
                    searchTokenName.current!.value,
                    sortSelected.name,
                    orderSelected.name,
                    includeNSFW
                  );
                }
              }}
            />
            <button
              onClick={() => {
                getTokenList(
                  searchTokenName.current!.value,
                  sortSelected.name,
                  orderSelected.name,
                  includeNSFW
                );
              }}
            >
              <SearchIcon className="absolute w-[18px] h-[18px] top-3.5 right-4 text-[#787878]" />
            </button>
            
          </div>

          <a href="/create">
            <Button className="h-[45px] w-full md:w-[219px] rounded-[19px] [background:linear-gradient(180deg,rgb(220,0,211)_36.87%,rgb(12,250,245)_100%)] [font-family:'Inter',Helvetica] font-medium text-[#fcfbfb] text-lg md:text-xl shadow-[-1px_-1px_4px_#00000040]">
              Create New Coin
            </Button>
          </a>
        </div>

        {/* Coin cards grid */}
        <ScrollArea className="relative z-10 h-auto mx-4 md:mx-[50px] mt-6 md:mt-[40px]">
          {/* Top 3 Moon Rulers heading */}
          <h2 className="text-lg sm:text-xl italic font-semibold text-white mb-6 px-4 mt-6">
            Top 3 Moon Rulers
          </h2>
          {/* Top Moon Ruler Cards */}
          <div className="sm:grid sm:grid-cols-2 lg:grid-cols-3 md:gap-x-[66px] space-y-[40px] mb-4 sm:mb-6 items-baseline">
            {topCoins.map((coin) => (
              <Card
                key={coin.id}
                className="relative rounded-[19px] border-[1px] border-[#E056D7] bg-[#1A0B38]/60 backdrop-blur-sm min-h-32"
              >
                <CardContent className="p-0 h-full">
                  <div className="flex h-full">
                    <div className="relative h-full">
                      <img
                        className="rounded-[19px] object-cover"
                        alt="Coin"
                        width={128}
                        height={128}
                        src="/coin.png"
                      />
                      <div className="absolute bottom-0 left-0 w-4 h-4 bg-gradient-to-br from-[#E056D7] to-[#3AB0EA] transform rotate-45" />
                    </div>
                    <div className="flex-1 p-3 sm:p-4">
                      <div className="text-lg sm:text-[22px] font-bold text-[#95B2F1]">
                        {coin.name}
                      </div>
                      {coin.hasDetails && (
                        <div className="space-y-1 sm:space-y-1.5 mt-1 sm:mt-2">
                          <div className="text-white text-[12px] sm:text-[13px] italic font-semibold">
                            {coin.ticker}
                          </div>
                          <div className="text-white text-[12px] sm:text-[13px] italic font-semibold line-clamp-2">
                            {coin.description}
                          </div>
                          <div className="text-white text-[12px] sm:text-[13px] italic font-semibold">
                            Created by {coin.creator}
                          </div>
                          <div className="text-white text-[12px] sm:text-[13px] italic font-semibold">
                            Market Cap : {coin.marketCap}
                          </div>
                        </div>
                      )}
                      <img
                        className="absolute w-[80px] sm:w-[104px] h-[80px] sm:h-[104px] -top-4 sm:-top-10 -right-4 sm:-right-6 z-30"
                        alt="Astronaut"
                        src="/moonruler.png"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Gradient Devider */}
          <div className="relative h-[1px] mt-[35px] md:mb-[15px] mb-[35px] w-[95%] place-self-center bg-gradient-to-r from-[#E056D7] via-[#9B5CF3] to-[#3AB0EA] border-none" />
          {/* <div className="border-[1px] border-[#E056D7] h-[1px] my-6 w-[95%] place-self-center" /> */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 md:gap-x-[66px] gap-y-9 mb-9 mt-9 items-baseline">
            {Array.isArray(currentCoins) && currentCoins.map((item, index) => (
              <Card
                key={index}
                className="w-full min-h-32 bg-[#262634] rounded-[19px] shadow-[-1px_-1px_4px_#00000040] border-none relative"
              >
                <Link
                  key={index}
                  to={`/token/${item.mintAddr}`}
                  ref={index === 0 ? tokenDiv : undefined}
                >
                  <CardContent className="p-0 flex gap-2">
                    <div style={{ width: '128px', height: '128px', overflow: "hidden", minWidth: '128px'}}>
                      <img
                        className="rounded-[19px] object-fill"
                        style={{ width: '128px', height: '128px', visibility: 'visible' }}
                        alt="item"
                        src={item.logo}
                      />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex gap-2 items-center pt-3">
                        <p className={`text-sm text-blue-200 font-semibold`}>
                          Created by
                        </p>
                        <button
                          onClick={(e) => handleCreatorClick(e, item.walletAddr)}
                          className={`text-sm text-blue-200 font-semibold hover:underline`}
                        >
                          {item.username}
                        </button>
                        {/* <Link
                          to={`/profile/${item.walletAddr}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-sm text-blue-200 font-semibold hover:underline`}
                        >
                          {item.username}
                        </Link> */}
                        {/* <Image
                          src={
                            item.avatar === null
                              ? "/logo.png"
                              : `${process.env.NEXT_PUBLIC_AVATAR_URL}/${item.avatar}`
                          }
                          width={24}
                          height={24}
                          alt=""
                        /> */}
                      </div>
                      <p className={`text-sm text-green-300 font-bold`}>
                        market cap:<span className="text-green-300">&nbsp;{item.marketCap.toFixed(2)}K</span>
                      </p>
                      
                      <p className={`text-sm text-blue-200 font-bold`}>
                        replies: <span className="text-blue-200">{item.replies}</span>
                      </p>
                      <p className={`text-base text-blue-100 font-bold w-full break-words break-normal`} style={{ overflowWrap: 'anywhere'}}>
                        {item.name}:
                        <span className="text-blue-100">{`(ticker: ${item.ticker}) `}</span>
                        {item.desc}
                      </p>
                    </div>
                    <div className="wrap min-w-[30px] ml-auto h-full text-white">
                      <img
                        src={
                          item.avatar === null
                            ? "/sol.png"
                            : `${import.meta.env.VITE_PUBLIC_AVATAR_URL}/${item.avatar}`
                        }
                        width={24}
                        height={24}
                        alt=""
                        className="w-[24px] h-[24px] mt-2"
                      />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 pb-8">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-10 px-4 rounded-[19px] bg-[#1A0B38] border border-[#E056D7] text-white hover:bg-[#2A1B48] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1A0B38] shadow-[-1px_-1px_4px_#00000040]"
              >
                Previous
              </Button>
              <div className="flex items-center">
                <div className="w-16 h-10 rounded-full bg-gradient-to-r from-[#E056D7] to-[#3AB0EA] text-white font-medium flex items-center justify-center shadow-lg">
                  {currentPage}
                </div>
              </div>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-10 px-4 rounded-[19px] bg-[#1A0B38] border border-[#E056D7] text-white hover:bg-[#2A1B48] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1A0B38] shadow-[-1px_-1px_4px_#00000040]"
              >
                Next
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};