"use client";

import { useAuthClient } from "@/src/components/AuthProvider";
import { fetchJson, ForbiddenError } from "@/src/utils/fetchList";
import type { GroupAccess, GroupMemberOf, MembershipPath } from "@/types";
import {
  Box,
  Button,
  Chip,
  Link as MuiLink,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import useSWR from "swr";

/** The row a table shows when it has nothing in it; spans every column of these small tables */
const NoRows = ({ message }: { message: string }) => (
  <TableRow>
    <TableCell colSpan={3} align="center">
      <Typography color="text.secondary">{message}</Typography>
    </TableCell>
  </TableRow>
);

/** Group names we can resolve for a path: this group plus every group that contains it */
function useGroupNames(groupId: number, groupName: string) {
  const { data } = useSWR<GroupMemberOf[]>(`/groups/${groupId}/member_of`, () =>
    fetchJson<GroupMemberOf[]>(`/groups/${groupId}/member_of`),
  );
  const names = new Map<number, string>([[groupId, groupName]]);
  (data ?? []).forEach((entry) => names.set(entry.group.id, entry.group.name));
  return names;
}

/** One chip per path, labelled with group names (ids when a name cannot be resolved). Paths start at the containing group. */
const PathChips = ({ paths, names }: { paths: MembershipPath[]; names: Map<number, string> }) => (
  <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
    {paths.map((path) => (
      <Chip
        key={path.join("-")}
        size="small"
        variant="outlined"
        label={path.map((id) => names.get(id) ?? `#${id}`).join(" › ")}
        component={Link}
        href={`/groups/edit/?id=${path[0]}`}
        clickable
      />
    ))}
  </Stack>
);

const Via = ({ via, names }: { via: MembershipPath[]; names: Map<number, string> }) =>
  via.length === 0 ? <span>This group</span> : <PathChips paths={via} names={names} />;

interface PanelProps {
  groupId: number;
  groupName: string;
}

/** Every group this group is a member of, directly or through other groups */
export const GroupMemberOfPanel = ({ groupId, groupName }: PanelProps) => {
  const { data, error, isLoading } = useSWR<GroupMemberOf[]>(`/groups/${groupId}/member_of`, () =>
    fetchJson<GroupMemberOf[]>(`/groups/${groupId}/member_of`),
  );
  const names = useGroupNames(groupId, groupName);

  if (error instanceof ForbiddenError)
    return <Typography color="error">You do not have access to this group</Typography>;
  if (isLoading) return <Skeleton variant="rectangular" height={60} />;

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Group</TableCell>
          <TableCell>Through</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data && data.length > 0 ? (
          data.map((entry) => (
            <TableRow key={entry.group.id}>
              <TableCell>
                <MuiLink component={Link} href={`/groups/edit/?id=${entry.group.id}`}>
                  {entry.group.name}
                </MuiLink>
              </TableCell>
              <TableCell>
                <PathChips paths={entry.paths} names={names} />
              </TableCell>
            </TableRow>
          ))
        ) : (
          <NoRows message="Not a member of any group" />
        )}
      </TableBody>
    </Table>
  );
};

/** Projects, data access and submit nodes a group reaches, directly or through other groups */
export const GroupAccessPanel = ({ groupId, groupName }: PanelProps) => {
  const { currentUser } = useAuthClient();
  const { data, error, isLoading } = useSWR<GroupAccess>(`/groups/${groupId}/access`, () =>
    fetchJson<GroupAccess>(`/groups/${groupId}/access`),
  );
  const names = useGroupNames(groupId, groupName);

  if (error instanceof ForbiddenError)
    return <Typography color="error">You do not have access to this group</Typography>;
  if (isLoading || !data) return <Skeleton variant="rectangular" height={100} />;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" component="h4" mb={1}>
          Projects
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>As</TableCell>
              <TableCell>Via</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.projects.length > 0 ? (
              data.projects.map((project) => (
                <TableRow key={`${project.project_id}-${project.as}`}>
                  <TableCell>
                    <MuiLink component={Link} href={`/projects/edit?id=${project.project_id}`}>
                      {project.display_name || project.name}
                    </MuiLink>
                  </TableCell>
                  <TableCell>{project.as === "pi_group" ? "PI group" : "Project group"}</TableCell>
                  <TableCell>
                    <Via via={project.via} names={names} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <NoRows message="No projects" />
            )}
          </TableBody>
        </Table>
      </Box>

      <Box>
        <Typography variant="h6" component="h4" mb={1}>
          Data access
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Entry</TableCell>
              <TableCell>Via</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.data_access.length > 0 ? (
              data.data_access.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <MuiLink component={Link} href={`/data-access/edit?id=${entry.id}`}>
                      {entry.backing_store_name}: {entry.path}
                    </MuiLink>
                  </TableCell>
                  <TableCell>
                    <Via via={entry.via} names={names} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <NoRows message="No data access" />
            )}
          </TableBody>
        </Table>
        {currentUser?.is_admin && (
          <Button component={Link} href={`/data-access/create?group_id=${groupId}`} size="small" sx={{ mt: 1 }}>
            Create data access entry for this group
          </Button>
        )}
      </Box>

      <Box>
        <Typography variant="h6" component="h4" mb={1}>
          Submit nodes
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Via</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.submit_nodes.length > 0 ? (
              data.submit_nodes.map((node) => (
                <TableRow key={node.id}>
                  <TableCell>{node.name}</TableCell>
                  <TableCell>
                    <Via via={node.via} names={names} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <NoRows message="No submit nodes" />
            )}
          </TableBody>
        </Table>
      </Box>
    </Stack>
  );
};

export default GroupAccessPanel;
