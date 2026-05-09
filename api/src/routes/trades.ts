import { Router } from "express";


export const tradeRouter = Router();

tradeRouter.get("/", async(req, res) => {
    const market = req.query;
    // have to call Database
    res.json({})
})