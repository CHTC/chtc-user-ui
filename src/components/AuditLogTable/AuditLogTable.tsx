"use client";

import ServerTable, { ServerTableColumns } from "@/src/components/Table/ServerTable";
import { DateCell } from "@/src/components/TableCells/TableCells";
import type { CellComponentProps, SortState } from "@chtc/web-components";
import type { AuditActionEnum, AuditLogEntry } from "@/types";
import { Box, Chip, Link as MuiLink, TableCell, Typography } from "@mui/material";
import Link from "next/link";

export type AuditQuery = Record<string, string | string[]>;

interface AuditLogTableProps {
  /** List endpoint, e.g. "/audit_log" or "/groups/5/audit_log" */
  url: string;
  /** Filters that always apply; values may repeat a key (e.g. two occurred_at bounds) */
  query?: AuditQuery;
}

type EntryCellProps = CellComponentProps<AuditLogEntry, keyof AuditLogEntry>;

export const ACTION_COLORS: Record<AuditActionEnum, "default" | "success" | "error" | "info" | "warning"> = {
  member_added: "success",
  member_removed: "error",
  group_created: "info",
  group_deleted: "error",
  owner_group_changed: "warning",
  metadata_changed: "default",
};

const show = (value: unknown) => (value === null || value === undefined ? "none" : String(value));

/** One line per change for metadata; JSON for anything else */
const Details = ({ entry }: { entry: AuditLogEntry }) => {
  const details = entry.details;
  if (!details || Object.keys(details).length === 0) return null;

  const lines: string[] = [];
  if (entry.action === "metadata_changed" && details.changes && typeof details.changes === "object") {
    const entity = details.entity && details.entity !== "group" ? `${details.entity} ${details.entity_id}: ` : "";
    Object.entries(details.changes as Record<string, { old: unknown; new: unknown }>).forEach(([field, change]) =>
      lines.push(`${entity}${field}: ${show(change?.old)} → ${show(change?.new)}`),
    );
  } else if (entry.action === "owner_group_changed" && "old" in details) {
    lines.push(`owner group: ${show(details.old)} → ${show(details.new)}`);
  }

  return (
    <Box>
      {lines.map((line) => (
        <Typography key={line} variant="body2">
          {line}
        </Typography>
      ))}
      {lines.length === 0 && (
        <details>
          <summary>JSON</summary>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(details, null, 2)}</pre>
        </details>
      )}
    </Box>
  );
};

const ActionCell = ({ row }: EntryCellProps) => (
  <TableCell>
    <Chip size="small" color={ACTION_COLORS[row.action] ?? "default"} label={row.action} />
  </TableCell>
);

const GroupCell = ({ row }: EntryCellProps) => (
  <TableCell>
    {row.group_id !== null && (
      <MuiLink component={Link} href={`/groups/details/?id=${row.group_id}`}>
        Group {row.group_id}
      </MuiLink>
    )}
  </TableCell>
);

const MemberCell = ({ row }: EntryCellProps) => (
  <TableCell>
    {row.member_user_id !== null && (
      <MuiLink component={Link} href={`/users/details/?id=${row.member_user_id}`}>
        {row.member_user?.name ?? row.member_user?.email1 ?? `User ${row.member_user_id}`}
      </MuiLink>
    )}
    {row.member_group_id !== null && (
      <MuiLink component={Link} href={`/groups/details/?id=${row.member_group_id}`}>
        {row.member_group?.name ?? `Group ${row.member_group_id}`}
      </MuiLink>
    )}
  </TableCell>
);

const DetailsCell = ({ row }: EntryCellProps) => (
  <TableCell>
    <Details entry={row} />
  </TableCell>
);

const columns: ServerTableColumns<AuditLogEntry> = {
  occurred_at: { id: "occurred_at", name: "Time", sortable: true, firstSortDirection: "desc", CellComponent: DateCell },
  action: { id: "action", name: "Action", CellComponent: ActionCell },
  actor_id: {
    id: "actor_id",
    name: "Actor",
    value: (entry) =>
      entry.actor_id === null ? "system" : (entry.actor?.name ?? entry.actor?.email1 ?? `User ${entry.actor_id}`),
  },
  group_id: { id: "group_id", name: "Group", CellComponent: GroupCell },
  member_user_id: { id: "member_user_id", name: "Member", CellComponent: MemberCell },
  details: { id: "details", name: "Details", CellComponent: DetailsCell },
};

// Newest first, as the API does when no order is given
const defaultSort: SortState<keyof AuditLogEntry & string> = { columnId: "occurred_at", direction: "desc" };

// Entries written in one transaction share occurred_at, so id breaks the tie
const tiebreakers: SortState[] = [{ columnId: "id", direction: "desc" }];

const AuditLogTable = ({ url, query }: AuditLogTableProps) => (
  <ServerTable
    endpoint={url}
    columns={columns}
    defaultSort={defaultSort}
    tiebreakers={tiebreakers}
    defaultPageSize={50}
    urlPrefix="log."
    params={query}
    emptyMessage="No history"
  />
);

export default AuditLogTable;
