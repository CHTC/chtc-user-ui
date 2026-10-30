"use client";

import EditLink from "@/src/components/EditLink/EditLink";
import ManagedBySelect from "@/src/components/ManagedBySelect/ManagedBySelect";
import type { CellComponentProps, TableData } from "@/src/components/Table/types";
import TruncatedCell from "@/src/components/TruncatedCell/TruncatedCell";
import type { EntityManagerEnum } from "@/types";
import { IconButton, TableCell } from "@mui/material";
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

export function makeLinkedTextCell<R extends TableData>({ href, ariaLabel }: LinkCellOptions<R>) {
  const LinkedTextCell = ({ row, value }: CellComponentProps<R, keyof R>) => (
    <TableCell>
      {toText(value)} <EditLink href={href(row)} ariaLabel={ariaLabel} />
    </TableCell>
  );
  LinkedTextCell.displayName = "LinkedTextCell";
  return LinkedTextCell;
}

export function makeManagedByCell<R extends TableData>({
  patchUrl,
  onSuccess,
}: {
  patchUrl: (row: R) => string;
  onSuccess?: () => void;
}) {
  const ManagedByCell = ({ row, value }: CellComponentProps<R, keyof R>) => (
    <TableCell>
      <ManagedBySelect
        key={patchUrl(row)}
        value={(value as EntityManagerEnum | null) ?? "APPLICATION"}
        patchUrl={patchUrl(row)}
        onSuccess={onSuccess}
      />
    </TableCell>
  );
  ManagedByCell.displayName = "ManagedByCell";
  return ManagedByCell;
}
