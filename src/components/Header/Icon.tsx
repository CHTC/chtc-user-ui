import CHTCSVG from "@/public/logos/CHTC_Logo_Full_Color.svg";
import React, { CSSProperties } from "react";

const Icon = ({ size = "50px" }: { size?: CSSProperties["width"] }) => {
  const style = {
    height: size,
    width: size,
  };

  return <img src={CHTCSVG.src} style={style} />;
};

export default Icon;
