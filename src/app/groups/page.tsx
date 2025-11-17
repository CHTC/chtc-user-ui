"use client";

import GenericTableView from "../../components/GenericTableView";

const headers = ["Group Name", "Point of Contact", "GID", "Has Group Directory?"];

const data: (string | number)[][] = [
  ["gpu_gitter", "ckoch5", 10001, "Yes"],
  ["keles_group", "lmichael", 10002, "Yes"],
  ["bact_ane", "lmichael", 10003, "No"],
  ["hotels", "lmichael", 10004, "Yes"],
  ["concepts", "ckoch5", 10005, "Yes"],
  ["plant_lankau", "lmichael", 10006, "No"],
];

function Page() {
  return (
    <div style={{ width: "100%", padding: "20px" }}>
      <h1>Groups</h1>
      <GenericTableView headers={headers} data={data} searchLabel="Search Groups" defaultSortColumn="Group Name" />
    </div>
  );
}

export default Page;
