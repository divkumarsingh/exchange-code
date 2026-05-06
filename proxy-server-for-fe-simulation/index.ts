import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { Response, Request, NextFunction } from "express";
import { server } from "typescript";

const app = express();

const targetUrl = "https://api.backpack.exchange";

//To handle cors
app.use((req: Request, res: Response, next:NextFunction): void =>{
    res.header("Access-Control-Allow-Origin",  "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Expose-Headers", "Content-Length, Content-Range");
    next();
});

app.use("/", createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    ws: true
}));

const port = 6969;

app.listen(port, () => {
    console.log(`Proxy server is running on http://localhost:${port}`)
})
