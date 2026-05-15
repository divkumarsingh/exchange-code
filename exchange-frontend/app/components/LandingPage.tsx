import { SignInInputBox } from "./basic/InputBox"


export const LandingPage = () =>{

    return(
    <div className="container flex flex-col ">
        <div className="p-12">
            <div className="flex flex-col justify-center align-center ">
                <p className="text-white text-6xl text-center">21st Century Modern </p>
                <p className="text-red-500 font-semibold p-2 text-5xl text-center mb-4">Finance Platform </p>
                <p className="text-2xl text-center text-slate-200 font-medium mb-4">
                    Your assets. Your rules.<br/>
                    Trade, borrow, spend, and earn yield—all from a single account.
                </p>
                <div className="px-24 mx-10 justify-center ">
                    <SignInInputBox/>
                </div>
            </div>
            

        </div>
    </div>
    )       
} 