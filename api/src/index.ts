import express from "express"; 
import cors from "cors";
import { orderRouter } from "./routes/order";
import { depthRouter } from "./routes/depth";
import { klineRouter } from "./routes/kline";
import { tickersRouter } from "./routes/ticker";
import { tradeRouter } from "./routes/trades";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1/order", orderRouter);
app.use("/api/v1/depth", depthRouter);
app.use("/api/v1/kline", klineRouter);
app.use("/api/v1/ticker", tickersRouter);
app.use("/api/v1/trades", tradeRouter);

app.listen(3000, ()=>{
    console.log(" serveris listening on port 3000")
})