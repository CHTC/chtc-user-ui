"use client";

import { useAuthClient } from "@/src/components/AuthProvider";
import ServerTable, { ServerTableColumns } from "@/src/components/Table/ServerTable";
import { makeIconLinkCell, TruncatedTextCell } from "@/src/components/TableCells/TableCells";
import type { SortState } from "@chtc/web-components";
import type { BackingStore } from "@/types";
import { Add, Edit } from "@mui/icons-material";
import { Alert, Box, Button, Typography } from "@mui/material";
import Link from "next/link";

const columns: ServerTableColumns<BackingStore> = {
  edit: {
    id: "edit",
    name: "",
    CellComponent: makeIconLinkCell<BackingStore>({
      href: (store) => `/data-access/backing-stores/edit?id=${store.id}`,
      icon: <Edit />,
      ariaLabel: "Edit backing store",
    }),
  },
  name: { id: "name", name: "Name", sortable: true },
  description: { id: "description", name: "Description", CellComponent: TruncatedTextCell },
};

const defaultSort: SortState<keyof BackingStore & string> = { columnId: "name", direction: "asc" };

const searchFields = ["name"];

const tiebreakers: SortState[] = [{ columnId: "id", direction: "asc" }];

function View() {
  const { currentUser } = useAuthClient();

  if (!currentUser?.is_admin) {
    return <Alert severity="warning">Only staff can manage backing stores.</Alert>;
  }

  return (
    <div>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" component="h2">
          Backing stores
        </Typography>
        <Button startIcon={<Add />} component={Link} href="/data-access/backing-stores/create/">
          Create
        </Button>
      </Box>
      <ServerTable
        endpoint="/backing_stores"
        columns={columns}
        defaultSort={defaultSort}
        tiebreakers={tiebreakers}
        defaultPageSize={50}
        searchLabel="Search by Name"
        searchFields={searchFields}
        emptyMessage="No backing stores found."
      />
    </div>
  );
}

export default View;
