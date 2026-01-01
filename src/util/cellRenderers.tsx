"use client";

import { formatPhoneNumber } from "@/src/util/format";
import { Edit } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import Link from "next/link";

export interface CellRendererConfig {
  editPath: string;
  timeColumns?: string[];
  linkColumn?: string;
  emailColumn?: string;
  phoneColumn?: string;
  idColumn?: string;
}

const defaultConfig: Required<Omit<CellRendererConfig, "editPath">> = {
  timeColumns: ["Last Contact", "Last Modified"],
  linkColumn: "Project URL",
  emailColumn: "Email",
  phoneColumn: "Phone",
  idColumn: "id",
};

export function createCellRenderer(config: CellRendererConfig) {
  const mergedConfig = { ...defaultConfig, ...config };
  const timeColumnsSet = new Set(mergedConfig.timeColumns);

  return function cellRenderer(cell: string | number, columnHeader: string, _column: number, _row: number) {
    if (timeColumnsSet.has(columnHeader)) {
      const date = new Date(cell);
      const contents = isNaN(date.getTime()) ? "" : date.toUTCString();
      return <span>{contents}</span>;
    }

    if (columnHeader === mergedConfig.emailColumn && cell) {
      return <Link href={`mailto:${cell.toString()}`}>{cell}</Link>;
    }

    if (columnHeader === mergedConfig.linkColumn && cell) {
      return (
        <Link href={cell.toString()} target="_blank" rel="noopener noreferrer">
          {cell}
        </Link>
      );
    }

    if (columnHeader === mergedConfig.phoneColumn && cell) {
      const formattedPhone = formatPhoneNumber(cell.toString());
      return <span>{formattedPhone}</span>;
    }

    if (columnHeader === mergedConfig.idColumn && cell) {
      return (
        <IconButton aria-label="edit">
          <Link href={`${mergedConfig.editPath}?id=${cell}`}>
            <Edit />
          </Link>
        </IconButton>
      );
    }

    return <span>{cell}</span>;
  };
}
