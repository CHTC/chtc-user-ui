"use client";

import UserShell from "@/src/app/users/_components/UserShell";
import UserProjectTable from "@/src/components/UserProjectTable/UserProjectTable";

function View() {
  return <UserShell>{(_user, id) => <UserProjectTable userId={id} adminView={true} />}</UserShell>;
}

export default View;
