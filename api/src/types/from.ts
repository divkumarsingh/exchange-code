export type MessageFromOrderbook = {
    type: "DEPTH",
    payload: {
        market: string,
        bids: [string, string][],
        asks: [string, string][]
    }
} | {
    type: "ORDER_PLACED",
    payload: {
        orderId: string,
        executedQty: number,
        fills: [{
            price: string,
            qty: number,
            tradedId: number
        }]
    }
} | {
    type: "ORDER_CANCELLED",
    payload: {
        orderId: string,
        executdQty: number,
        remainingQty: number 
    }
} | {
    type: "OPEN_ORDERS",
    payload: {
        orderId: string,
        executedQty: number,
        price: string,
        side: "buy" | "sell",
        userId: string
    }[]
}