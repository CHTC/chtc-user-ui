"use client";

import GenericListComponent from "../../components/GenericListComponent";

const headers = ["Group Name", "Point of Contact", "GID", "Has Group Directory?"];

const data: (string | number)[][] = [
  ["Computational Biology Lab", "Dr. Jennifer Martinez", 10001, "Yes"],
  ["High Energy Physics", "Prof. David Thompson", 10002, "Yes"],
  ["Data Science Team", "Dr. Amanda White", 10003, "No"],
  ["Chemistry Research Group", "Prof. Christopher Lee", 10004, "Yes"],
  ["Economics Analytics", "Dr. Patricia Garcia", 10005, "Yes"],
  ["Engineering Simulation", "Prof. Brian Moore", 10006, "No"],
  ["Social Sciences Computing", "Dr. Nancy Taylor", 10007, "Yes"],
  ["Medical Imaging Research", "Prof. Kevin Brown", 10008, "Yes"],
];

function Page() {
  return (
    <div style={{ width: "100%", padding: "20px" }}>
      <h1>Groups</h1>
      <GenericListComponent
        headers={headers}
        data={data}
        searchLabel="Search Groups"
        defaultSortColumn="Group Name"
      />
    </div>
  );
}

export default Page;
