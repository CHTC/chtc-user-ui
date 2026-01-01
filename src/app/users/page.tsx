"use client";

import GenericTableView from "@/src/components/GenericTableView/GenericTableView";
import { formatPhoneNumber } from "@/src/util/format";
import { Edit } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import Link from "next/link";

const headers = ["id", "Username", "Name", "Email", "Phone", "NetID", "Last Modified"];

function Page() {
  return (
    <GenericTableView
      headers={headers}
      cellRenderer={userCellRenderer}
      query={async (client, opts, searchQuery) => {
        const queryObj = searchQuery ? { username: `like.${searchQuery}` } : undefined;
        const result = await client.getUsers({
          ...opts,
          ...(queryObj && { query: queryObj }),
        });
        console.log("Raw users as returned by the client:", result);

        // real data won't have this amount of nulls, but the mock data does (sigh)
        const data = result.data.map((user) => [
          user.id ?? "",
          user.username ?? "",
          user.name ?? "",
          user.email1 ?? "",
          user.phone1 ?? "",
          user.netid ?? "",
          user.date ?? "",
        ]);

        return { data, totalCount: result.totalCount };
      }}
      queryLabel="Search by Username"
      timeColumn="Last Modified"
      unauthenticatedMessage="You must be logged in to view users."
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
  } else if (columnHeader === emailColumn) {
    return <Link href={`mailto:${cell.toString()}`}>{cell}</Link>;
  } else if (columnHeader === linkColumn) {
    return (
      <Link href={cell.toString()} target="_blank" rel="noopener noreferrer">
        {cell}
      </Link>
    );
  } else if (columnHeader === phoneColumn) {
    const formattedPhone = formatPhoneNumber(cell.toString());
    return <span>{formattedPhone}</span>;
  } else if (columnHeader === idColumn) {
    return (
      <IconButton aria-label={"edit"}>
        <Link href={`/users/edit?id=${cell}`}>
          <Edit />
        </Link>
      </IconButton>
    );
  }
  return <span>{cell}</span>;
}

export default Page;
