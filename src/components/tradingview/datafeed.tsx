/* eslint-disable no-unused-vars */

const resValues = {
  // minutes
  1: 1,
  3: 3,
  5: 5,
  15: 10,
  30: 30,
  // hours
  60: 60,
  120: 120,
  240: 240,
  360: 360,
  720: 720,
  // days
  "1D": 1440,
  "3D": 4320,
  "1W": 10080,
  "1M": 43200
};

function parseFullSymbol(fullSymbol: any) {
  const match = fullSymbol.match(/^(\w+):(\w+)\/(\w+)$/);
  if (!match) {
    return null;
  }

  return {
    exchange: match[1],
    fromSymbol: match[2],
    toSymbol: match[3],
  };
}

export const configurationData = {
  supported_resolutions: [
    // minutes
    "1",
    "3",
    "5",
    "15",
    "30",
    // hours
    "60",
    "120",
    "240",
    "360",
    "720",
    // days
    "D",
    "W",
    "M",
  ],
};

const channelToSubscription = new Map();

// Chart Methods
// eslint-disable-next-line import/no-anonymous-default-export
const datafeed = (tokenId: any) => {
  return {
    onReady: (callback: any) => {
      setTimeout(() => callback(configurationData));
    },
    searchSymbols: async () => {
      // Code here...
    },
    resolveSymbol: async (
      symbolName: any,
      onSymbolResolvedCallback: any,
      onResolveErrorCallback: any
    ) => {
      let symbolInfo = {
        name: symbolName,
        has_intraday: true,
        has_no_volume: false,
        session: "24x7",
        timezone: "Europe/Athens",
        exchange: "",
        minmov: 0.00000000001,
        pricescale: 100000000,
        has_weekly_and_monthly: true,
        volume_precision: 2,
        data_status: "streaming",
        supported_resolutions: configurationData.supported_resolutions,
      };

      onSymbolResolvedCallback(symbolInfo);
    },

    getBars: async (
      symbolInfo: any,
      resolution: any,
      periodParams: any,
      onHistoryCallback: any,
      onErrorCallback: any
      // firstDataRequest
    ) => {
      // const resName = resNames[resolution];
      const resVal = resValues[resolution as keyof typeof resValues];
      const { from, to, firstDataRequest } = periodParams;
      try {
        // let url = `https://api.twelvedata.com/time_series?symbol=${symbolInfo.name}&outputsize=1000&interval=${resName}&apikey=${API_KEY}`;
        let url = `${import.meta.env.VITE_PUBLIC_BACKEND_URL}/token/get_feed_data?tokenId=${tokenId}&from=${from}&to=${to}&interval=${resVal}`;

        const response = await fetch(url);
        if (response.status !== 200) {
          onHistoryCallback([], { noData: false });
          return;
        }
        const data = await response.json();

        if (!data.length) {
          onHistoryCallback([], { noData: true });
        }

        let bars = data.map((el: any) => {
          let dd = new Date(el.startTimestampSeconds * 1000);
          return {
            time: dd.getTime(), //TradingView requires bar time in ms
            low: el.low,
            high: el.high,
            open: el.open,
            close: el.close,
            volume: el.volumeUsd,
          };
        });
        bars = bars.sort(function (a: any, b: any) {
          if (a.time < b.time) return -1;
          else if (a.time > b.time) return 1;
          return 0;
        });

        // @ts-ignore
        latestBar = bars[bars.length - 1];
        // @ts-ignore
        window.delta = 0;

        onHistoryCallback(bars, { noData: false });
      } catch (error) {
        onErrorCallback(error);
      }
    },
    subscribeBars: (
      symbolInfo: any,
      resolution: any,
      onRealtimeCallback: any,
      subscribeUID: any,
      onResetCacheNeededCallback: any,
      lastDailyBar: any
    ) => {
      const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
      const channelString = `0~${parsedSymbol?.exchange}~${parsedSymbol?.fromSymbol}~${parsedSymbol?.toSymbol}`;
      const handler = {
        id: subscribeUID,
        callback: onRealtimeCallback,
      };
      let subscriptionItem = channelToSubscription.get(channelString);
      if (subscriptionItem) {
        // Already subscribed to the channel, use the existing subscription
        subscriptionItem.handlers.push(handler);
        return;
      }
      subscriptionItem = {
        subscribeUID,
        resolution,
        lastDailyBar,
        handlers: [handler],
      };
      channelToSubscription.set(channelString, subscriptionItem);
      console.log(
        "[subscribeBars]: Subscribe to streaming. Channel:",
        channelString
      );
      // @ts-ignore
      socket.emit("SubAdd", { subs: channelString });
    },
    unsubscribeBars: (subscriberUID: string) => {
      // Code here...
    },
  };
};

export default datafeed;
