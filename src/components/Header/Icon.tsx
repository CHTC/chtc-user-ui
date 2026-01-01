import CHTCSVG from "@/public/logos/CHTC_Logo_Full_Color.svg";
import Image from "next/image";
import React, { CSSProperties } from "react";

const Icon = ({ size = "50px" }: { size?: CSSProperties["width"] }) => {
  const style = {
    height: size,
    width: size,
  };

  return <Image src={CHTCSVG.src} style={style} alt="CHTC Logo" />;
};

export default Icon;
