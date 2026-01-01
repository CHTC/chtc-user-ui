"use client";

import GenericTableView from "@/src/components/GenericTableView/GenericTableView";
import { formatPhoneNumber } from "@/src/util/format";
import { Edit } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import Link from "next/link";

const headers = ["id", "Name", "Staff", "Status", "Project URL", "Last Contact"];

function Page() {
  return (
    <GenericTableView
      headers={headers}
      cellRenderer={projectCellRenderer}
      query={async (client, opts, searchQuery) => {
        const queryObj = searchQuery ? { name: `like.${searchQuery}` } : undefined;
        const result = await client.getProjects({
          ...opts,
          ...(queryObj && { query: queryObj }),
        });

        const data = result.data.map((project) => [
          project.id,
          project.name!,
          project.staff1 ?? "",
          project.status ?? "",
          project.url ?? "",
          project.last_contact ?? "",
        ]);

        return { data, totalCount: result.totalCount };
      }}
      queryLabel="Search by Project Name"
      timeColumn="Last Contact"
      linkColumn="Project URL"
      unauthenticatedMessage="You must be logged in to view projects."
    />
  );
}

function projectCellRenderer(cell: string | number, columnHeader: string, _column: number, _row: number) {
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
        <Link href={`/projects/edit?id=${cell}`}>
          <Edit />
        </Link>
      </IconButton>
    );
  }
  return <span>{cell}</span>;
}

export default Page;
