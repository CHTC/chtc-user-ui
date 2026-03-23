"use client";

import GenericTableView from "@/src/components/GenericTableView/GenericTableView";
import { createCellRenderer } from "@/src/utils/cellRenderers";

const headers = ["id", "Name", "Email", "Phone", "NetID", "Last Modified"];
const cellRenderer = createCellRenderer({ editPath: "/users/edit" });

function Page() {
  return (
    <GenericTableView
      headers={headers}
      cellRenderer={cellRenderer}
      sortableColumns={{
        Name: "name",
        Email: "email1",
        NetID: "netid",
        "Last Modified": { column: "date", default: "desc" },
      }}
      query={async (client, opts, searchQuery) => {
        const queryObj = searchQuery ? { or: `(name.ilike.${searchQuery},netid.ilike.${searchQuery})` } : undefined;
        const result = await client.getUsers({
          ...opts,
          ...(queryObj && { query: queryObj }),
        });

        const data = result.data.map((user) => [
          user.id ?? "",
          user.name ?? "",
          user.email1 ?? "",
          user.phone1 ?? "",
          user.netid ?? "",
          user.date ?? "",
        ]);

        return { data, totalCount: result.totalCount };
      }}
      queryLabel="Search by Name or NetID"
      timeColumn="Last Modified"
      unauthenticatedMessage="You must be logged in to view users."
    />
  );
}

export default Page;
