import  Image  from "next/image";

import React from "react"
import myLogo from "../assets/PromethX_logo1.1.jpg"

interface LogoProps {
    className?: string
}


export const Logo = ({ className }: LogoProps) =>  {
    return (
        <Image
        src={myLogo}
        alt="logo"
        className={`default-logo-styles ${className || ''}`.trim()}
        style={{ height: '50px', width: 'auto' }}
        ></Image>
    )
};