"use client";

import GenericTableView from "@/src/components/GenericTableView";

const headers = ["Group Name", "Point of Contact", "GID", "Has Group Directory?"];

function Page() {
  return (
    <div style={{ width: "100%", padding: "20px" }}>
      <h1>Groups</h1>
      <GenericTableView
        headers={headers}
        query={async (client, opts, searchQuery) => {
          const groups = await client.getGroups({
            ...opts,
            query: { group_name: `like.%${searchQuery}%` },
          });
          console.log("Raw groups as returned by the client:", groups);

          return groups.map((group) => [
            group.name,
            group.point_of_contact ?? "",
            group.unix_gid ?? "",
            group.has_groupdir ? "Yes" : "No",
          ]);
        }}
        queryLabel="Search by Group"
      />
    </div>
  );
}

export default Page;
