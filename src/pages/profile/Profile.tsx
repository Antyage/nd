import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useContract } from "../../contexts/ContractContext";
import { getProfileInfo, updateProfile } from "../../api/user";
import { FEE_PRE_DIV } from "../../contexts/contracts/constants";
import { getUserId } from "../../utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Header } from "../../components/Header";

interface ProfileData {
  avatar: string | null;
  username: string;
  followers: number;
  likes: number;
  mentions: number;
  coinsHeld: any;
  replies: any;
  notifications: any;
  coinsCreated: any;
  followersList: any;
  followingsList: any;
}

export const Profile = (): JSX.Element => {
  const location = useLocation();
  const addr = location.pathname.split("/")[2];
  const wallet = useAnchorWallet();
  // @ts-ignore
  const { getOwnerAddress, isContractInitialized, initializeContract, getMainStateInfo, updateMainStateInfo } = useContract();

  const [contractOwnerAddress, setContractOwnerAddress] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("Coins Held");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [feeRecipient, setFeeRecipient] = useState<string | null>(null);
  const [tradingFee, setTradingFee] = useState<number | null>(null);

  useEffect(() => {
    const initialize = async () => {
      if (!wallet) return;

      const contractOwner = await getOwnerAddress();
      // console.log('contractOwner:', contractOwner.toBase58());
      setContractOwnerAddress(contractOwner?.toBase58());

      let id;
      try {
        const isInitialized = await isContractInitialized();
        if (!isInitialized) {
          id = toast.loading("Initializing program...");
          await initializeContract();
          toast.dismiss(id);
          toast.success("Initialized program");
        }
      } catch (err: any) {
        console.log("initializeProgram error:", err.message);
        toast.dismiss(id);
        toast.error("Failed to initialized program: " + err.message);
      }
    };

    initialize();
  }, [wallet]);

  useEffect(() => {
    const loadMainStateInfo = async () => {
      const mainStateInfo = await getMainStateInfo();
      // console.log('mainStateInfo:', mainStateInfo);
      if (mainStateInfo) {
        setOwnerAddress(mainStateInfo?.owner.toBase58());
        setFeeRecipient(mainStateInfo?.feeRecipient.toBase58());
        setTradingFee(Number(mainStateInfo?.tradingFee) / FEE_PRE_DIV);
      }
    };

    loadMainStateInfo();
  }, [wallet]);

  useEffect(() => {
    // console.log(addr)
    if (addr !== undefined) setProfileInfo();
    else setWalletAddress("");
  }, [addr, wallet]);

  const setProfileInfo = async () => {
    setWalletAddress(addr);
    let userId = null;
    if (addr === wallet?.publicKey?.toBase58()) userId = getUserId();
    const result = await getProfileInfo(addr, userId);
    // console.log(result)
    setProfileData(result);
  };

  const handleEditProfile = () => {
    if (addr === undefined) {
      toast.error("Please connect wallet!");
      return;
    }
    setIsDialogOpen(true);
  };

  const refreshProfileInfo = async () => {
    let userId = null;
    if (addr === wallet?.publicKey.toBase58()) userId = getUserId();
    const result = await getProfileInfo(addr, userId);
    setProfileData(result);
  };

  const onChangeOwner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setOwnerAddress(e.target.value);
  };

  const onChangeFeeRecipient = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeeRecipient(e.target.value);
  };

  const onChangeTradingFee = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (Number(e.target.value) < 0) return;
    setTradingFee(Number(e.target.value));
  };

  const handleDashboardSet = async () => {
    if (
      ownerAddress === "" ||
      feeRecipient === "" ||
      tradingFee === null ||
      tradingFee === 0
    ) {
      toast.warning("Invalid input values!");
      return;
    }

    const isInitialized = await isContractInitialized();
    if (!isInitialized) {
      toast.error("Contract not initialized yet!");
      return;
    }

    const id = toast.loading("Updaitng...");

    try {
      await updateMainStateInfo(ownerAddress, feeRecipient, tradingFee);
      toast.dismiss(id);
      toast.success("Updated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.dismiss(id);
      toast.error(err.message);
    }
  };


  // User profile data
  const userData = {
    username: "@Gabit4r",
    followers: 3,
    description:
      "Your Description Your Description Your Description Your Description Your Description Your Description Your Description Your Description Your Description\nYour Description Your Description Your Description Your Description Your Description Your Description",
    walletAddress: "93uf93jbvue8933jf02ndpk29gfj3mc9iem0hp3hfuitk",
  };

  // Navigation tabs data
  const tabItems = [
    { id: "coins-held", label: "Coins Held" },
    { id: "replies", label: "Replies" },
    { id: "notification", label: "Notification" },
    { id: "coins-created", label: "Coins Created" },
    { id: "followers", label: "Followers" },
    { id: "following", label: "Following" },
  ];

  return (
    <div className="bg-dark-purple flex flex-row justify-center w-full min-h-screen">
      <div className="bg-dark-purple w-full min-h-screen relative">
        {/* Background gradient */}
        {/* <div className="absolute w-full h-full top-0 left-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/50 via-dark-purple to-dark-purple" /> */}

        {/* Gradient effect */}
        <div className="absolute w-[250px] md:w-[650px] h-[250px] md:h-[650px] bottom-0 left-[13px] md:left-[33px] rounded-[324.87px] blur-[350px] bg-gradient-primary" />

        <Header />

        {/* Profile section */}
        <div className="relative z-10 md:px-14 pb-14">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <Avatar className="w-[54px] h-[54px]">
              {profileData?.avatar === null && (
                <AvatarImage src="/sol.png" alt="Profile" />
              )}
              {profileData !== null && profileData?.avatar !== null && (
                <AvatarImage
                  src={
                    profileData?.avatar === null
                      ? "/sol.png"
                      : `${import.meta.env.VITE_PUBLIC_AVATAR_URL}/${profileData?.avatar}`
                  }
                  alt=""
                />
              )}
              <AvatarFallback>{profileData?.username.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h2 className="font-medium text-text-white text-lg">
                @{profileData?.username}
              </h2>
              <p className="font-normal text-text-white text-base">
                {profileData?.followers} Followers
                {wallet?.publicKey?.toBase58() === addr && (
                  <button
                    type="button"
                    className="flex gap-[10px] items-center border border-white rounded-md w-fit px-[5px]"
                    onClick={handleEditProfile}
                  >
                    Edit Profile
                    <svg
                      width="14"
                      height="15"
                      viewBox="0 0 24 25"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.46001 21.74L21.25 6.95L17.55 3.25L2.75999 18.04L2.75 21.75L6.46001 21.74Z"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15.3496 6.63L17.8696 9.14999"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </p>
              <div className="sm:flex items-center gap-9">
                <div className="flex items-center gap-1">
                  <p className="text-[#FF3131] text-sm">
                    Likes received: {profileData?.likes}
                  </p>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M21.25 8.71997C21.25 9.87997 20.81 11.05 19.92 11.94L18.44 13.42L12.07 19.79C12.04 19.82 12.03 19.83 12 19.85C11.97 19.83 11.96 19.82 11.93 19.79L4.08 11.94C3.19 11.05 2.75 9.88997 2.75 8.71997C2.75 7.54997 3.19 6.37998 4.08 5.48998C5.86 3.71998 8.74 3.71998 10.52 5.48998L11.99 6.96997L13.47 5.48998C15.25 3.71998 18.12 3.71998 19.9 5.48998C20.81 6.37998 21.25 7.53997 21.25 8.71997Z"
                      stroke="#FF3131"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-[#97FF73] text-sm ml-1">
                    Mentions received: {profileData?.mentions}
                  </p>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20.2203 16.62C20.2203 17.47 19.5303 18.16 18.6803 18.16H5.32028C4.47028 18.16 3.78027 17.47 3.78027 16.62C3.78027 15.77 4.47028 15.08 5.32028 15.08H5.83026V9.94002C5.83026 6.54002 8.59027 3.77002 12.0003 3.77002C13.7003 3.77002 15.2403 4.46002 16.3603 5.58002C17.4803 6.69002 18.1703 8.23002 18.1703 9.94002V15.08H18.6803C19.5303 15.08 20.2203 15.77 20.2203 16.62Z"
                      stroke="#97FF73"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 3.78V2.75"
                      stroke="#97FF73"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15.0799 18.17C15.0799 19.88 13.6999 21.25 11.9999 21.25C10.2999 21.25 8.91992 19.87 8.91992 18.17H15.0799Z"
                      stroke="#97FF73"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              {/* <div className="z-10 flex flex-col px-2">
                <div
                  className="text-xs sm:text-lg border border-slate-600 rounded p-2"
                >
                  {walletAddress}
                </div>
                {addr !== undefined && (
                  <a
                    href={`https://solscan.io/account/${addr}`}
                    target="_blank"
                    className="text-sm text-white hover:underline !float-right !justify-self-end ml-auto"
                  >
                    View on solscan ↗
                  </a>
                )}
              </div> */}
              {/* <p className="font-medium text-text-white text-base leading-[25px] mt-4 max-w-full md:max-w-[600px] whitespace-pre-line">
                {userData.description}
              </p> */}
            </div>
          </div>

          {/* Wallet address input */}
          <div className="mt-8 md:mt-16 max-w-full">
            {addr !== undefined && (
              <a
                href={`https://solscan.io/account/${addr}`}
                target="_blank"
                className="text-sm text-white hover:underline !float-right !justify-self-end ml-auto"
              >
                View on solscan ↗
              </a>
            )}
            <Input
              className="w-full h-[45px] rounded-xl shadow-[-1px_-1px_4px_#00000040] bg-transparent text-text-white font-medium text-base px-4 overflow-x-auto"
              value={walletAddress}
              readOnly
            />
          </div>

          {/* Navigation tabs */}
          <Tabs defaultValue="coins-held" className="mt-8 md:mt-16 justify-items-center">
            <TabsList className="bg-transparent border-none flex flex-wrap md:flex-nowrap gap-2 md:gap-8 justify-center md:justify-start">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="font-medium text-sm md:text-base data-[state=active]:bg-accent-blue data-[state=active]:text-text-white data-[state=active]:opacity-100 data-[state=inactive]:text-text-white data-[state=inactive]:opacity-50 data-[state=active]:rounded-[7px] data-[state=active]:px-3 data-[state=active]:py-1"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab content */}
            <TabsContent value="coins-held" className="mt-8">
              <Card className="min-w-[340px] md:w-[750px] min-h-[365px] bg-light-purple rounded-[5px] border-none mt-16">
                <CardContent className="p-0 flex flex-col items-center gap-6">
                  {/* Content for Coins Held tab */}
                  {profileData?.coinsHeld.map((item: any, index: any) => {
                    return (
                      <div key={index} className="flex items-center gap-3 w-full">
                        <img src={item.logo} width={50} height={50} alt="" />
                        <div className="flex flex-col w-full">
                          <div className="flex justify-between">
                            <p className="text-xl text-white">
                              {item.balance.toFixed(0)} {item.ticker}
                            </p>
                            <div className="text-xl text-white cursor-pointer">
                              [Refresh]
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-xl text-[#97FF73]">
                              {item.lamports.toFixed(3)} SOL
                            </p>
                            <Link
                              to={`/token/${item.mintAddr}`}
                              className="text-xl text-[#97FF73] cursor-pointer"
                            >
                              [View Coin]
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex gap-6 justify-center">
                    <button type="button" className="text-xl text-white">
                      {"[<<]"}
                    </button>
                    <button type="button" className="text-xl text-white p-1">
                      1
                    </button>
                    <button type="button" className="text-xl text-white">
                      {"[>>]"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent key='replies' value='replies' className="mt-8">
              <Card className="min-w-[340px] md:w-[750px] min-h-[365px] bg-light-purple rounded-[5px] border-none mt-16">
                <CardContent className="p-0 flex flex-col items-center gap-6">
                  {/* Content for other tabs */}
                  {profileData?.replies.map((item: any, index: any) => {
                    return (
                      <div key={index} className="flex flex-col gap-2">
                        <div className="flex gap-2 items-center">
                          <p className="text-xl text-white">
                            {item.replierId.username}
                          </p>
                          <p className="text-xl text-white">
                            {format(new Date(item.cdate), "MM/dd/yyyy, HH:mm:ss")}
                          </p>
                          <p className="text-xl text-[#97FF73]">{`# ${item.replierId._id}`}</p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <p className="text-xl text-[#97FF73]">{`# ${item._id}`}</p>
                          <p className="text-xl text-white">{item.comment}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent key='notification' value='notification' className="mt-8">
              <Card className="min-w-[340px] md:w-[750px] min-h-[365px] bg-light-purple rounded-[5px] border-none mt-16">
                <CardContent className="p-0 flex flex-col items-center gap-6">
                  {/* Content for other tabs */}
                  {Array.isArray(profileData?.notifications.likes) && profileData?.notifications.likes.map((item: any, index: any) => {
                    if (item.length !== 0) {
                      return (
                        <div key={index} className="flex gap-2 items-center">
                          <div className="text-red-500 mt-1">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 15 15"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M1.35248 4.90532C1.35248 2.94498 2.936 1.35248 4.89346 1.35248C6.25769 1.35248 6.86058 1.92336 7.50002 2.93545C8.13946 1.92336 8.74235 1.35248 10.1066 1.35248C12.064 1.35248 13.6476 2.94498 13.6476 4.90532C13.6476 6.74041 12.6013 8.50508 11.4008 9.96927C10.2636 11.3562 8.92194 12.5508 8.00601 13.3664C7.94645 13.4194 7.88869 13.4709 7.83291 13.5206C7.64324 13.6899 7.3568 13.6899 7.16713 13.5206C7.11135 13.4709 7.05359 13.4194 6.99403 13.3664C6.0781 12.5508 4.73641 11.3562 3.59926 9.96927C2.39872 8.50508 1.35248 6.74041 1.35248 4.90532Z"
                                fill="currentColor"
                                fillRule="evenodd"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </div>
                          <p className="text-xl text-white">{`${item[0]} liked your comment`}</p>
                        </div>
                      );
                    }
                  })}
                  {Array.isArray(profileData?.notifications.mentions) && profileData?.notifications.mentions.map((item: any, index: any) => {
                    return (
                      <div key={index} className="flex gap-2">
                        <div className="text-green-300 mt-1">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 15 15"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12.5 3L2.5 3.00002C1.67157 3.00002 1 3.6716 1 4.50002V9.50003C1 10.3285 1.67157 11 2.5 11H7.50003C7.63264 11 7.75982 11.0527 7.85358 11.1465L10 13.2929V11.5C10 11.2239 10.2239 11 10.5 11H12.5C13.3284 11 14 10.3285 14 9.50003V4.5C14 3.67157 13.3284 3 12.5 3ZM2.49999 2.00002L12.5 2C13.8807 2 15 3.11929 15 4.5V9.50003C15 10.8807 13.8807 12 12.5 12H11V14.5C11 14.7022 10.8782 14.8845 10.6913 14.9619C10.5045 15.0393 10.2894 14.9965 10.1464 14.8536L7.29292 12H2.5C1.11929 12 0 10.8807 0 9.50003V4.50002C0 3.11931 1.11928 2.00003 2.49999 2.00002Z"
                              fill="currentColor"
                              fillRule="evenodd"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-xl text-white">{`${item.username} mentioned you in a comment`}</p>
                          <p className="text-xl text-white">{`${item.comment}`}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent key='coins-created' value='coins-created' className="mt-8">
              <Card className="min-w-[340px] md:w-[750px] min-h-[365px] bg-light-purple rounded-[5px] border-none mt-16">
                <CardContent className="p-0 flex flex-col items-center gap-6">
                  {/* Content for other tabs */}
                  {Array.isArray(profileData?.coinsCreated) && profileData?.coinsCreated.map((item: any, index: any) => {
                    return (
                      <div key={index} className="flex items-center gap-3 w-full">
                        <img src={item.logo} className="rounded-md" width={100} height={100} alt="" />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <p className="text-xl text-white">Created by</p>
                            <Link
                              to={`/profile/${item.walletAddr}`}
                              className="flex items-center gap-1"
                            >
                              <img
                                src={
                                  item.avatar === null
                                    ? "/sol.png"
                                    : `${import.meta.env.VITE__PUBLIC_AVATAR_URL}/${item.avatar}`
                                }
                                width={16}
                                height={16}
                                alt=""
                              />
                              <p className="text-xl text-white">{item.username}</p>
                            </Link>
                          </div>
                          <p className="text-xl text-white">
                            market cap: {item.marketCap.toFixed(2)}K
                          </p>
                          <p className="text-xl text-white">
                            replies: {item.replies}
                          </p>
                          <div className="text-xl text-white" style={{overflowWrap: 'anywhere'}}>{`${item.tokenName} (ticker: ${item.ticker}): ${item.desc}`}</div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent key='followers' value='followers' className="mt-8">
              <Card className="min-w-[340px] md:w-[750px] min-h-[365px] bg-light-purple rounded-[5px] border-none mt-16">
                <CardContent className="p-0 flex flex-col items-center gap-6">
                  {/* Content for other tabs */}
                  {profileData?.followersList.map((item: any, index: any) => {
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-center gap-8 w-full"
                      >
                        <Link
                          to={`/profile/${item.walletAddr}`}
                          className="flex items-center gap-1"
                        >
                          <img
                            src={
                              item.avatar === null
                                ? "/sol.png"
                                : `${import.meta.env.VITE__PUBLIC_AVATAR_URL}/${item.avatar}`
                            }
                            width={16}
                            height={16}
                            alt=""
                          />
                          <p className="text-xl text-white">{item.username}</p>
                        </Link>
                        <p className="text-xl text-white">{`${item.followers} followers`}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent key='following' value='following' className="mt-8">
              <Card className="min-w-[340px] md:w-[750px] min-h-[365px] bg-light-purple rounded-[5px] border-none mt-16">
                <CardContent className="p-0 flex flex-col items-center gap-6">
                  {/* Content for other tabs */}
                  {profileData?.followingsList.map((item: any, index: any) => {
                    return (
                      <div key={index} className="flex items-center gap-8">
                        <Link
                          to={`/profile/${item.walletAddr}`}
                          className="flex gap-2 items-center"
                        >
                          <img
                            src={
                              item.avatar === null
                                ? "/sol.png"
                                : `${import.meta.env.VITE__PUBLIC_AVATAR_URL}/${item.avatar}`
                            }
                            width={16}
                            height={16}
                            alt=""
                          />
                          <p className="text-xl text-white">{item.username}</p>
                        </Link>
                        <p className="text-xl text-white">{`${item.followers} followers`}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <EditProfileDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        profileData={profileData}
        refreshProfileInfo={refreshProfileInfo}
      />
    </div>
  );
};

function EditProfileDialog({
  isDialogOpen,
  setIsDialogOpen,
  profileData,
  refreshProfileInfo,
}: { isDialogOpen: any; setIsDialogOpen: any; profileData: any; refreshProfileInfo: any }) {
  const [profileImage, setProfileImage] = useState<any>(null);
  const [uploadProfileImage, setUploadProfileImage] = useState(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState<any>(null);

  useEffect(() => {
    if (profileData !== null) {
      setUsername(profileData.username);
      setBio(profileData.bio);
    }
  }, [profileData]);

  const handleUpdateProfile = async () => {
    if (uploadProfileImage === null) {
      toast.error("Please change photo!");
      return;
    }
    if (username === "") {
      toast.error("Please input username!");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", uploadProfileImage);
    formData.append("username", username);
    formData.append("bio", bio);

    await updateProfile(formData);
    setIsDialogOpen(false);
    refreshProfileInfo();
  };

  return (
    <Transition appear show={isDialogOpen}>
      <Dialog
        as="div"
        className={`relative z-30 focus:outline-none`}
        onClose={() => setIsDialogOpen(false)}
      >
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
              <DialogPanel className="flex flex-col gap-10 p-10 w-full max-w-xl rounded-3xl bg-[#030303] border border-white backdrop-blur-2xl font-sans">
                <p className="text-[32px] text-green-300">Edit Profile</p>
                <div className="flex flex-col gap-6 justify-center items-center">
                  <p className="text-2xl text-white font-bold text-left w-full">
                    Profile photo
                  </p>
                  <div className="relative">
                    {profileData?.avatar !== null && profileImage === null && (
                      <img
                        className="rounded-full"
                        src={
                          profileData?.avatar === null
                            ? "/sol.png"
                            : `${import.meta.env.VITE__PUBLIC_AVATAR_URL}/${profileData?.avatar}`
                        }
                        width={100}
                        height={100}
                        alt=""
                      />
                    )}
                    {profileData?.avatar === null && profileImage === null && (
                      <img
                        className="rounded-full"
                        src="/sol.png"
                        width={100}
                        height={100}
                        alt=""
                      />
                    )}
                    {profileImage !== null && (
                      <img
                        className="rounded-full"
                        src={profileImage}
                        width={100}
                        height={100}
                        alt=""
                      />
                    )}
                    <label htmlFor="profileImage" className="">
                      <svg
                        className="absolute -right-4 bottom-0 cursor-pointer"
                        width="40"
                        height="40"
                        viewBox="0 0 40 40"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect width="40" height="40" rx="20" fill="white" />
                        <path
                          d="M14.46 29.24L29.25 14.45L25.55 10.75L10.76 25.54L10.75 29.25L14.46 29.24Z"
                          stroke="black"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M23.3496 14.13L25.8696 16.65"
                          stroke="black"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <input
                        id="profileImage"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e: any) => {
                          let src: any = null;
                          if (e.target.files.length > 0) {
                            src = URL.createObjectURL(e.target.files[0]);
                            setProfileImage(src);
                            setUploadProfileImage(e.target.files[0]);
                          } else setProfileImage("");
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-2xl text-white font-bold">Username</p>
                  <input
                    type="text"
                    className="border-gray-200 border-2 text-white p-2 w-full bg-transparent rounded font-sans"
                    placeholder="Your Name"
                    onChange={(e) => setUsername(e.target.value)}
                    value={username}
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <p className="text-2xl text-white font-bold">Bio</p>
                  <textarea
                    className="w-full h-[146px] rounded px-6 py-4 border border-gray-200 text-white bg-transparent text-base resize-none"
                    placeholder="Bio"
                    onChange={(e) => setBio(e.target.value)}
                    value={bio}
                  ></textarea>
                </div>
                <div className="flex flex-col gap-3 items-center">
                  <button
                    type="button"
                    className="w-full h-[50px] bg-green-300 rounded-md py-[12px] text-xl text-black font-bold"
                    onClick={handleUpdateProfile}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="rounded-xl w-full h-[50px] text-xl text-white hover:font-bold"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    [Close]
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
