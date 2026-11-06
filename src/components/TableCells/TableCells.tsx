"use client";

import EditLink from "@/src/components/EditLink/EditLink";
import type { CellComponentProps, TableData } from "@chtc/web-components";
import TruncatedCell from "@/src/components/TruncatedCell/TruncatedCell";
import { Box, IconButton, TableCell } from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";


const toText = (value: unknown) => (value === null || value === undefined ? "" : String(value));

export const DateCell = <R extends TableData>({ value }: CellComponentProps<R, keyof R>) => {
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : null;
  return <TableCell>{date && !isNaN(date.getTime()) ? date.toLocaleString() : ""}</TableCell>;
};

export const EmailCell = <R extends TableData>({ value }: CellComponentProps<R, keyof R>) => (
  <TableCell>{value ? <Link href={`mailto:${toText(value)}`}>{toText(value)}</Link> : null}</TableCell>
);

export const UrlCell = <R extends TableData>({ value }: CellComponentProps<R, keyof R>) => (
  <TableCell>
    {value ? (
      <Link
        href={toText(value)}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "block", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {toText(value)}
      </Link>
    ) : null}
  </TableCell>
);

export const TruncatedTextCell = <R extends TableData>({ value }: CellComponentProps<R, keyof R>) => (
  <TableCell>{value ? <TruncatedCell text={toText(value)} /> : null}</TableCell>
);

interface LinkCellOptions<R> {
  href: (row: R) => string;
  ariaLabel: string;
}

// Width of EditLink's small IconButton; a row without a link keeps the space so the names line up
const LINK_WIDTH = 34;

export function makeIconLinkCell<R extends TableData>({ href, ariaLabel, icon }: LinkCellOptions<R> & { icon: ReactNode }) {
  const IconLinkCell = ({ row }: CellComponentProps<R, keyof R>) => (
    <TableCell>
      <IconButton component={Link} href={href(row)} aria-label={ariaLabel}>
        {icon}
      </IconButton>
    </TableCell>
  );
  IconLinkCell.displayName = "IconLinkCell";
  return IconLinkCell;
}

/**
 * The value with a link icon in front of it, so the icons form a column whatever the text's
 * length. `canOpen` leaves the icon out (keeping its space) for rows the reader may not open.
 */
export function makeLinkedTextCell<R extends TableData>({
  href,
  ariaLabel,
  canOpen,
}: LinkCellOptions<R> & { canOpen?: (row: R) => boolean }) {
  const LinkedTextCell = ({ row, value }: CellComponentProps<R, keyof R>) => (
    <TableCell>
      <Box component="span" sx={{ display: "inline-block", width: LINK_WIDTH, verticalAlign: "middle" }}>
        {(canOpen?.(row) ?? true) && <EditLink href={href(row)} ariaLabel={ariaLabel} />}
      </Box>
      {toText(value)}
    </TableCell>
  );
  LinkedTextCell.displayName = "LinkedTextCell";
  return LinkedTextCell;
}
