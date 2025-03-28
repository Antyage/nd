export default function DialogModal({ isDialogOpen, setIsDialogOpen }:{ isDialogOpen: any, setIsDialogOpen: any }) {
    const handleOutsideClick = () => {
      setIsDialogOpen(false);
    };
  
    const handleInsideClick = (event: any) => {
      event.stopPropagation(); // Prevents the event from bubbling up to the outer div
    };
  
    return (
      isDialogOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-2"
          style={{ zIndex: 1000 }}
          onClick={handleOutsideClick} // Close modal on outside click
        >
          <div
            className="p-6 rounded-lg w-full max-w-lg border-primary border-2"
            style={{ backgroundColor: "rgb(0, 65, 65)" }}
            onClick={handleInsideClick} // Prevents closing when clicking inside
          >
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-lg font-bold">How it works</h2>
              <h5 className="text-center text-white font-semibold pt-2 pb-7">
                Pump prevents rugs by making sure that all created tokens are safe.
                Each coin on pump is a fair-launch with no presale and no team
                allocation.
              </h5>
            </div>
            <div className="flex flex-col items-center justify-center gap-3">
              <p className="text-[#fffdfd91] text-center">step 1: pick a coin that you like</p>
              <p className="text-[#fffdfd91] text-center">step 2: buy the coin on the bonding curve</p>
              <p className="text-[#fffdfd91] text-center">step 3: sell at any time to lock in your profits or losses</p>
              <p className="text-[#fffdfd91] text-center">
                step 4: when enough people buy on the bonding curve it reaches a market cap of $69k
              </p>
              <p className="text-[#fffdfd91] text-center">
                step 5: $12k of liquidity is then deposited in raydium and burned
              </p>
            </div>
            <div className="w-full text-center pt-6">
              <span className="text-white text-center cursor-pointer">{"I'm ready to pump"}</span>
            </div>
          </div>
        </div>
      )
    );
  }
  