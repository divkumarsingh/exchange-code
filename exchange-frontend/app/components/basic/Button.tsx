import React from "react"


type Variants = "primary" | "secondary" | "success"

interface ButtonProps{
    variant: Variants
    text: string,
    onClick? : () => void,
    loading?: boolean,
    divColors?: Variants
}

const defaultStyles = "text-center font-semibold rounded-lg focus:none hover:opacity-90 disabled:opacity-80 disabled:hover:opacity:80 relative overflow-hidden h-[32px] text-sm px-3 py-1.5 mr-4"

const variantStyles: Record<Variants, string> = {
    "primary": "focus:ring-blue-200",
    "secondary": "focus:ring-yellow-200",
    "success": "focus:ring-green-200"
}

const DivcolorsStyles: Record<Variants, string> =  {
    "primary": "bg-blue-500",
    "secondary": "bg-yellow-500",
    "success": "bg-green-500"
}

const textColorStyles: Record<Variants, string> = {
    "primary": "text-blue-500",
    "secondary": "text-yellow-500",
    "success": "text-greeen-500"
}

const divDefaultStyle = "absolute inset-0 opacity-[16%]"


export const Button = ({variant, 
    text, 
    onClick, 
    loading, 
    divColors = "primary"
}: ButtonProps) => {

    const activeDivColor = divColors || variant

    return <button onClick={onClick}
    className ={`${variantStyles[variant]}
        ${defaultStyles}
    }`}
    >
        <div className={`${DivcolorsStyles[activeDivColor]} ${divDefaultStyle}`}></div>
        <div className="flex flex-row items-center justify-center gap-4">
            <p className={`${textColorStyles[activeDivColor]}`}>{text}</p>
        </div>
    </button>
} 