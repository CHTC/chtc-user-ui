"use client";

import GenericTableView from "@/src/components/GenericTableView";

const headers = ["Name", "Staff", "Status", "Project URL", "Last Contact"];

function Page() {
  return (
    <div style={{ width: "100%", padding: "20px" }}>
      <h1>Projects</h1>
      <GenericTableView
        headers={headers}
        query={async (client, opts, searchQuery) => {
          const result = await client.getProjects({ ...opts, query: { name: `like.%${searchQuery}%` } });
          console.log("raw projects: ", result);

          const data = result.data.map((project) => [
            project.name!,
            project.staff1 ?? "",
            project.status ?? "",
            project.url ?? "",
            project.last_contact ?? "",
          ]);

          return { data, totalCount: result.totalCount };
        }}
        queryLabel="Search by Project Name"
        timeColumn="Last Contact"
        linkColumn="Project URL"
      />
    </div>
  );
}

export default Page;
