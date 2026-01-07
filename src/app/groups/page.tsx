"use client";

import GenericTableView from "@/src/components/GenericTableView/GenericTableView";
import { createCellRenderer } from "@/src/utils/cellRenderers";

const headers = ["id", "Group Name", "Point of Contact", "GID", "Has Group Directory?"];
const cellRenderer = createCellRenderer({ editPath: "/groups/edit" });

function Page() {
  return (
    <div>
      <GenericTableView
        headers={headers}
        cellRenderer={cellRenderer}
        sortableColumns={{
          "Group Name": "name",
          "Point of Contact": "point_of_contact",
          GID: "unix_gid",
        }}
        query={async (client, opts, searchQuery) => {
          const queryObj = searchQuery ? { name: `like.${searchQuery}` } : undefined;
          const result = await client.getGroups({
            ...opts,
            ...(queryObj && { query: queryObj }),
          });

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
        unauthenticatedMessage="You must be logged in to view groups."
      />
    </div>
  );
}

export default Page;
