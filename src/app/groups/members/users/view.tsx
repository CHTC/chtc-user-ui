"use client";

import GroupShell from "@/src/app/groups/_components/GroupShell";
import GroupMembersPanel from "@/src/components/GroupMembersPanel";
import { Typography } from "@mui/material";

/** Every user with access through the group and the path it comes through; read only */
function View() {
  return (
    <GroupShell>
      {(group, id) =>
        group.deleted_at !== null ? (
          <Typography color="text.secondary">A deleted group has no members.</Typography>
        ) : (
          <GroupMembersPanel groupId={id} canAdminister={false} view="users" />
        )
      }
    </GroupShell>
  );
}

export default View;
