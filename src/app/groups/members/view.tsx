"use client";

import GroupShell from "@/src/app/groups/_components/GroupShell";
import GroupMembersPanel from "@/src/components/GroupMembersPanel";
import { Alert, Typography } from "@mui/material";

function View() {
  return (
    <GroupShell>
      {(group, id) =>
        group.deleted_at !== null ? (
          <Typography color="text.secondary">A deleted group has no members to manage.</Typography>
        ) : (
          // The API only lets staff and the owners load this page, so any non-staff viewer here can administer
          <>
            {group.managed_by !== "APPLICATION" && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Membership of this group is synced from {group.managed_by}. Members added or removed here are replaced
                by the next sync.
              </Alert>
            )}
            <GroupMembersPanel groupId={id} canAdminister={true} />
          </>
        )
      }
    </GroupShell>
  );
}

export default View;
