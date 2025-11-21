"use client";

import GenericTableView from "@/src/components/GenericTableView/GenericTableView";
import { formatPhoneNumber } from "@/src/util/format";

const headers = ["Username", "Name", "Email", "Phone", "NetID", "Last Modified"];

function Page() {
  return (
    <div style={{ width: "100%", padding: "20px" }}>
      <h1>Users</h1>
      <GenericTableView
        headers={headers}
        query={async (client, opts, searchQuery) => {
          const result = await client.getUsers({
            ...opts,
            query: {
              username: `like.%${searchQuery}%`,
            },
          });
          console.log("Raw users as returned by the client:", result);

          // real data won't have this amount of nulls, but the mock data does (sigh)
          const data = result.data.map((user) => [
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
      />
    </div>
  );
}

export default Page;
