"use client";

import GroupShell from "@/src/app/groups/_components/GroupShell";
import AuditLogTable from "@/src/components/AuditLogTable/AuditLogTable";

function View() {
  return <GroupShell>{(_group, id) => <AuditLogTable url={`/groups/${id}/audit_log`} />}</GroupShell>;
}

export default View;
