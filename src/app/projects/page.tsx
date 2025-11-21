"use client";

import GenericTableView from "../../components/GenericTableView";

const headers = ["Name", "Staff", "Status", "Project URL", "Last Contact"];

function Page() {
  return (
    <div style={{ width: "100%", padding: "20px" }}>
      <h1>Projects</h1>
      <GenericTableView
        headers={headers}
        query={async (client) => {
          const projects = await client.getProjects({ page: 0, page_size: 100 });
          console.log("raw projects: ", projects);
          return projects.map((project) => [
            project.name!,
            project.staff1 ?? "",
            project.status ?? "",
            project.url ?? "",
            project.last_contact ?? "",
          ]);
        }}
        queryLabel="Search by Project Name"
        timeColumn="Last Contact"
        linkColumn="Project URL"
      />
    </div>
  );
}

export default Page;
