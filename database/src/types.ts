import type { StringMappingType } from "typescript"

export type DbMessage = {
    type: "TRADE_ADDED",
    data: {
        id: string,
        isBuyerMarket: boolean,
        price: string,
        quantity: string,
        quoteQuantity: string,
        timestamp: string,
        market: string
    }
} | {
    type: "ORDER_UPDATE",
    data: {
        orderId: string,
        executedQty: number,
        market?: string,
        price?: string,
        quantity?: string,
        side?: "buy" | "sell"
    }
}