"use client";

import GenericTableView from "@/src/components/GenericTableView/GenericTableView";
import { formatPhoneNumber } from "@/src/util/format";
import { Edit } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import Link from "next/link";
import type { PiProjectView } from "@/types";

const headers = ["id", "Username", "Name", "Project Name", "Email", "Phone", "NetID"];

function Page() {
  return (
    <GenericTableView
      headers={headers}
      cellRenderer={userCellRenderer}
      query={async (client, opts, searchQuery) => {
        const queryObj = searchQuery ? { username: `like.${searchQuery}` } : undefined;
        const result: PiProjectView[] = await client.getPiProjects({
          ...opts,
          ...(queryObj && { query: queryObj }),
        });

        // Map PiProjectView into row arrays matching headers
        const data = result.map((pi: PiProjectView) => [
          pi.user_id ?? "", // id
          pi.username ?? "", // Username
          pi.name ?? "", // Name
          pi.project_name ?? "", // Project Name
          pi.email1 ?? "",
          pi.phone1 ?? "",
          pi.netid ?? "",
        ]);

        return { data, totalCount: result.length };
      }}
      queryLabel="Search by Username"
      timeColumn="Last Modified"
      unauthenticatedMessage="You must be logged in to view PI projects."
    />
  );
}

function userCellRenderer(cell: string | number, columnHeader: string, _column: number, _row: number) {
  const timeColumns = new Set(["Last Contact", "Last Modified"]);
  const linkColumn = "Project URL";
  const emailColumn = "Email";
  const phoneColumn = "Phone";
  const idColumn = "id";

  if (timeColumns.has(columnHeader)) {
    const date = new Date(cell);
    const contents = isNaN(date.getTime()) ? "" : date.toUTCString();
    return <span>{contents}</span>;
  } else if (columnHeader === emailColumn && cell) {
    return <Link href={`mailto:${cell.toString()}`}>{cell}</Link>;
  } else if (columnHeader === linkColumn && cell) {
    return (
      <Link href={cell.toString()} target="_blank" rel="noopener noreferrer">
        {cell}
      </Link>
    );
  } else if (columnHeader === phoneColumn && cell) {
    const formattedPhone = formatPhoneNumber(cell.toString());
    return <span>{formattedPhone}</span>;
  } else if (columnHeader === idColumn && cell) {
    return (
      <IconButton aria-label="edit">
        <Link href={`/users/edit?id=${cell}`}>
          <Edit />
        </Link>
      </IconButton>
    );
  }
  return <span>{cell}</span>;
}

export default Page;
