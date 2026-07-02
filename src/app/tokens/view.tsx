"use client";

import GenericTableView from "@/src/components/GenericTableView/GenericTableView";
import { createCellRenderer } from "@/src/utils/cellRenderers";

const headers = ["id", "Created By", "Description", "Created At", "Expires At"];
const cellRenderer = createCellRenderer({ editPath: "/tokens/edit" });

function View() {
  return (
    <GenericTableView
      headers={headers}
      cellRenderer={cellRenderer}
      sortableColumns={{
        "Created By": "created_by",
        Description: "description",
        "Created At": { column: "created_at", default: "desc" },
        "Expires At": "expires_at",
      }}
      query={async (client, opts, searchQuery) => {
        const queryObj = searchQuery ? { or: `(description.ilike.${searchQuery})` } : undefined;
        const result = await client.getTokens({
          ...opts,
          ...(queryObj && { query: queryObj }),
        });

        const data = result.data.map((token) => [
          token.id ?? "",
          token.created_by ?? "",
          token.description ?? "",
          token.created_at ?? "",
          token.expires_at ?? "",
        ]);

        return { data, totalCount: result.totalCount };
      }}
      queryLabel="Search by Description"
      timeColumn="Created At"
      unauthenticatedMessage="You must be logged in to view tokens."
    />
  );
}

export default View;
