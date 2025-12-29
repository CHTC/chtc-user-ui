"use client";

import GenericTableView from "@/src/components/GenericTableView/GenericTableView";
import { formatPhoneNumber } from "@/src/util/format";
import { Edit } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import Link from "next/link";

const headers = ["id", "Group Name", "Point of Contact", "GID", "Has Group Directory?"];

function Page() {
  return (
    <div>
      <GenericTableView
        headers={headers}
        cellRenderer={groupCellRenderer}
        query={async (client, opts, searchQuery) => {
          const queryObj = searchQuery ? { name: `like.${searchQuery}` } : undefined;
          const result = await client.getGroups({
            ...opts,
            ...(queryObj && { query: queryObj }),
          });
          console.log("Raw groups as returned by the client:", result);

          const data = result.data.map((group) => [
            group.id,
            group.name,
            group.point_of_contact ?? "",
            group.unix_gid ?? "",
            group.has_groupdir ? "Yes" : "No",
          ]);

          return { data, totalCount: result.totalCount };
        }}
        queryLabel="Search by Group"
      />
    </div>
  );
}

function groupCellRenderer(cell: string | number, columnHeader: string, _column: number, _row: number) {
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
        <Link href={`/groups/edit?id=${cell}`}>
          <Edit />
        </Link>
      </IconButton>
    );
  }
  return <span>{cell}</span>;
}

export default Page;
