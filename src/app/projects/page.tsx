"use client";

import GenericListComponent from "../../components/GenericListComponent";

const headers = ["Name", "Staff", "Status", "Project URL", "Last Contact"];

const data: (string | number)[][] = [
  ["Quantum Computing Research", "Dr. Sarah Johnson", "Active", "https://quantum.example.com", "2025-11-15T14:30:00.000Z"],
  ["Machine Learning Pipeline", "Prof. Michael Chen", "Active", "https://ml-pipeline.example.com", "2025-11-16T09:15:00.000Z"],
  ["Genomics Analysis", "Dr. Emily Rodriguez", "On Hold", "https://genomics.example.com", "2025-11-10T16:45:00.000Z"],
  ["Climate Modeling", "Dr. James Wilson", "Active", "https://climate-model.example.com", "2025-11-17T11:20:00.000Z"],
  ["Particle Physics Simulation", "Prof. Lisa Anderson", "Completed", "https://particle-sim.example.com", "2025-11-12T13:00:00.000Z"],
  ["Astrophysics Data Processing", "Dr. Robert Kim", "Active", "https://astro-data.example.com", "2025-11-14T10:30:00.000Z"],
];

function Page() {
  return (
    <div style={{ width: "100%", padding: "20px" }}>
      <h1>Projects</h1>
      <GenericListComponent
        headers={headers}
        data={data}
        timeColumn="Last Contact"
        linkColumn="Project URL"
        searchLabel="Search Projects"
        defaultSortColumn="Name"
      />
    </div>
  );
}

export default Page;
