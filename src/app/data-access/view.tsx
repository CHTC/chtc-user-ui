"use client";

import { useAuthClient } from "@/src/components/AuthProvider";
import ServerTable, { ServerTableColumns } from "@/src/components/Table/ServerTable";
import { makeIconLinkCell } from "@/src/components/TableCells/TableCells";
import { fetchList } from "@/src/utils/fetchList";
import type { CellComponentProps, SortState } from "@chtc/web-components";
import type { BackingStore, DataAccess } from "@/types";
import { Add, Edit } from "@mui/icons-material";
import { Box, Button, TableCell } from "@mui/material";
import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";

// The group is linked when there is one; an entry without a group grants access to no one
const GroupCell = ({ row }: CellComponentProps<DataAccess, keyof DataAccess>) => (
  <TableCell>
    {row.group_id === null ? "Nobody" : <Link href={`/groups/edit/?id=${row.group_id}`}>Group {row.group_id}</Link>}
  </TableCell>
);

const defaultSort: SortState<keyof DataAccess & string> = { columnId: "path", direction: "asc" };

const searchFields = ["path"];

const tiebreakers: SortState[] = [{ columnId: "id", direction: "asc" }];

function View() {
  const { currentUser } = useAuthClient();
  const isStaff = !!currentUser?.is_admin;

  // Backing stores are staff only, so everyone else sees the id; one fetch serves every page
  const { data: stores } = useSWR(isStaff ? "/backing_stores?page_size=500" : null, (url: string) =>
    fetchList<BackingStore>(url),
  );
  const storeNames = useMemo(() => new Map((stores?.rows ?? []).map((store) => [store.id, store.name])), [stores]);

  const columns = useMemo(
    (): ServerTableColumns<DataAccess> => ({
      edit: {
        id: "edit",
        name: "",
        CellComponent: makeIconLinkCell<DataAccess>({
          href: (entry) => `/data-access/edit?id=${entry.id}`,
          icon: <Edit />,
          ariaLabel: "Edit data access",
        }),
      },
      backing_store_id: {
        id: "backing_store_id",
        name: "Backing store",
        value: (entry) => storeNames.get(entry.backing_store_id) ?? `Store ${entry.backing_store_id}`,
      },
      path: { id: "path", name: "Path", sortable: true },
      group_id: { id: "group_id", name: "Group", CellComponent: GroupCell },
      inode_count: {
        id: "inode_count",
        name: "Inodes",
        sortable: true,
        value: (entry) => entry.inode_count?.toLocaleString() ?? "",
      },
      byte_size: {
        id: "byte_size",
        name: "Bytes",
        sortable: true,
        value: (entry) => entry.byte_size?.toLocaleString() ?? "",
      },
    }),
    [storeNames],
  );

  return (
    <div>
      {isStaff && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}>
          <Button component={Link} href="/data-access/backing-stores/">
            Backing stores
          </Button>
          <Button startIcon={<Add />} component={Link} href="/data-access/create/">
            Create
          </Button>
        </Box>
      )}
      <ServerTable
        endpoint="/data_access"
        columns={columns}
        defaultSort={defaultSort}
        tiebreakers={tiebreakers}
        defaultPageSize={50}
        searchLabel="Search by Path"
        searchFields={searchFields}
        emptyMessage="No data access entries found."
      />
    </div>
  );
}

export default View;
