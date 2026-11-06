"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import { useAuthClient } from "@/src/components/AuthProvider";
import ServerTable, { ServerTableColumns } from "@/src/components/Table/ServerTable";
import { makeIconLinkCell, TruncatedTextCell } from "@/src/components/TableCells/TableCells";
import type { CellComponentProps, SortState } from "@chtc/web-components";
import UserGroupTable from "@/src/components/UserGroupTable/UserGroupTable";
import type { Group } from "@/types";
import { Add, Edit } from "@mui/icons-material";
import { Box, Button, TableCell, Typography } from "@mui/material";
import Link from "next/link";

// A group owner is another group (linked); no owner means only staff administer it
const OwnerCell = ({ row }: CellComponentProps<Group, keyof Group>) => (
  <TableCell>
    {row.owner_group_id === null ? (
      "Staff"
    ) : (
      <Link href={`/groups/details/?id=${row.owner_group_id}`}>Group {row.owner_group_id}</Link>
    )}
  </TableCell>
);

const columns: ServerTableColumns<Group> = {
  name: {
    id: "name",
    name: "Name",
    sortable: true,
    value: (group) => (group.deleted_at ? `${group.name} (deleted)` : group.name),
  },
  unix_gid: { id: "unix_gid", name: "GID", sortable: true },
  owner_group_id: { id: "owner_group_id", name: "Owner", CellComponent: OwnerCell },
  description: { id: "description", name: "Description", CellComponent: TruncatedTextCell },
  edit: {
    id: "edit",
    name: "",
    CellComponent: makeIconLinkCell<Group>({
      href: (group) => `/groups/details/?id=${group.id}`,
      icon: <Edit />,
      ariaLabel: "Edit group",
    }),
  },
};

// Newest first
const defaultSort: SortState<keyof Group & string> = { columnId: "id", direction: "desc" };

const searchFields = ["name"];

const tiebreakers: SortState[] = [{ columnId: "id", direction: "asc" }];

/**
 * What a non-staff user sees under Groups: the groups they are in, with a link into the ones
 * they administer. The pickers on a group's page offer every group, so that list is not needed here.
 */
const MyGroups = ({ userId }: { userId: number }) => (
  <>
    <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
      Your groups
    </Typography>
    <UserGroupTable userId={userId} />
  </>
);

function View() {
  const { currentUser } = useAuthClient();
  const isStaff = !!currentUser?.is_admin;

  if (currentUser && !isStaff) {
    return (
      <AuthGuard message="You must be logged in to view groups.">
        <MyGroups userId={currentUser.id} />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard message="You must be logged in to view groups.">
      {isStaff && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
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
        emptyMessage="No groups found."
      />
    </AuthGuard>
  );
}

export default View;
