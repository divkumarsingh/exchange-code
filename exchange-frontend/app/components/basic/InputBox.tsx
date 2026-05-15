import { ReactNode } from "react"
import { Button } from "./Button"


interface InputBoxProps {
    placeholder: string,
    button?: ReactNode
}

export const SignInInputBox = () => {
    return(
        <div className="border-0 rounded-2xl flex flex-row justify-center bg-black m-6 p-2 ">
            <input className="text-2xl text-slate-100 border-0 " placeholder="Enter your email"></input>
            <Button text="sign in" variant="signin" divColors="signin" className=" bg-slate-100 text-3xl size-32 text-black round-3xl border-0"></Button>
        </div>
    )
}