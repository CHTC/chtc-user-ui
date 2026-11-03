"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import { useAuthClient } from "@/src/components/AuthProvider";
import ServerTable, { ServerTableColumns } from "@/src/components/Table/ServerTable";
import { DateCell, makeIconLinkCell, TruncatedTextCell } from "@/src/components/TableCells/TableCells";
import type { CellComponentProps, SortState } from "@chtc/web-components";
import type { Group } from "@/types";
import { Add, Edit } from "@mui/icons-material";
import { Box, Button, FormControlLabel, Switch, TableCell } from "@mui/material";
import Link from "next/link";
import { useMemo, useState } from "react";

// A group owner is another group (linked); no owner means only staff administer it
const OwnerCell = ({ row }: CellComponentProps<Group, keyof Group>) => (
  <TableCell>
    {row.owner_group_id === null ? (
      "Staff"
    ) : (
      <Link href={`/groups/edit/?id=${row.owner_group_id}`}>Group {row.owner_group_id}</Link>
    )}
  </TableCell>
);

const columns: ServerTableColumns<Group> = {
  edit: {
    id: "edit",
    name: "",
    CellComponent: makeIconLinkCell<Group>({
      href: (group) => `/groups/edit?id=${group.id}`,
      icon: <Edit />,
      ariaLabel: "Edit group",
    }),
  },
  name: {
    id: "name",
    name: "Name",
    sortable: true,
    value: (group) => (group.deleted_at ? `${group.name} (deleted)` : group.name),
  },
  unix_gid: { id: "unix_gid", name: "GID", sortable: true },
  owner_group_id: { id: "owner_group_id", name: "Owner", CellComponent: OwnerCell },
  description: { id: "description", name: "Description", CellComponent: TruncatedTextCell },
  expires_at: { id: "expires_at", name: "Expires", sortable: true, CellComponent: DateCell },
};

// Newest first
const defaultSort: SortState<keyof Group & string> = { columnId: "id", direction: "desc" };

const searchFields = ["name"];

const tiebreakers: SortState[] = [{ columnId: "id", direction: "asc" }];

function View() {
  const { currentUser } = useAuthClient();
  const isStaff = !!currentUser?.is_admin;
  // The API leaves deleted groups out unless staff ask for them
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const params = useMemo(() => (includeDeleted ? { include_deleted: "true" } : undefined), [includeDeleted]);

  return (
    <AuthGuard message="You must be logged in to view groups.">
      {isStaff && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 2, mb: 2 }}>
          <FormControlLabel
            control={<Switch checked={includeDeleted} onChange={(e) => setIncludeDeleted(e.target.checked)} />}
            label="Show deleted"
          />
          <Button startIcon={<Add />} component={Link} href="/groups/create/">
            Create Group
          </Button>
        </Box>
      )}
      <ServerTable
        endpoint="/groups"
        columns={columns}
        defaultSort={defaultSort}
        tiebreakers={tiebreakers}
        defaultPageSize={50}
        searchLabel="Search by Name"
        searchFields={searchFields}
        params={params}
        emptyMessage="No groups found."
      />
    </AuthGuard>
  );
}

export default View;
