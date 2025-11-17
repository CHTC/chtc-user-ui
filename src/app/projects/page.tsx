"use client";

import GenericTableView from "../../components/GenericTableView";

const headers = ["Name", "Staff", "Status", "Project URL", "Last Contact"];

const data: (string | number)[][] = [
  ["BioMedInfo", "ckoch5", "Active", "https://example.com", "2025-11-15T14:30:00.000Z"],
  ["MachineLearningPipeline", "Prof. Michael Chen", "Active", "https://example.com", "2025-11-16T09:15:00.000Z"],
  ["GenomicsAnalysis", "ckoch5", "Active", "https://example.com", "2025-11-10T16:45:00.000Z"],
  ["AnimalScienceBerres", "lmichael", "Active", "https://example.com", "2025-11-17T11:20:00.000Z"],
  ["BiochemPhillips", "ckoch5", "Inactive", "https://example.com", "2025-11-12T13:00:00.000Z"],
];

function Page() {
  return (
    <div style={{ width: "100%", padding: "20px" }}>
      <h1>Projects</h1>
      <GenericTableView
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
