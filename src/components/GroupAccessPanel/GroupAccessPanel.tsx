"use client";

import StaticTable from "@/src/components/Table/StaticTable";
import { fetchJson, ForbiddenError } from "@/src/utils/fetchList";
import type { CellComponentProps } from "@chtc/web-components";
import type {
  GroupAccess,
  GroupAccessProject,
  GroupAccessSubmitNode,
  GroupMemberOf,
  MembershipPath,
} from "@/types";
import { Box, Chip, Link as MuiLink, Skeleton, Stack, TableCell, Typography } from "@mui/material";
import Link from "next/link";
import { useMemo } from "react";
import useSWR from "swr";

type GroupNames = Map<number, string>;

const memberOfKey = (groupId: number) => `/groups/${groupId}/member_of`;

/** Group names we can resolve for a path: this group plus every group that contains it */
function useGroupNames(groupId: number, groupName: string): GroupNames {
  const { data } = useSWR<GroupMemberOf[]>(memberOfKey(groupId), () =>
    fetchJson<GroupMemberOf[]>(memberOfKey(groupId)),
  );
  return useMemo(() => {
    const names = new Map<number, string>([[groupId, groupName]]);
    (data ?? []).forEach((entry) => names.set(entry.group.id, entry.group.name));
    return names;
  }, [data, groupId, groupName]);
}

/** One chip per path, labelled with group names (ids when a name cannot be resolved). Paths start at the containing group. */
const PathChips = ({ paths, names }: { paths: MembershipPath[]; names: GroupNames }) => (
  <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
    {paths.map((path) => (
      <Chip
        key={path.join("-")}
        size="small"
        variant="outlined"
        label={path.map((id) => names.get(id) ?? `#${id}`).join(" › ")}
        component={Link}
        href={`/groups/details/?id=${path[0]}`}
        clickable
      />
    ))}
  </Stack>
);

const Via = ({ via, names }: { via: MembershipPath[]; names: GroupNames }) =>
  via.length === 0 ? <span>This group</span> : <PathChips paths={via} names={names} />;

/** A Via column for any access row; the names come from the panel, so the cell is made per panel */
function makeViaCell<R extends { via: MembershipPath[] }>(names: GroupNames) {
  const ViaCell = ({ row }: CellComponentProps<R, keyof R>) => (
    <TableCell>
      <Via via={row.via} names={names} />
    </TableCell>
  );
  ViaCell.displayName = "ViaCell";
  return ViaCell;
}

interface PanelProps {
  groupId: number;
  groupName: string;
}

type MemberOfCellProps = CellComponentProps<GroupMemberOf, keyof GroupMemberOf>;

const MemberOfGroupCell = ({ row }: MemberOfCellProps) => (
  <TableCell>
    <MuiLink component={Link} href={`/groups/details/?id=${row.group.id}`}>
      {row.group.name}
    </MuiLink>
  </TableCell>
);

/** Every group this group is a member of, directly or through other groups */
export const GroupMemberOfPanel = ({ groupId, groupName }: PanelProps) => {
  const { data, error, isLoading } = useSWR<GroupMemberOf[]>(memberOfKey(groupId), () =>
    fetchJson<GroupMemberOf[]>(memberOfKey(groupId)),
  );
  const names = useGroupNames(groupId, groupName);

  const columns = useMemo(() => {
    const ThroughCell = ({ row }: MemberOfCellProps) => (
      <TableCell>
        <PathChips paths={row.paths} names={names} />
      </TableCell>
    );
    return [
      { id: "group" as const, name: "Group", CellComponent: MemberOfGroupCell },
      { id: "paths" as const, name: "Through", CellComponent: ThroughCell },
    ];
  }, [names]);

  if (error instanceof ForbiddenError)
    return <Typography color="error">You do not have access to this group</Typography>;

  return (
    <StaticTable data={data ?? []} columns={columns} isLoading={isLoading} emptyMessage="Not a member of any group" />
  );
};

const ProjectCell = ({ row }: CellComponentProps<GroupAccessProject, keyof GroupAccessProject>) => (
  <TableCell>
    <MuiLink component={Link} href={`/projects/details/?id=${row.project_id}`}>
      {row.display_name || row.name}
    </MuiLink>
  </TableCell>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box>
    <Typography variant="h6" component="h2" mb={1}>
      {title}
    </Typography>
    {children}
  </Box>
);

/** Projects and submit nodes a group reaches, directly or through other groups */
export const GroupAccessPanel = ({ groupId, groupName }: PanelProps) => {
  const { data, error, isLoading } = useSWR<GroupAccess>(`/groups/${groupId}/access`, () =>
    fetchJson<GroupAccess>(`/groups/${groupId}/access`),
  );
  const names = useGroupNames(groupId, groupName);

  const columns = useMemo(
    () => ({
      projects: [
        { id: "name" as const, name: "Project", CellComponent: ProjectCell },
        {
          id: "as" as const,
          name: "As",
          value: (project: GroupAccessProject) => (project.as === "pi_group" ? "PI group" : "Project group"),
        },
        { id: "via" as const, name: "Via", CellComponent: makeViaCell<GroupAccessProject>(names) },
      ],
      submitNodes: [
        { id: "name" as const, name: "Name" },
        { id: "via" as const, name: "Via", CellComponent: makeViaCell<GroupAccessSubmitNode>(names) },
      ],
    }),
    [names],
  );

  if (error instanceof ForbiddenError)
    return <Typography color="error">You do not have access to this group</Typography>;
  if (isLoading || !data) return <Skeleton variant="rectangular" height={100} />;

  return (
    <Stack spacing={3}>
      <Section title="Projects">
        <StaticTable data={data.projects} columns={columns.projects} emptyMessage="No projects" />
      </Section>

      <Section title="Submit nodes">
        <StaticTable data={data.submit_nodes} columns={columns.submitNodes} emptyMessage="No submit nodes" />
      </Section>
    </Stack>
  );
};

export default GroupAccessPanel;
