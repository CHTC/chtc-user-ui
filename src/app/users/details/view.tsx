"use client";

import UserDetails from "@/src/app/users/_components/UserDetails";
import UserShell from "@/src/app/users/_components/UserShell";

function View() {
  return <UserShell>{(user, id) => <UserDetails user={user} id={id} />}</UserShell>;
}

export default View;
