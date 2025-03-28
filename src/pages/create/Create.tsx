import { UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-toastify"
import { VersionedTransaction, 
    TransactionMessage, 
    PublicKey
} from '@solana/web3.js'
import { useContract } from "../../contexts/ContractContext";
import { NATIVE_MINT } from "@solana/spl-token";
import { Disclosure, DisclosureButton, DisclosurePanel, Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { TOKEN_TOTAL_SUPPLY } from "../../engine/consts";
import { connection, addLookupTableInfo } from "../../engine/config";
import { createToken } from "../../engine/createToken";
import { updateToken } from "../../api/token";
import { prioritizeIxs, send, sleep } from "../../engine/utils";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Header } from "../../components/Header";

export const Create = (): JSX.Element => {
  const { connected } = useWallet();

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const coinName = useRef<HTMLInputElement | null>(null);
  const ticker = useRef<HTMLInputElement | null>(null);
  const description = useRef<HTMLTextAreaElement | null>(null);
  const [coinImage, setCoinImage] = useState<string | null>(null)
  const [imageName, setImageName] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imgBuffer, setImageBuffer] = useState()
  const twitterLink = useRef<HTMLInputElement | null>(null)
  const telegramLink = useRef<HTMLInputElement | null>(null)
  const websiteLink = useRef<HTMLInputElement | null>(null)
  const referral = useRef<HTMLInputElement | null>(null)

  const handleCreateCoin = () => {
    if (coinName.current?.value === '') {
      console.log("toast no name!!!")
      toast.error('No name!')
      return
    }
    if (imageName === '') {
      console.log("2")
      toast.error('No image uploaded!')
      return
    }
    if (ticker.current?.value === '') {
      console.log("3")
      toast.error('No ticker!')
      return
    }
    if (!connected) {
      console.log("4")
      toast.error('No Wallet Connected!')
      return
    }
    if (referral.current?.value) {
      console.log("5 --- ", referral.current?.value)
      try {
        if (referral.current?.value) {
          console.log("6")
          const key = new PublicKey(referral.current.value);
        } else {
          console.log("7")
          throw new Error('Referral address is undefined');
        }
      } catch (err) {
        console.log("8")
        toast.error('Invalid referral address!')
        return
      }
    }

    console.log("9")
    setIsDialogOpen(true)
  };

  const handleFileRead = (event: any) => {
    const imageBuffer = event.target.result;
    // console.log('imageBuffer:', imageBuffer);
    setImageBuffer(imageBuffer);
  };
  return (
    <div className="min-h-screen w-full bg-[#100425] flex justify-center">
      <div className="relative w-full min-h-screen">
        {/* Gradient background effect */}
        <div className="fixed w-[250px] sm:w-[450px] md:w-[650px] h-[250px] sm:h-[450px] md:h-[650px] bottom-0 right-0 rounded-[324.87px] blur-[150px] sm:blur-[250px] md:blur-[350px] [background:linear-gradient(133deg,rgba(220,0,211,0.4)_54%,rgba(12,250,245,0.4)_100%)] md:[background:linear-gradient(133deg,rgba(220,0,211,1)_54%,rgba(12,250,245,1)_100%)]" />

        {/* Header Section */}
        <Header />
        {/* <div className="relative z-10 flex flex-col md:flex-row justify-between items-center px-4 md:px-[58px] pt-4 md:pt-7 gap-4">
          <img
            className="w-[200px] md:w-[273px] h-auto md:h-[114px] object-cover mb-4 md:mb-0"
            alt="Nodump Logo"
            src="/logo.png"
          />
          <Button
            variant="ghost"
            className="text-[#fcfbfb] text-lg md:text-xl font-medium"
          >
            [ Connect Wallet ]
          </Button>
        </div> */}

        {/* relative z-10 h-auto mx-4 md:mx-[50px] mt-6 md:mt-[40px] w-full rounded-[inherit] */}
        {/* Form Container */}
        <div className="relative flex flex-col gap-6 sm:gap-8 md:gap-12 mb-[50px] mx-[20px] md:mx-[50px] mt-6 md:mt-[61px]">
          {/* First Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-24">
            <div className="w-full">
              <Label
                htmlFor="coinName"
                className="font-bold text-white text-[15px] sm:text-[16px] md:text-[19px]"
              >
                Coin Name
              </Label>
              <Input
                id="coinName"
                className="w-full h-9 mt-2 bg-[#5c3f77] border-none text-white placeholder:text-[#dddbdb]"
                ref={coinName}
              />
            </div>

            <div className="w-full">
              <Label
                htmlFor="coinTag"
                className="font-bold text-white text-[15px] sm:text-[16px] md:text-[19px]"
              >
                Coin Tag
              </Label>
              <Input
                id="coinTag"
                className="w-full h-9 mt-2 bg-[#5c3f77] border-none text-white placeholder:text-[#dddbdb]"
                ref={ticker}
              />
            </div>

            <div className="w-full">
              <Label className="font-bold text-white text-[15px] sm:text-[16px] md:text-[19px]">Type</Label>
              <RadioGroup defaultValue="utility" className="flex gap-4 sm:gap-8 md:gap-16 mt-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="utility"
                    id="utility"
                    className="bg-[#5c3f77]"
                  />
                  <Label
                    htmlFor="utility"
                    className="font-bold text-white text-[15px] sm:text-[16px] md:text-[19px]"
                  >
                    Utility
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="meme"
                    id="meme"
                    className="bg-[#5c3f77]"
                  />
                  <Label
                    htmlFor="meme"
                    className="font-bold text-white text-[15px] sm:text-[16px] md:text-[19px]"
                  >
                    Meme
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-24">
            <div className="w-full">
              <Label
                htmlFor="coinImage"
                className="font-bold text-white text-[15px] sm:text-[16px] md:text-[19px]"
              >
                Coin Image
              </Label>
              {/* <Button
                variant="ghost"
                className="w-full h-9 mt-2 bg-[#5c3f77] border-none flex items-center justify-center gap-2"
              >
                <UploadIcon className="w-[16px] sm:w-[19px] h-[16px] sm:h-[18px]" />
                <span className="font-bold text-[#dddbdb] text-[13px] sm:text-[15px]">
                  UploadIcon Coin Image
                </span>
              </Button> */}
              <div className='w-full h-9 mt-2 bg-[#5c3f77] border-none flex items-center gap-2 rounded-md border border-input'>
                <label htmlFor="coinImage" className="ml-2 gap-2">
                  {/* <div className="bg-white text-black rounded-sm text-md p-1 cursor-pointer">Choose File</div> */}
                  <input id='coinImage' type='file' accept='image/*' onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const src = URL.createObjectURL(e.target.files[0])
                      setCoinImage(src)
                      setImageName(e.target.files[0].name)
                      setImageFile(e.target.files[0])

                      let reader = new FileReader();
                      reader.onload = handleFileRead;
                      reader.readAsArrayBuffer(e.target.files[0]);
                    }
                    else {
                      setImageName('')
                      setImageFile(null)
                    }
                  }} />
                </label>
                {/* <input type="text" className="border-green-200 border-2 text-white p-2 w-full max-w-[400px] bg-transparent rounded placeholder-white" placeholder=''/> */}
              </div>
            </div>

            <div className="w-full">
              <Label
                htmlFor="whitePaper"
                className="font-bold text-white text-[15px] sm:text-[16px] md:text-[19px]"
              >
                White Paper
              </Label>
              <Button
                variant="ghost"
                className="w-full h-9 mt-2 bg-[#5c3f77] border-none flex items-center justify-center gap-2"
              >
                <UploadIcon className="w-[16px] sm:w-[19px] h-[16px] sm:h-[18px]" />
                <span className="font-bold text-[#dddbdb] text-[13px] sm:text-[15px]">
                  UploadIcon White Paper
                </span>
              </Button>
            </div>

            <div className="w-full">
              <Label
                htmlFor="numberOfCoins"
                className="font-bold text-white text-[15px] sm:text-[16px] md:text-[19px]"
              >
                Number Of Coins
              </Label>
              <Select>
                <SelectTrigger className="w-full h-9 mt-2 bg-[#5c3f77] border-none text-white">
                  <SelectValue placeholder="Select number of coins" />
                </SelectTrigger>
                <SelectContent className="bg-[#2D1854] border-none text-white">
                  <SelectItem value="1m" className="text-white hover:bg-[#3D2466] focus:bg-[#3D2466]">1,000,000 (1M)</SelectItem>
                  <SelectItem value="10m" className="text-white hover:bg-[#3D2466] focus:bg-[#3D2466]">10,000,000 (10M)</SelectItem>
                  <SelectItem value="100m" className="text-white hover:bg-[#3D2466] focus:bg-[#3D2466]">100,000,000 (100M)</SelectItem>
                  <SelectItem value="1b" className="text-white hover:bg-[#3D2466] focus:bg-[#3D2466]">1,000,000,000 (1B)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Third Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-24">
            <div className="w-full">
              <Label
                htmlFor="websiteLink"
                className="font-bold text-white text-[15px] sm:text-[16px] md:text-[19px]"
              >
                Website Link
              </Label>
              <Input
                id="websiteLink"
                className="w-full h-9 mt-2 bg-[#5c3f77] border-none text-white placeholder:text-[#dddbdb]"
                ref={websiteLink}
              />
            </div>

            <div className="w-full">
              <Label
                htmlFor="twitterLink"
                className="font-bold text-white text-[15px] sm:text-[16px] md:text-[19px]"
              >
                Twitter / X Link
              </Label>
              <Input
                id="twitterLink"
                className="w-full h-9 mt-2 bg-[#5c3f77] border-none text-white placeholder:text-[#dddbdb]"
                ref={twitterLink}
              />
            </div>

            <div className="w-full">
              <Label
                htmlFor="telegramLink"
                className="font-bold text-white text-[15px] sm:text-[16px] md:text-[19px]"
              >
                Telegram Link
              </Label>
              <Input
                id="telegramLink"
                className="w-full h-9 mt-2 bg-[#5c3f77] border-none text-white placeholder:text-[#dddbdb]"
                ref={telegramLink}
              />
            </div>
          </div>

          {/* Description and ID Submit Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 md:gap-24">
            <div className="lg:col-span-2">
              <Label
                htmlFor="description"
                className="font-bold text-white text-[15px] sm:text-[16px] md:text-[19px]"
              >
                Description
              </Label>
              <Textarea
                id="description"
                className="w-full h-[120px] sm:h-[162px] mt-2 bg-[#5c3f77] border-none text-white placeholder:text-[#dddbdb] resize-none"
                ref={description}
              />
            </div>

            <div className="space-y-6 w-full flex flex-col justify-between">
              <div>
                <Label
                  htmlFor="idSubmit"
                  className="font-bold text-white text-[15px] sm:text-[16px] md:text-[19px] mb-2"
                >
                  ID Submit
                </Label>
                <Button
                  variant="ghost"
                  className="w-full h-9 mt-2 bg-[#5c3f77] border-none flex items-center justify-center gap-2"
                >
                  <UploadIcon className="w-[16px] sm:w-[19px] h-[16px] sm:h-[18px]" />
                  <span className="font-bold text-[#dddbdb] text-[13px] sm:text-[15px]">
                    UploadIcon ID
                  </span>
                </Button>
              </div>
              <Button
                className="w-full h-[40px] sm:h-[45px] rounded-[10px] bg-gradient-to-r from-[#ff00f5] to-[#00f0ff] shadow-[-1px_-1px_4px_#00000040] text-white font-medium text-lg sm:text-xl"
                onClick={handleCreateCoin}>
                Apply Coin
              </Button>
              <p className="text-sm text-white font-bold">Cost to deploy: ~0.02 SOL</p>
              <CreateCoinDialog
                isOpen={isDialogOpen}
                setIsDialogOpen={setIsDialogOpen}
                coinName={coinName.current?.value}
                ticker={ticker.current?.value}
                description={description.current?.value}
                coinImage={coinImage}
                imgFile={imageFile}
                imgBuffer={imgBuffer}
                twitterLink={twitterLink.current?.value}
                telegramLink={telegramLink.current?.value}
                websiteLink={websiteLink.current?.value}
                referral={referral.current?.value}
              />
            </div>
            {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24">
              <div>
                <Label
                  htmlFor="idSubmit"
                  className="font-bold text-white text-[15px] sm:text-[16px] md:text-[19px]"
                >
                  ID Submit
                </Label>
                <Button
                  variant="ghost"
                  className="w-full h-9 mt-2 bg-[#5c3f77] border-none flex items-center justify-center gap-2"
                >
                  <UploadIcon className="w-[16px] sm:w-[19px] h-[16px] sm:h-[18px]" />
                  <span className="font-bold text-[#dddbdb] text-[13px] sm:text-[15px]">
                    UploadIcon ID
                  </span>
                </Button>
              </div>
              <Button className="w-full h-[40px] sm:h-[45px] rounded-[10px] bg-gradient-to-r from-[#ff00f5] to-[#00f0ff] shadow-[-1px_-1px_4px_#00000040] text-white font-medium text-lg sm:text-xl">
                Apply Coin
              </Button>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};
function CreateCoinDialog({isOpen, setIsDialogOpen, coinName, ticker, description, coinImage, imgFile, imgBuffer, twitterLink, telegramLink, websiteLink, referral }: { isOpen: boolean; setIsDialogOpen: (value: boolean) => void; coinName: string | undefined; ticker: string | undefined; description: string | undefined; coinImage: string | null; imgFile: File | null; imgBuffer: any; twitterLink: string | undefined; telegramLink: string | undefined; websiteLink: string | undefined; referral: string | undefined }) {
  const walletCtx = useAnchorWallet();
  const contractContext = useContract();

  if (!('isContractInitialized' in contractContext)) {
    throw new Error("Invalid contract context");
  }

  const {
    isContractInitialized, 
    getCreatePoolTx, 
    getBuyTx 
  } = contractContext;

  const [mode, setMode] = useState('sol');
  const [amount, setAmount] = useState<string | ''>('');

  const onChangeAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (Number(e.target.value) < 0) return;
    setAmount(e.target.value);
  }

  const handleCreateCoin = async () => {
    if (!walletCtx) {
      toast.error('No Wallet Connected!');
      return;
    }
    
    const id = toast.loading(`Creating '${coinName}' token...`);

    try {
      const isInitialized = await isContractInitialized();
      if (!isInitialized) {
        toast.error('Contract not initialized yet!');
        return;
      }

      let allIxs: any[] = [];
      if (!coinName || !ticker || !description || !coinImage || !imgBuffer || !imgFile) {
        toast.error("Please fill in all * fields!");
        return;
      }

      console.log("walletCtx = ", walletCtx, "\nname = ", coinName, "\nticker = ", ticker, "\ndescription = ", description, "\nimgBuffer = ", imgBuffer, "\nimgFile = ", imgFile, "\nwebsiteLink = ", websiteLink, "\ntwitterLink = ", twitterLink, "\ntelegramLink = ", telegramLink, "\nreferralAddress = ", referral)
      const { mintKeypair, imageUrl, createIxs } = await createToken(walletCtx, coinName, ticker, description, imgBuffer, imgFile, websiteLink, twitterLink, telegramLink, referral);
      allIxs = [...allIxs, ...createIxs];

      console.log('mintKeypair:', mintKeypair.publicKey.toBase58(), ", TOKEN_TOTAL_SUPPLY:", TOKEN_TOTAL_SUPPLY, ", NATIVE_MINT:", NATIVE_MINT.toBase58());
      const createPoolIx = await getCreatePoolTx(mintKeypair.publicKey.toBase58(), TOKEN_TOTAL_SUPPLY, NATIVE_MINT, 0);
      allIxs.push(createPoolIx);

      if (Number(amount) > 0) {
        const buyIx = await getBuyTx(mintKeypair.publicKey.toBase58(), Number(amount));
        allIxs.push(buyIx);
      }

      // console.log('allIxs:', allIxs);
      console.log("import.meta.env.VITE_PUBLIC_IS_MAINNET === ", import.meta.env.VITE_PUBLIC_IS_MAINNET);
      
      const newIxs = import.meta.env.VITE_PUBLIC_IS_MAINNET === "true" ? await prioritizeIxs(connection, allIxs, walletCtx.publicKey) : allIxs;

      const blockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
      const message = new TransactionMessage({
        payerKey: walletCtx.publicKey!, 
        instructions: newIxs, 
        recentBlockhash: blockhash, 
      }).compileToV0Message(Object.values({ ...(addLookupTableInfo ?? {}) }));
      const transaction = new VersionedTransaction(message);
      transaction.sign([mintKeypair]);

      const txHash = await send(connection, walletCtx, transaction);
      console.log('txHash:', txHash);

      await sleep(1000);
      const result = await updateToken(coinName, ticker, description, imageUrl, twitterLink, telegramLink, websiteLink, referral, mintKeypair.publicKey.toBase58());
      if (!result) {
        toast.dismiss(id);
        toast.error("Failed to update token info!");
        setIsDialogOpen(false);
        return;
      }

      toast.dismiss(id);
      toast.success(`Created a new bonding curve with token '${coinName}'`);

      setIsDialogOpen(false);
    } catch (err) {
      console.error('handleCreateCoin err:', err);
      toast.dismiss(id);
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('An unknown error occurred.');
      }
    }
  }

  return (
    <Transition appear show={isOpen}>
      <Dialog as="div" className={`relative z-30 focus:outline-none`} onClose={() => setIsDialogOpen(false)}>
        <div className="fixed inset-0 z-10 w-screen font-sans overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 bg-black/80">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 transform-[scale(95%)]"
              enterTo="opacity-100 transform-[scale(100%)]"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 transform-[scale(100%)]"
              leaveTo="opacity-0 transform-[scale(95%)]"
            >
              <DialogPanel className="flex flex-col gap-10 p-10 w-full max-w-xl rounded-3xl bg-[#030303] border border-white backdrop-blur-2xl">
                <p className='text-[32px] font-bold text-white'>Choose how many [{ticker}] you want to buy (Optional)</p>
                <p className='text-xl text-white'>Tip: Its optional but buying a small amount of coins helps protect your coin from snipers</p>
                <div className='flex flex-col gap-2 items-end'>
                  <button type='button' className='text-xl text-white font-bold cursor-pointer' onClick={() => {
                    if (mode === 'sol')
                      setMode('coin')
                    else
                      setMode('sol')
                  }}>Switch to {ticker}</button>
                  <div className='relative w-full'>
                    {mode === 'sol' ? (
                      <div className='absolute right-6 inset-y-4 flex gap-1 items-center'>
                        <p className="text-xl text-white">SOL</p>
                        <img
                          src="/sol.png"
                          width={32}
                          height={32}
                          alt="sol"
                        />
                      </div>
                    ) : (
                      <div className='absolute right-6 inset-y-4 flex gap-1 items-center'>
                        <p className="text-xl text-white">{ticker}</p>
                        <img
                          className='rounded-full'
                          src={coinImage!}
                          width={32}
                          height={32}
                          alt="coin"
                        />
                      </div>
                    )}
                    <input value={amount} onChange={onChangeAmount} 
                      type="number" 
                      className="border-green-200 border-2 text-white p-2 w-full max-w-[500px] bg-transparent rounded placeholder-white" 
                      placeholder='0.0 (optional)' 
                    />
                  </div>
                </div>
                <div className='flex flex-col gap-3 items-center'>
                  <button type='button' className='bg-blue-500 rounded-xl w-full h-[50px] text-xl font-bold text-black' onClick={handleCreateCoin}>Create Coin</button>
                  <p className="text-xl text-white">Cost to deploy: ~0.02 SOL</p>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}