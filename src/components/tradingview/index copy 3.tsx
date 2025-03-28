import React, { useEffect, useState } from 'react';
import { useMedia } from 'react-use'
import Datafeed from './datafeed';

const timeFrames = [
  { text: "6m", resolution: "120" },
  { text: "3m", resolution: "60" },
  { text: "1m", resolution: "30" },
  {
    text: "5d",
    resolution: "D",
    description: "5 days",
  },
  {
    text: "1d",
    resolution: "D",
    description: "1 day",
  },
];


const TIMEZONE = {
  '-10': ['Pacific/Honolulu'],
  '-8': ['America/Anchorage', 'America/Juneau'],
  '-7': ['America/Los_Angeles', 'America/Phoenix', 'America/Vancouver'],
  '-6': ['America/Mexico_City'],
  '-5': ['America/Bogota', 'America/Chicago', 'America/Lima'],
  '-4': ['America/Caracas', 'America/New_York', 'America/Santiago', 'America/Toronto'],
  '-3': ['America/Argentina/Buenos_Aires', 'America/Sao_Paulo'],
  0: ['Atlantic/Reykjavik'],
  1: ['Africa/Casablanca', 'Africa/Lagos', 'Europe/London'],
  2: [
    'Europe/Belgrade',
    'Europe/Berlin',
    'Europe/Bratislava',
    'Europe/Brussels',
    'Europe/Budapest',
    'Europe/Copenhagen',
    'Africa/Johannesburg',
    'Europe/Luxembourg',
    'Europe/Madrid',
    'Europe/Oslo',
    'Europe/Paris',
    'Europe/Rome',
    'Europe/Stockholm',
    'Europe/Warsaw',
    'Europe/Zurich',
  ],
  3: [
    'Asia/Bahrain',
    'Europe/Athens',
    'Europe/Bucharest',
    'Africa/Cairo',
    'Europe/Helsinki',
    'Europe/Istanbul',
    'Asia/Jerusalem',
    'Asia/Kuwait',
    'Europe/Moscow',
    'Asia/Nicosia',
    'Asia/Qatar',
    'Europe/Riga',
  ],
  4: ['Asia/Dubai'],
  5: ['Asia/Karachi'],
  5.5: ['Mumbai/New Delhi'],
  6: ['Asia/Almaty'],
  6.5: ['Asia/Yangon'],
  7: ['Asia/Bangkok'],
  8: ['Asia/Chongqing'],
  9: ['Asia/Tokyo'],
  9.5: ['Australia/Adelaide'],
  10: ['Australia/Brisbane'],
  11: ['Pacific/Norfolk'],
  12.75: ['Pacific/Chatham'],
};

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

interface ChartProps {
  stock: string;
  symbol: string;
  tokenId: string;
  interval: string;
  width: string;
  height: string;
}

const Chart = (props: ChartProps) => {
  const { symbol, tokenId, interval, width, height } = props;
  const [windowDimensions, setWindowDimensions] = useState<{ width: number; height: number } | null>(null);
  const offset = (-1 * new Date().getTimezoneOffset()) / 60;
  const below600 = useMedia('(max-width: 640px)')
  const below800 = useMedia('(max-width: 800px)')

  const [isMobile, setIsMobile] = useState(false)
  const [isBook, setIsBook] = useState(false)

  useEffect(() => {
    setWindowDimensions(getWindowDimensions())
  }, [])

  useEffect(() => {
    setIsMobile(below600)
  }, [below600])
  useEffect(() => {
    setIsBook(below800)
  }, [below800])

  const chartHeight = isMobile ? 600 : 450
  const chartWidth = isBook ? isMobile ? windowDimensions!.width - 60 : windowDimensions!.width : width

  useEffect(() => {
    const checkTradingView = () => {
      if (!window.TradingView) {
        console.error("❌ TradingView is not loaded yet!");
        return false;
      }
      return true;
    };

    const loadChart = () => {
      if (!checkTradingView()) return;

    if (symbol && interval) {
      console.log("====================================\n", Datafeed(tokenId))

      // @ts-ignore
      const widget = (window.tvWidget = new TradingView.widget({
        symbol: symbol,
        interval: interval,
        fullscreen: false,
        width: "100%",
        height: "100%",
        container: 'tv_chart_container',
        datafeed: Datafeed(tokenId),
        library_path: '/charting_library/',
        toolbar_bg: '#0b1217',
        overrides: {
          'paneProperties.rightMargin': 0,
          'paneProperties.background': '#0b1217',
          'paneProperties.backgroundType': 'solid',
          'paneProperties.backgroundGradientEndColor': '#0b1217',
          'paneProperties.backgroundGradientStartColor': '#0b1217',
          'paneProperties.vertGridProperties.color': '#E3E3E5', // Grid Vertical Lines Color
          'paneProperties.horzGridProperties.color': '#E3E3E5', // Grid Horizontal Lines Color
          'mainSeriesProperties.candleStyle.upColor': '#11CC9A', // Up Candle Color
          'mainSeriesProperties.candleStyle.downColor': '#E20E7C', // Down Candle Color
          'mainSeriesProperties.candleStyle.borderUpColor': '#11CC9A', // Up Candle Border Color
          'mainSeriesProperties.candleStyle.borderDownColor': '#E20E7C', // Down Candle Border Color
          'mainSeriesProperties.candleStyle.drawBorder': false, // Disable candle borders
          'mainSeriesProperties.minTick': '100000000,1,false',
          "scalesProperties.textSize": 18,
          "scalesProperties.showLeftScale": false,
        },
        disabled_features: ['header_symbol_search'],
        time_frames: timeFrames,
        theme: 'Dark',
        // @ts-ignore
        timezone: TIMEZONE[offset][0],
      }));

      // widget.onChartReady(async () => {
        // widget.activeChart().setTimezone('UTC');
      // });
    };
    }

    if (window.TradingView) {
      loadChart();
    } else {
      // 🔥 Dynamically import TradingView if it's not already loaded
      console.log("+++++++++++++++++++++++++++++++++++\n")
      const script = document.createElement("script");
      script.src = "/charting_library/charting_library.standalone.js"; // Ensure the correct file
      script.onload = () => {
        console.log("📈 TradingView Loaded!");
        console.log("999999999999999", window.TradingView);
        loadChart();
      };
      document.body.appendChild(script);
    }

    return () => {
      if (window.tvWidget) {
        window.tvWidget.remove();
      }
    };
  }, []);
  return (
    <>
      <div id="tv_chart_container" style={{ height: chartHeight, backgroundColor: 'black' }} />
    </>
  );
};

export default Chart;
