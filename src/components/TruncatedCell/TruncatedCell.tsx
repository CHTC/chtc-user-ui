"use client";

import { Tooltip } from "@mui/material";
import { useRef, useState } from "react";

interface TruncatedCellProps {
  text: string;
  maxWidth?: number | string;
}

/**
 * Single-line table cell that ellipsizes long text
 * Shows the full text in a tooltip on hover, only when it is actually cut off
 */
export const TruncatedCell = ({ text, maxWidth = 300 }: TruncatedCellProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const checkOverflow = () => {
    const el = ref.current;
    if (el) setIsOverflowing(el.scrollWidth > el.clientWidth);
  };

  return (
    <Tooltip title={isOverflowing ? text : ""} arrow>
      <span
        ref={ref}
        onMouseEnter={checkOverflow}
        style={{
          display: "block",
          maxWidth,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          cursor: isOverflowing ? "help" : undefined,
        }}
      >
        {text}
      </span>
    </Tooltip>
  );
};

export default TruncatedCell;
