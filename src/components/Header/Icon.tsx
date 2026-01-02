import { CSSProperties } from "react";

const Icon = ({ size = "50px" }: { size?: CSSProperties["width"] }) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const style = {
    height: size,
    width: size,
  };

  return <img src={`${basePath}/logos/CHTC_Logo_Full_Color.svg`} style={style} alt="CHTC Logo" />;
};

export default Icon;
