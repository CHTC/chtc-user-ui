import GenericListComponent from "../../components/GenericListComponent";

const headers = ["Username", "Name", "Email", "Phone", "Last Modified"];

const data: (string | number)[][] = [
  ["jdoe", "John Doe", "jdoe@wisc.edu", "(608) 555-0101", "2025-11-12T17:10:56.380Z"],
  ["asmith", "Alice Smith", "asmith@wisc.edu", "(608) 555-0102", "2025-11-13T17:10:56.380Z"],
  ["bjohnson", "Bob Johnson", "bjohnson@wisc.edu", "(608) 555-0103", "2025-11-17T17:10:56.380Z"],
];

function Page() {
  return (
    <div style={{ width: "100%", padding: "20px" }}>
      <h1>Users</h1>
      <GenericListComponent
        headers={headers}
        data={data}
        timeColumn="Last Modified"
        searchLabel="Search"
        defaultSortColumn="Username"
      />
    </div>
  );
}

export default Page;
