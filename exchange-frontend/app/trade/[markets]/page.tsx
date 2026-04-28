"use client"

import { useParams } from "next/navigation"
import { MarketBar } from "../../components/MarketBar";
import { TradeView } from "../../components/TradeView";
import { Depth } from "../../components/Depth/Depth";
import { SwapUI } from "../../components/SwapUI";


export default function Page () {
    const {market} = useParams();

    return <div className="flex flex-row flex-1">
        <div className="flex flex-col flex-1">
            <MarketBar market={market as string}/>
            <div className="flex flex-row h-155 border-y border-slate-800 ">
                <div className="flex flex-col flex-1">
                    <TradeView market={market as string}/>
                </div>
                <div className="w-1px flex-col border-slate-800 border"></div>
                <div className="flex flex-col w-62.5 overflow-hidden">
                    <Depth market={market as string}/>
                </div>
            </div>
        </div>
        <div className="w-px flex-col border-slate-800 border"></div>
        <div>
            <div className="flex flex-col w-62.5">
                <SwapUI market={market as string}/>
            </div>
        </div>
    </div>
}