"use client";

import GroupShell from "@/src/app/groups/_components/GroupShell";
import { GroupAccessPanel, GroupMemberOfPanel } from "@/src/components/GroupAccessPanel";
import { Box, Typography } from "@mui/material";

/** What the group can reach: the groups it belongs to, then the projects, data and nodes that grants */
function View() {
  return (
    <GroupShell>
      {(group, id) => (
        <>
          <Box mb={5}>
            <Typography variant="h6" component="h2" mb={1}>
              Member of
            </Typography>
            <GroupMemberOfPanel groupId={id} groupName={group.name} />
          </Box>
          <GroupAccessPanel groupId={id} groupName={group.name} />
        </>
      )}
    </GroupShell>
  );
}

export default View;
