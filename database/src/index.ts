import { Client } from "pg";
import { createClient } from "redis";
import type { DbMessage } from "./types";


const pgClient = new Client({
    user: process.env.USER,
    host : process.env.HOST,
    port : parseInt(process.env.PORT || "5432"),
    database : process.env.DATABASE,
    password : process.env.PASSWORD
});

pgClient.connect();

async function main(){
    const redisClient = createClient()
    try{
        await redisClient.connect();
        console.log("connected to redis client")
    } catch(e){
        console.error("redis connection failed", e);
        process.exit(1)
    }

    while(true){
        try{
            const response = await redisClient.brPop("db_processor", 0);
            if(!response) continue;

            const messageString = response.element;
            const data: DbMessage = JSON.parse(messageString);

            if(data.type === "TRADE_ADDED"){
                const {price, timestamp, quantity} = data.data;
                const time = new Date(timestamp);

                const query = `INSERT INTO tata_prices(time, prices, volume ) VALUES ($1, $2, $3)`;
                const values = [time, price, quantity]

                await pgClient.query(query, values);
                console.log(`Saved trade: Price: ${price}, Volume: ${quantity}`)
            }
        } catch(e){
            console.error("Error processing database message", e);
        } 
    }
} 

main();