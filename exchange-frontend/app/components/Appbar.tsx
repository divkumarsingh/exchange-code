"use client"

import { usePathname, useRouter } from "next/navigation";
import { Button } from "./basic/Button";
import { Logo } from "./basic/logo";


export default function Appbar() {

    const route = usePathname();
    const router = useRouter();

  return (
    <div className="text-white border-b border-slate-800">
        <div className="flex justify-between items-center p-2">
            <div className={`text-xl pl-4 flex flex-col justify-center cursor-pointer text-white`} onClick={() => router.push("/")} >
                    <Logo/>
                </div>
            <div className="flex">    
                    <div className={`text-sm pt-1 flex flex-col justify-center pl-8 cursor-pointer hover:text-white ${route.startsWith("/markets") ? "text-white" : "text-slate-500"}`} onClick={() => router.push("/markets")}>
                        Markets
                    </div>
                    <div className={`text-sm pt-1 flex flex-col justify-center pl-8 cursor-pointer  hover:text-white ${route.startsWith("/trade") ? "text-white" : "text-slate-500"}`} onClick={() => router.push("/trade/SOL_USDC")}>
                    Trade
                    </div>
                    <div className={`text-sm pt-1 flex flex-col justify-center pl-8 cursor-pointer  hover:text-white ${route.startsWith("/stocks") ? "text-white" : "text-slate-500"}`} onClick={() => router.push("/stocks")}>
                    Stocks
                    </div>
                    <div className={`text-sm pt-1 flex flex-col justify-center pl-8 cursor-pointer  hover:text-white ${route.startsWith("/wallet") ? "text-white" : "text-slate-500"}`} onClick={() => router.push("/wallet")}>
                    Wallet
                    </div>
            </div>
            <div className="p-2 mr-2">
                <Button variant="success" text="Deposit" divColors="success" />
                <Button variant="primary" text="Withdraw" divColors="primary" />
            </div>
        </div>
    </div>
  )
}