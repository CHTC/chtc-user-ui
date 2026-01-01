"use client";

import GenericTableView from "@/src/components/GenericTableView/GenericTableView";
import { createCellRenderer } from "@/src/util/cellRenderers";

const headers = ["id", "Username", "Name", "Email", "Phone", "NetID", "Last Modified"];
const cellRenderer = createCellRenderer({ editPath: "/users/edit" });

function Page() {
  return (
    <GenericTableView
      headers={headers}
      cellRenderer={cellRenderer}
      query={async (client, opts, searchQuery) => {
        const queryObj = searchQuery ? { username: `like.${searchQuery}` } : undefined;
        const result = await client.getUsers({
          ...opts,
          ...(queryObj && { query: queryObj }),
        });

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

export default Page;
