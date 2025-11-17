import GenericTableView from "../../components/GenericTableView";

const headers = ["Username", "Name", "Email", "Phone", "NetID", "Last Modified"];

const data: (string | number)[][] = [
  ["jdoe", "John Doe", "jdoe@wisc.edu", "(608) 555-0101", "jdoe21", "2025-11-12T17:10:56.380Z"],
  ["asmith", "Alice Smith", "asmith@wisc.edu", "(608) 555-0102", "asmith", "2025-11-13T17:10:56.380Z"],
  ["bjohnson", "Bob Johnson", "bjohnson@wisc.edu", "(608) 555-0103", "bjognson", "2025-11-17T17:10:56.380Z"],
];

function Page() {
  return (
    <div style={{ width: "100%", padding: "20px" }}>
      <h1>Users</h1>
      <GenericTableView
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
