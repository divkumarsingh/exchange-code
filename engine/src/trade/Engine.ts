import fs from "fs"

import { Orderbook, type Fill, type Order } from "./Orderbook";
import { isConstructorDeclaration } from "typescript";
import { CREATE_ORDER, type MessageFromApi } from "../types/fromApi";

export const BASE_CURRRENCY = "INR";

interface UserBalance {
    [key: string]:{
        available: number;
        locked: number;
    }
}

export class Engine {
    private orderbooks: Orderbook[] = [];
    private balances: Map<string, UserBalance> = new Map();

    constructor() {
        let snapshot = null;
        try{
            if(snapshot!.env.WITH_SNAPSHOT){
                snapshot = fs.readFileSync()
            }
        } catch(e) {
            console.log("No snapshot found");
        }

        if(snapshot){
            const snapshotSnapshot = JSON.parse(snapshot.toString());
            this.orderbooks = snapshotSnapshot.orderbook.map((o: any) => new Orderbook(o.baseAsset, o.bids, o.asks, o.lastTradeId, o.currentPrice));
            this.balances = new Map(snapshotSnapshot.balances)
        } else{
            this.orderbooks = [new Orderbook(`TATA` , [] , [], 0, 0)];
            this.setBalances();
        }

        setInterval(() => {
            this.saveSnapshot();
        }, 1000 * 3);
    }

    saveSnapshot(){
        const snapshotSnapshot = {
            orderbooks: this.orderbooks.map( o => o.getSnapshot()),
            balances: Array.from(this.balances.entries())
        }
        fs.writeFileSync("./snapshot.json", JSON.stringify(snapshotSnapshot));
    }

    process({message, clientId} : {message: MessageFromApi, clientId: string}){
        switch(message.type){
            case CREATE_ORDER: 
                try {
                    const {executedQty, fills, orderId} = this.createOrder()
                }
        }
    }

    addOrderbook(orderbook: Orderbook){
        this.orderbooks.push(orderbook)
    }

    createOrder(market: string, price: string, quantity: string, side: "buy" | "sell", userId: string){
        const orderbook = this.orderbooks.find( o => o.ticker() === market);
        const baseAsset = market.split("_")[0] ;
        const quoteAsset = market.split("_")[1];

        if(!orderbook || !baseAsset || !quoteAsset){
            throw new Error("No orderbook found")
        }

        this.checkAndLockFunds(baseAsset, quoteAsset, side, userId, quoteAsset, price, quantity);

        const order: Order = {
            price: Number(price),
            quantity: Number(quantity),
            orderId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            filled: 0,
            side,
            userId
        }

        const { fills, executedQty } = orderbook.addOrder(order);
        this.updateBalance(userId, baseAsset, quoteAsset, side, fills, executedQty)


    }

    checkAndLockFunds(baseAsset: string, quoteAsset: string, side: "buy" | "sell", userId: string, asset: string, price: string, quantity: string){
        const userBalance = this.balances.get(userId);

        if(!userBalance){
            throw new Error("Insufficient funds")
        }
        
        if (side === "buy"){
            const cost = Number(quantity) * Number(price);
            const quoteBalance = userBalance[quoteAsset]; 

            if (!quoteBalance || quoteBalance.available < cost){
                throw new Error("Insufficient balances")
            }

            quoteBalance.available -= cost;

            quoteBalance.locked += cost;
        } else{
            const qty = Number(quantity);

            const baseBalance = userBalance[baseAsset];

            if(!baseBalance || baseBalance.available < qty){
                throw new Error("Insufficient Funds")
            }

            baseBalance.available -= qty;
            baseBalance.locked += qty;

        }
    }

    updateBalance(userId: string, baseAsset: string, quoteAsset: string, side: "buy" | "sell", fills: Fill[], executedQty: number){
        const userBalance = this.balances.get(userId);
        if(!userBalance){
            throw new Error(`balance is not sufficient for user ${userId}`)
        }
        if (side === "buy"){
            //makers balance extractions
            fills.forEach(fill => {
                const otherUserBalance = this.balances.get(fill.otherUserId);

                if(!otherUserBalance){
                    throw new Error(`Balance not found for user ${fill.otherUserId}`)
                }

                const fillValue = fill.qty * Number(fill.price);
                const userQuoteBalance = userBalance[quoteAsset];
                const userBaseBalance  = userBalance[baseAsset];
                const otherQuoteBalance = otherUserBalance[quoteAsset];
                const otherBaseBalance = otherUserBalance[baseAsset]

                if(!userQuoteBalance || !userBaseBalance || !otherBaseBalance || !otherQuoteBalance) {
                    throw new Error(`Missing asset during balance settlement for userId: ${userId} and otherUserId: ${fill.otherUserId}`)
                }

                //exchange of balances
                userQuoteBalance.locked -= fillValue;
                otherQuoteBalance.available += fillValue;

                //exchange of qty(shares/crypto)
                userBaseBalance.available += fill.qty;
                otherBaseBalance.available -= fill.qty; 
            })

        } else {
            //writing for sell
            fills.forEach(fill => {
                const otherUserBalance = this.balances.get(fill.otherUserId);
                if(!otherUserBalance){
                    throw new Error(`Balance not found for user ${fill.otherUserId}`)
                }

                const fillValue = fill.qty * Number(fill.price)
                const userQuoteBalance = userBalance[quoteAsset];
                const userBaseBalance = userBalance[baseAsset];
                const otherUserQuoteBalance = otherUserBalance[quoteAsset];
                const otherUserBaseBalance = otherUserBalance[baseAsset]

                if(!userQuoteBalance || !userBaseBalance || !otherUserQuoteBalance || !otherUserBaseBalance){
                    throw new Error(`Missing asset during balance settlement for userId: ${userId} and otherUserId: ${fill.otherUserId}`)
                }
                otherUserQuoteBalance.locked -= fillValue; 
                userQuoteBalance.available += fillValue;

                otherUserBaseBalance.available += fill.qty;
                userBaseBalance.locked -= fill.qty; 
            })
        }
    } 
    
    onRamp(userId: string, amount: number){
        const userBalance = this.balances.get(userId);
        if(!userBalance){
            this.balances.set(userId, {
                [BASE_CURRRENCY]:{
                    available: amount,
                    locked: 0,
                }
            });
        }else {
            userBalance[BASE_CURRRENCY]!.available += amount;
        }
    }

    setBaseBalance(){
        this.balances.set("1",{
            [BASE_CURRRENCY]: {
                available: 10000000,
                locked: 0
            }, 
            "TATA": {
                available: 100000,
                locked: 0
            }
        })

        this.balances.set("2", {
            [BASE_CURRRENCY]: {
                available: 10000000,
                locked: 0
            },
            "TATA": {
                available: 100000,
                locked: 0
            }
        });

        this.balances.set("7", {
            [BASE_CURRRENCY]: {
                available: 100000,
                locked: 0
            },
            "TATA": {
                available: 10000,
                locked: 0
            }
        })
    }
}



