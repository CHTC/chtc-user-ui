"use client";

import GenericTableView from "@/src/components/GenericTableView";
import { formatPhoneNumber } from "@/src/util/format";

const headers = ["Username", "Name", "Email", "Phone", "NetID", "Last Modified"];

function Page() {
  return (
    <div style={{ width: "100%", padding: "20px" }}>
      <h1>Users</h1>
      <GenericTableView
        headers={headers}
        query={async (client, searchQuery) => {
          const users = await client.getUsers({
            page: 0,
            page_size: 100,
            query: { username: `like.%${searchQuery}%` },
          });
          console.log("Raw users as returned by the client:", users);

          // real data won't have this amount of nulls, but the mock data does (sigh)
          return users.map((user) => [
            user.username ?? "",
            user.name ?? "",
            user.email1 ?? "",
            formatPhoneNumber(user.phone1 ?? ""),
            user.netid ?? "",
            user.date ?? "",
          ]);
        }}
        queryLabel="Search by Username"
        timeColumn="Last Modified"
      />
    </div>
  );
}

export default Page;
