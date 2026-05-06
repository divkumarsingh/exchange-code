import { collapseTextChangeRangesAcrossMultipleVersions, textChangeRangeIsUnchanged } from "typescript";
import { BASE_CURRRENCY } from "./Engine";


export interface Order {
    price: number,
    quantity: number,
    orderId: string,
    filled: number,
    side: "buy" | "sell"
    userId: string
}

export interface Fill {
    price: string,
    qty: number,
    tradeId: number,
    otherUserId: string,
    marketUserId: string
}

export class Orderbook {
    bids: Order[];
    asks: Order[];
    baseAsset: string;
    quoteAsset: string  = BASE_CURRRENCY;
    lastTradeId: number;
    currentPrice: number;

    constructor(bids: Order[], asks: Order[], baseAsset: string, lastTradeId: number, currentPrice: number){
        this.bids = bids;
        this.asks = asks;
        this.baseAsset = baseAsset;
        this.lastTradeId = lastTradeId || 0
        this.currentPrice = currentPrice || 0;
    }

    ticker(){ 
        return `${this.baseAsset}_${this.quoteAsset}`;
    }

    getSnapshot(){
        return{
            baseAsset: this.baseAsset,
            bids: this.bids,
            asks: this.asks,
            lastTradeId: this.lastTradeId,
            currentPrice: this.currentPrice
        }
    }

    addOrder(order: Order): {
        executedQty: number,
        fills: Fill[]
    } {
        if(order.side === "buy"){
            const {executedQty , fills} = this.matchBid(order);
            order.filled = executedQty;
            if (executedQty === order.quantity){
                return {
                    executedQty,
                    fills
                }
            }
            this.bids.push(order);
            return{
                executedQty,
                fills
            }
        } else{
            const {executedQty, fills} = this.matchAsks(order);
            order.filled = executedQty;
            if (executedQty === order.quantity) {
                return {
                    executedQty,
                    fills
                }
            };
            this.asks.push(order);
            return {
                    executedQty,
                    fills
                }
        }

    }

    matchBid(order: Order):{fills: Fill[], executedQty: number} {
        const fills: Fill[] = [];
        let  executedQty: number = 0;

        for (let i = 0; i < this.asks.length; i++){
            const currentAsk = this.asks[i]!;
            if(currentAsk.price < order.price && executedQty < order.quantity){
                const filledQty = Math.min((order.quantity - executedQty), currentAsk.quantity)
                executedQty += filledQty;
                currentAsk.filled += filledQty;
                fills.push({
                    price: currentAsk.price.toString(),
                    qty: filledQty,
                    tradeId: this.lastTradeId++,
                    otherUserId: currentAsk.userId,
                    marketUserId: currentAsk.orderId
                });
            }
        }
        
        for (let i = 0; i < this.asks.length; i++){
                if(this.asks[i]?.filled === this.asks[i]?.quantity){
                    this.asks.splice(i,1);
                    i--;
                }   
        }

        return{
                fills,
                executedQty
            };
        
    }

    matchAsks(order: Order):{fills: Fill[], executedQty: number} {
        const fills: Fill[] = [];
        let executedQty: number = 0;

        for(let i = 0; i < this.bids.length ; i++){
            const currentbid = this.bids[i]!;
            if(currentbid.price >= order.price && executedQty < order.quantity){
                const amountRemaining = Math.min(order.quantity - executedQty, currentbid.quantity);
                executedQty += amountRemaining;
                currentbid.filled += amountRemaining;
                fills.push({
                    price: currentbid.price.toString(),
                    qty: amountRemaining,
                    tradeId: this.lastTradeId++,
                    otherUserId: currentbid.userId,
                    marketUserId: currentbid.orderId
                });
            }
        }

        for (let i = 0; i < this.bids.length; i++){
            if(this.bids[i]!.filled === this.bids[i]!.quantity) {
                this.bids.splice(i, 1);
                i--;
            }
        }

        
        return {
            fills,
            executedQty
        }
    }

    getDepth() {
        const bids:[string, string][] = [];
        const asks: [string, string][] = [];

        const bidsObj: {[key: string]: number} = {};
        const asksObj: {[key: string]: number} = {};

        for (let  i = 0; i < this.bids.length; i++) {
            const order = this.bids[i]!;
            if(!bidsObj[order.price]){
                bidsObj[order.price] = 0;
            }
            bidsObj[order.price]! += order.quantity
        }

        for (let i = 0; i < this.asks.length; i++){
            const order = this.asks[i]!;
            if(!asksObj[order.price]){
                asksObj[order.price] = 0;
            }
            asksObj[order.price]! += order.quantity;
        }

        for (const price in bidsObj){
            bids.push([price, asksObj[price]!.toString()])
        }

        for (const price in asksObj){
            asks.push([price, asksObj[price]!.toString()])
        }

        return {
            bids,
            asks
        };
    }

    getOpenOrders(userId: string): Order[] {
        const asks = this.asks.filter( x => x.userId === userId);
        const bids = this.bids.filter(x => x.userId === userId);

        return [...asks, ...bids]
    }

    cancelBid(order: Order){
        const index = this.bids.findIndex(x => x.orderId === order.orderId);

        if(index !== -1 ){
            const price = this.bids[index]?.price;
            this.bids.splice(index, 1);
            return price;   
        }
    }

    cancelAsks(order: Order) {
        const index = this.asks.findIndex(x => x.orderId === order.orderId);
        if (index !== -1 ){
            const price = this.asks[index]?.price;
            this.asks.splice(index, 1);
            return price;
        }
    } 
}
