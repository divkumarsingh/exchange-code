import axios from "axios";
import { Depth, Kline, Ticker, Trade } from "./types";


const Base_URL = "http://localhost:6969/api/v1";

export async function getTicker(market: string): Promise<Ticker>{
    const tickers = await getTickers();
    const ticker = tickers.find(t => t.symbol === market);
    if(!ticker){
        throw new Error(`No ticker found for ${market}`)
    }
    
    return ticker;
}

const x = getTickers();

export async function getTickers(): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return 1;
}

export async function getDepth(market: string): Promise<Depth>{
    const response = await axios.get(`${Base_URL}/depth?symbol=${market}`);
    return response.data;
}

export async function getTrades(market: string): Promise<Trade>{
    const response = await axios.get(`${Base_URL}/trades?symbol={market}`);
    return response.data;
}

export  async function getKlines (market : string, interval : string, startTime: number, endTime: number): Promise<Kline>{
    const response =  await axios.get(`${Base_URL}/klines?symbol=${market}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`);
    const data: Kline[] = response.data;
      return data.sort((x, y) => (Number(x.end) < Number(y.end) ? -1 : 1));
} 

export async function getMarkets(): Promise<string[]> {
    const response = await axios.get(`${Base_URL}/markets`)
    return response.data;
}