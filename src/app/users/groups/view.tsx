"use client";

import UserShell from "@/src/app/users/_components/UserShell";
import UserGroupTable from "@/src/components/UserGroupTable/UserGroupTable";

function View() {
  return <UserShell>{(_user, id) => <UserGroupTable userId={id} adminView={true} />}</UserShell>;
}

export default View;
