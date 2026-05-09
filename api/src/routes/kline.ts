import { Router } from "express";

export const klineRouter = Router();

klineRouter.get("/", async(req, res) => {
    const {market, interval, startInterval, endTime} = req.query;

    let query;
    switch(interval){
        case "1m" :
            query = `SELECT * FROM klines_1m WHERE bucket >= $1 AND bucket <=$2`;
            break; 

        case "1h":
            query = `SELECT * FROM klines_1h WHERE bucket >=$1 AND bucket <=$2`;
            break;
        
        case "1w":
            query = `SELECT * FROM klines_1w WHERE bucket >=$1 AND bucket <=$2`
            break;
        
        default: 
            return res.status(400).send("Invalid interval")
    }

    //database call ;
})