"use client";

import ActionButton from "@/src/components/ActionButton/ActionButton";
import AddAccordion from "@/src/components/AddAccordion/AddAccordion";
import { useAlert } from "@/src/components/AlertProvider";
import { apiFetch } from "@/src/components/AuthProvider";
import GroupAutocomplete from "@/src/components/GroupAutocomplete/GroupAutocomplete";
import MembershipPaths from "@/src/components/MembershipPaths/MembershipPaths";
import StaticTable from "@/src/components/Table/StaticTable";
import UserAutocomplete from "@/src/components/UserAutocomplete/UserAutocomplete";
import { apiErrorMessage } from "@/src/utils/formErrors";
import type { Group, GroupMembersView, User } from "@/types";
import { Delete, Group as GroupIcon, Person } from "@mui/icons-material";
import type { ActionConfig, CellComponentProps, ColumnConfig } from "@chtc/web-components";
import { Box, Button, Chip, Grid, Link as MuiLink, Stack, TableCell, Typography } from "@mui/material";
import Link from "next/link";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";

/** A row of a members table: a group added to the group directly, or a user with access */
export interface MemberRow {
  key: string;
  kind: "group" | "user";
  id: number;
  name: ReactNode;
  sortName: string;
  netid: string | null;
  access: ReactNode;
  /** Set when the row is a direct member, the only kind that can be removed from this table */
  removeUrl: string | null;
  /** The name used in alerts and aria labels */
  label: string;
  /** The cell of the caller's extra column, when it has one */
  extra?: ReactNode;
}

/** Where to POST to add a member, and what to send */
export interface AddRequest {
  url: string;
  body: Record<string, unknown>;
}

interface MembersTableProps {
  rows: MemberRow[];
  isLoading: boolean;
  /** The viewer cannot see this group's members; shown instead of the table */
  forbidden?: boolean;
  /** Shows the add form and the Remove column on the direct view */
  canAdminister: boolean;
  /**
   * "direct": the groups and users added to the group, with the add form and Remove.
   * "users": every user with access and the path it comes through, read only.
   */
  view?: "direct" | "users";
  addUser: (user: User) => AddRequest;
  addGroup: (group: Group) => AddRequest;
  /** Called after an add or a removal succeeded */
  onChanged: () => void | Promise<unknown>;
  addTitle?: string;
  userLabel?: string;
  groupLabel?: string;
  /** A column between Access and Remove, filled from each row's `extra` */
  extraColumn?: { id: string; name: string };
  emptyMessage?: string;
}

type MemberCellProps = CellComponentProps<MemberRow, keyof MemberRow>;

const NameCell = ({ row }: MemberCellProps) => (
  <TableCell>
    <Stack direction="row" spacing={1} alignItems="center">
      {row.kind === "group" ? (
        <GroupIcon fontSize="small" color="action" titleAccess="Group" />
      ) : (
        <Person fontSize="small" color="action" titleAccess="User" />
      )}
      <span>{row.name}</span>
    </Stack>
  </TableCell>
);

const AccessCell = ({ row }: MemberCellProps) => <TableCell>{row.access}</TableCell>;

const ExtraCell = ({ row }: MemberCellProps) => <TableCell>{row.extra}</TableCell>;

/** A user with access to the group, from the group's members view */
export const userMemberRow = (
  member: GroupMembersView,
  { removeUrl, linkUsers, linkGroups }: { removeUrl: string | null; linkUsers: boolean; linkGroups: boolean },
): MemberRow => {
  const name = member.name ?? member.email1 ?? `User ${member.user_id}`;
  return {
    key: `user-${member.user_id}`,
    kind: "user",
    id: member.user_id,
    name: linkUsers ? (
      <MuiLink component={Link} href={`/users/details/?id=${member.user_id}`}>
        {name}
      </MuiLink>
    ) : (
      name
    ),
    sortName: name,
    netid: member.netid,
    access: (
      <MembershipPaths
        direct={member.direct}
        paths={member.paths}
        path_names={member.path_names}
        linkGroups={linkGroups}
      />
    ),
    removeUrl,
    label: name,
  };
};

/** A group that was added to the group directly */
export const groupMemberRow = (
  group: Group,
  { removeUrl, linkGroups }: { removeUrl: string | null; linkGroups: boolean },
): MemberRow => ({
  key: `group-${group.id}`,
  kind: "group",
  id: group.id,
  name: linkGroups ? (
    <MuiLink component={Link} href={`/groups/details/?id=${group.id}`}>
      {group.name}
    </MuiLink>
  ) : (
    group.name
  ),
  sortName: group.name,
  netid: null,
  access: <Chip size="small" color="primary" label="Direct" />,
  removeUrl,
  label: group.name,
});

/** Member groups first, then users, each by name */
export const sortMemberRows = (rows: MemberRow[]): MemberRow[] => {
  const byName = (a: MemberRow, b: MemberRow) => a.sortName.localeCompare(b.sortName);
  return [
    ...rows.filter((r) => r.kind === "group").sort(byName),
    ...rows.filter((r) => r.kind === "user").sort(byName),
  ];
};

interface AddMemberFormProps<T> {
  buttonLabel: string;
  renderPicker: (value: T | null, onSelect: (item: T | null) => void, disabled: boolean) => ReactNode;
  /** Resolves true when the member was added, which clears the picker */
  onSubmit: (item: T) => Promise<boolean>;
}

/** A picker and an Add button; nothing is added until the button is pressed */
function AddMemberForm<T>({ buttonLabel, renderPicker, onSubmit }: AddMemberFormProps<T>) {
  const [selected, setSelected] = useState<T | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      if (await onSubmit(selected)) setSelected(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack component="form" direction="row" spacing={1} alignItems="center" onSubmit={handleSubmit}>
      <Box sx={{ flexGrow: 1 }}>{renderPicker(selected, setSelected, submitting)}</Box>
      <Button type="submit" variant="contained" disabled={!selected} loading={submitting} sx={{ flexShrink: 0 }}>
        {buttonLabel}
      </Button>
    </Stack>
  );
}

/**
 * The members of a group in one table: the groups added to it directly, then every user with
 * access and how. Adding takes a user or a group; only direct members can be removed here.
 * Every page that manages a group's membership renders this with its own routes.
 */
const MembersTable = ({
  rows,
  isLoading,
  forbidden = false,
  canAdminister,
  view = "direct",
  addUser,
  addGroup,
  onChanged,
  addTitle = "Add member",
  userLabel = "Add user",
  groupLabel = "Add group",
  extraColumn,
  emptyMessage = "No members",
}: MembersTableProps) => {
  const { showAlert } = useAlert();

  const columns = useMemo((): (ColumnConfig<MemberRow> | ActionConfig<MemberRow>)[] => {
    const RemoveCell = ({ row }: MemberCellProps) => (
      <TableCell>
        {row.removeUrl && (
          // Table keys rows by index, so key the button by member to keep an open Confirm on its own row
          <ActionButton
            key={row.removeUrl}
            method="DELETE"
            icon={<Delete />}
            color="error"
            url={row.removeUrl}
            onSuccess={() => {
              showAlert("REMOVE_MEMBER_SUCCESS", row.label);
              void onChanged();
            }}
            ariaLabel={`Remove ${row.label}`}
          />
        )}
      </TableCell>
    );

    return [
      { id: "name", name: "Name", CellComponent: NameCell },
      { id: "netid", name: "NetID" },
      // Every row of the direct view is direct, so only the users view says how access comes about
      ...(view === "users" ? [{ id: "access", name: "Access", CellComponent: AccessCell }] : []),
      ...(extraColumn ? [{ id: extraColumn.id, name: extraColumn.name, CellComponent: ExtraCell }] : []),
      ...(canAdminister && view === "direct" ? [{ id: "remove", name: "Remove", CellComponent: RemoveCell }] : []),
    ];
  }, [canAdminister, extraColumn, onChanged, showAlert, view]);

  if (forbidden) {
    return <Typography color="error">You do not have access to this group</Typography>;
  }

  const add = async ({ url, body }: AddRequest, name: string): Promise<boolean> => {
    const response = await apiFetch(url, { method: "POST", body: JSON.stringify(body) });
    if (!response.ok) {
      // 400 (cycle), 403, 404 and 409 (already a member) carry a readable detail
      showAlert("ACTION_ERROR", await apiErrorMessage(response, "Failed to add member"));
      return false;
    }
    showAlert("ADD_MEMBER_SUCCESS", name);
    await onChanged();
    return true;
  };

  return (
    <>
      {canAdminister && view === "direct" && (
        <AddAccordion title={addTitle}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <AddMemberForm<User>
                buttonLabel={userLabel}
                renderPicker={(value, onSelect, disabled) => (
                  <UserAutocomplete label="User" value={value ?? undefined} onSelect={onSelect} disabled={disabled} />
                )}
                onSubmit={(user) => add(addUser(user), user.name ?? user.email1)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <AddMemberForm<Group>
                buttonLabel={groupLabel}
                renderPicker={(value, onSelect, disabled) => (
                  <GroupAutocomplete label="Group" value={value ?? undefined} onSelect={onSelect} disabled={disabled} />
                )}
                onSubmit={(group) => add(addGroup(group), group.name)}
              />
            </Grid>
          </Grid>
        </AddAccordion>
      )}

      <StaticTable data={rows} columns={columns} isLoading={isLoading} emptyMessage={emptyMessage} />
    </>
  );
};

export default MembersTable;
