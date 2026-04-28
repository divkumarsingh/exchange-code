import { getDepth, getTicker } from "@/app/utils/httpClient";
import { useEffect, useState } from "react";
import { AskTable } from "./AskTable";
import { BidTable } from "./BidTable";


export function Depth({market}: {market: string}) {
    const [bids, setBids] = useState<[string, string][]>();
    const [asks, setAsks] = useState<[string, string][]>();
    const [price, setPrice] = useState<(string)>();

    useEffect(() => {
        getDepth(market).then(d => {
            setBids(d.bids.reverse());
            setAsks(d.asks);
        })

        getTicker(market).then(t => setPrice(t.lastPrice))
    }, [])

    return <div>
        <TableHeader /> 
        {asks && <AskTable asks={asks} />}
        {bids && <BidTable  bids={bids}/>}
    </div>
}


function TableHeader() {
    return <div className="flex justify-between"text-xs>
        <div className="text-white">price</div>
        <div className="text-slate-500">Sizes</div>
        <div className="text-slate-500">Total</div>
    </div>
}