import fs from "fs"

import { Orderbook, type Fill, type Order } from "./Orderbook";
import { isConstructorDeclaration } from "typescript";
import { CREATE_ORDER, CANCEL_ORDER, type MessageFromApi, GET_OPEN_ORDERS, GET_DEPTH } from "../types/fromApi";
import { RedisManager } from "../../RedisManaager";
import { ORDER_UPDATE, TRADE_ADDED } from "../types";
import { ON_RAMP } from "../types/toApi";

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
                snapshot = fs.readFileSync("./snapshot.json")
            }
        } catch(e) {
            console.log("No snapshot found");
        }

        if(snapshot){
            const snapshotSnapshot = JSON.parse(snapshot.toString());
            this.orderbooks = snapshotSnapshot.orderbook.map((o: any) => new Orderbook(o.baseAsset, o.bids, o.asks, o.lastTradeId, o.currentPrice));
            this.balances = new Map(snapshotSnapshot.balances)
        } else{
            this.orderbooks = [new Orderbook([], [], `TATA`, 0, 0)];
            this.setBaseBalance();
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
                    const {executedQty, fills, orderId} = this.createOrder(message.data.market, message.data.price, message.data.quantity, message.data.side, message.data.userId);
                    RedisManager.getInstance().sendToApi(clientId,{
                        type: "ORDER_PLACED",
                            payload: {
                                orderId,
                                fills,
                                executedQty: executedQty.toString()
                            }
                    });
                }catch(e){
                    console.log(e);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_CANCELLED",
                        payload: {
                            orderId: "",
                            executedQty: 0,
                            remainingQty: 0
                        }
                    });
                }
            break;
            case CANCEL_ORDER: 
                try{
                    const orderId =  message.data.orderId;
                    const cancelMarket = message.data.market; 
                    const cancelOrderbook = this.orderbooks.find(o => o.ticker() === cancelMarket);
                    const quoteAsset = cancelMarket.split("_")[1];
                    if(!cancelOrderbook){
                        throw new Error("No orderbook found");
                    }

                    const order = cancelOrderbook.asks.find(o => o.orderId === orderId) || cancelOrderbook.bids.find(o => o.orderId === orderId);
                    if(!order){
                        console.log("No order found")
                        throw new Error("No order found");
                    }

                    if(order.side === "buy") {
                        const price = cancelOrderbook.cancelBid(order);
                        const leftQuantity = (order.quantity - order.filled) * order.price;
                        const userBalance = this.balances.get(order.userId);
                        if(!userBalance){
                            throw new Error("User balance not found");
                        }
                        const userBaseBalance = userBalance[BASE_CURRRENCY];
                        if(!userBaseBalance){
                            throw new Error("User base balance is not defined");
                        }

                        userBaseBalance.available += leftQuantity;
                        userBaseBalance.locked -= leftQuantity;
                        if(price){
                            this.sendUpdatedDepthAt(price.toString(), cancelMarket)
                        }
                    }else {
                        const price = cancelOrderbook.cancelAsks(order);
                        const leftQuantity = (order.quantity * order.filled) * order.price;
                        const userBalance = this.balances.get(order.userId);
                        
                        if(!userBalance || !quoteAsset){
                            throw new Error("userBalance is not defined or missing")
                        }
                        const userQuoteBalance = userBalance[quoteAsset];
                        if(!userQuoteBalance) {
                            throw new Error("user quote balance is missing");
                        }

                        userQuoteBalance.available += leftQuantity;
                        userQuoteBalance.locked -= leftQuantity;
                    
                        if(price){
                            this.sendUpdatedDepthAt(price.toString(), cancelMarket)
                        }

                    }

                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_CANCELLED", 
                        payload: {
                                orderId,
                                executedQty: 0,
                                remainingQty: 0
                            }
                    })
                }catch(e){
                    console.log("Error while cancelling order")
                    console.log(e)
                } 
            break;
            case GET_OPEN_ORDERS:
                try{
                    const openOrderBook = this.orderbooks.find(o => o.ticker() === message.data.market);
                    if(!openOrderBook){
                        throw new Error("No orderbook found")
                    }
                    const openOrders = openOrderBook.getOpenOrders(message.data.userId);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "OPEN_ORDERS",
                        payload: openOrders
                    })
                }catch(e){
                    console.log(e);
                }
            break;
            case GET_DEPTH:
                try{
                    const market = message.data.market;
                    const orderbook = this.orderbooks.find(o => o.ticker() === market);
                    if(!orderbook){
                        throw new Error("No Orderbook found")
                    }

                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "DEPTH",
                        payload: orderbook.getDepth()
                    });
                }catch(e){
                    console.log(e);
                    RedisManager.getInstance().sendToApi(clientId,{
                        type: "DEPTH",
                        payload: {
                            bids: [],
                            asks: [],
                        }
                    })
                }
            break;
            case ON_RAMP:
                try{
                    const userId = message.data.userId;
                    const amount = Number(message.data.amount);
                    this.onRamp(userId, amount);
                }catch(e){
                    console.log(e);
                    console.log("unable to get on ramp")
                }
            break;
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
        this.updateBalance(userId, baseAsset, quoteAsset, side, fills, executedQty);

        this.createDbTrades(fills, market, userId, side);
        this.updateDbOrders(order, executedQty, fills, market);
        this.publishWsDepthUpdates(fills, price, side, market);
        this.publishWsTrades(fills, userId, market, side);
        return{executedQty, fills, orderId: order.orderId}


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

    updateDbOrders(order: Order, executedQty: number, fills: Fill[], market: string) {
        RedisManager.getInstance().pushMessage({
            type: ORDER_UPDATE,
            data:{
                orderId: order.orderId,
                executedQty: executedQty,
                market: market,
                price: order.price.toString(),
                quantity: order.quantity.toString(),
                side: order.side,
            }
        });

        fills.forEach(fill => {
            RedisManager.getInstance().pushMessage({
                type: ORDER_UPDATE,
                data: {
                    orderId: fill.marketUserId,
                    executedQty: fill.qty
                }
            })
        })
    }
    //adding side to arguments
    createDbTrades(fills: Fill[], market: string, userId: string, side: "buy" | "sell") {
        fills.forEach(fill => {
            RedisManager.getInstance().pushMessage({
                type: TRADE_ADDED,
                data: {
                    id: fill.tradeId.toString(),
                    market: market,
                    isBuyerMarket: side === "sell",
                    price: fill.price,
                    quantity: fill.qty.toString(),
                    quoteQuantity: (fill.qty * Number(fill.price)).toString(),
                    timestamp: Date.now()
                }
            })
        })
    }

    publishWsTrades(fills: Fill[], userId: string, market: string, side: "buy" | "sell"){
        const channel = `trade@${market}`
        fills.forEach(fill => {
            RedisManager.getInstance().publishMessage(channel, {
                stream: channel,
                data:{
                    e: "trade",
                    t: fill.tradeId,
                    m: side === "sell", //is this buyer market or not?
                    p: fill.price,
                    q: fill.qty.toString(),
                    s: market 
                }

            })
        }
        )
    }

    sendUpdatedDepthAt(price: string, market: string) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market);
        if (!orderbook) {
            return;
        }
        const depth = orderbook.getDepth();
        const updatedBids = depth?.bids.filter(x => x[0] === price);
        const updatedAsks = depth?.asks.filter(x => x[0] === price);
        
        RedisManager.getInstance().publishMessage(`depth@${market}`, {
            stream: `depth@${market}`,
            data: {
                a: updatedAsks.length ? updatedAsks : [[price, "0"]],
                b: updatedBids.length ? updatedBids : [[price, "0"]],
                e: "depth"
            }
        });
    }

    publishWsDepthUpdates(fills: Fill[], price: string, side: "buy"| "sell", market: string){
        const orderbook = this.orderbooks.find( o => o.ticker() === market);
        if(!orderbook) return;

        const depth = orderbook.getDepth();
        const fillPrice = new Set(fills.map(f => f.price));
        
        if(side ===  "buy"){
            const updatedAsks = depth.asks.filter(x => fillPrice.has(x[0].toString())) || [];
            const updatedBid = depth.bids.filter(x => x[0] === price);

            RedisManager.getInstance().publishMessage(`depth@${market}`, {
                stream: `depth@${market}`,
                data: {
                    a: updatedAsks,
                    //@ts-ignore
                    b: updatedBid ? [updatedBid] : [],
                    e: "depth"
                }
            });
        } else if(side === "sell"){
            const updatedBids = depth.bids.filter(x => fillPrice.has(x[0].toString())) || [];
            const updatedAsk = depth.asks.find(x => x[0] === price);

            RedisManager.getInstance().publishMessage(`depth@${market}`, {
                stream: `depth@${market}`,
                data: {
                    a: updatedAsk ? [updatedAsk] : [],
                    b: updatedBids,
                    e: "depth"
                }
            })
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



