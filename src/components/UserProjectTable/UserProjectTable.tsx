import ActionButton from "@/src/components/ActionButton/ActionButton";
import { useAlert } from "@/src/components/AlertProvider";
import makeDeleteCell from "@/src/components/Table/DeleteCell/makeDeleteCell";
import ServerTable, { ServerTableColumns, useServerTableRefresh } from "@/src/components/Table/ServerTable";
import type { CellComponentProps, SortState } from "@chtc/web-components";
import { DateCell, makeLinkedTextCell } from "@/src/components/TableCells/TableCells";
import { JoinedProjectView } from "@/types";
import { Check, Star, StarBorder } from "@mui/icons-material";
import { Box, IconButton, TableCell, Tooltip } from "@mui/material";
import { useCallback, useMemo } from "react";
import { useRevalidateUserAndGroups } from "@/src/utils/userCache";

interface UserProjectTableProps {
  userId: number;
  /** Staff view: shows the primary and remove controls */
  adminView?: boolean;
}

type ProjectCellProps = CellComponentProps<JoinedProjectView, keyof JoinedProjectView>;

const defaultSort: SortState<keyof JoinedProjectView & string> = { columnId: "project_name", direction: "asc" };

const searchFields = ["project_name"];

const tiebreakers: SortState[] = [
  { columnId: "project_name", direction: "asc" },
  { columnId: "project_id", direction: "asc" },
];

const PiCell = ({ row }: ProjectCellProps) => (
  <TableCell>{row.is_pi && <Check aria-label="PI" color="success" />}</TableCell>
);

/** A filled star on the primary project; admins can star another project to make it primary */
function makePrimaryProjectCell({
  userId,
  adminView,
  onChange,
}: {
  userId: number;
  adminView: boolean;
  onChange: () => void;
}) {
  const PrimaryProjectCell = ({ row: project }: ProjectCellProps) => {
    const { showAlert } = useAlert();

    return (
      // Wide enough for the star and its Confirm button, which would otherwise cover the next column
      <TableCell sx={{ minWidth: 176 }}>
        {project.is_primary ? (
          // The primary project is changed by starring another one, so this does nothing
          // Same 48px box and padding as ConfirmButton so the stars line up
          <Box sx={{ width: 48, height: 48, p: 0.5 }}>
            <IconButton
              aria-label={`${project.project_name} is the primary project`}
              color="error"
              disableRipple
              sx={{ cursor: "default" }}
            >
              <Star />
            </IconButton>
          </Box>
        ) : (
          adminView && (
            <ActionButton
              key={project.project_id}
              url={`/users/${userId}`}
              method="PATCH"
              body={{ primary_project_id: project.project_id }}
              icon={<StarBorder />}
              color="error"
              ariaLabel={`Make ${project.project_name} the primary project`}
              onSuccess={() => {
                showAlert("UPDATE_PRIMARY_PROJECT_SUCCESS", project.project_name);
                onChange();
              }}
              onError={(detail) => showAlert("UPDATE_PRIMARY_PROJECT_ERROR", detail)}
            />
          )
        )}
      </TableCell>
    );
  };
  PrimaryProjectCell.displayName = "PrimaryProjectCell";
  return PrimaryProjectCell;
}

/** Remove for a direct member; otherwise access comes through another group and is removed there */
function makeRemoveCell({ userId, onRemove }: { userId: number; onRemove: () => void }) {
  const DeleteCell = makeDeleteCell<JoinedProjectView>({
    mutate: onRemove,
    deleteUrl: (project) => `/projects/${project.project_id}/users/${userId}`,
    ariaLabel: "Remove from Project",
  });
  const RemoveCell = (props: ProjectCellProps) =>
    props.row.direct ? (
      <DeleteCell {...props} />
    ) : (
      <TableCell>
        {/* This view carries no paths, so it cannot say which group; the project page can */}
        <Tooltip title="Access comes through another group. See the project's members table for the path.">
          <span>via group</span>
        </Tooltip>
      </TableCell>
    );
  RemoveCell.displayName = "RemoveCell";
  return RemoveCell;
}

const UserProjectTable = ({ userId, adminView = false }: UserProjectTableProps) => {
  const endpoint = `/users/${userId}/projects`;
  const refreshTable = useServerTableRefresh(endpoint);
  // The primary project and the memberships are also on the cached user record, which the
  // Details and Groups tabs render; a stale copy there would let the form write the old value back
  const revalidateUser = useRevalidateUserAndGroups(userId);
  const refresh = useCallback(async () => {
    await Promise.all([refreshTable(), revalidateUser()]);
  }, [refreshTable, revalidateUser]);

  const columns = useMemo(
    (): ServerTableColumns<JoinedProjectView> => ({
      project_name: {
        id: "project_name",
        name: "Name",
        sortable: true,
        // A user may open a project's page only as its PI (the API's project view rule); staff open any
        CellComponent: makeLinkedTextCell<JoinedProjectView>({
          href: (project) => `/projects/details/?id=${project.project_id}`,
          ariaLabel: "Go to project",
          canOpen: (project) => adminView || !!project.is_pi,
        }),
      },
      is_pi: { id: "is_pi", name: "PI", sortable: true, firstSortDirection: "desc", CellComponent: PiCell },
      is_primary: {
        id: "is_primary",
        name: "Primary",
        sortable: true,
        firstSortDirection: "desc",
        CellComponent: makePrimaryProjectCell({ userId, adminView, onChange: refresh }),
      },
      project_status: { id: "project_status", name: "Status", sortable: true },
      project_last_contact: {
        id: "project_last_contact",
        name: "Last Contact",
        sortable: true,
        firstSortDirection: "desc",
        CellComponent: DateCell,
      },
      project_accounting_group: { id: "project_accounting_group", name: "Accounting Group", sortable: true },
      ...(adminView && {
        remove: {
          id: "remove",
          name: "Action",
          CellComponent: makeRemoveCell({ userId, onRemove: refresh }),
        },
      }),
    }),
    [adminView, userId, refresh],
  );

  return (
    <ServerTable
      endpoint={endpoint}
      columns={columns}
      defaultSort={defaultSort}
      tiebreakers={tiebreakers}
      defaultPageSize={5}
      urlPrefix="projects."
      searchLabel="Search by Project Name"
      searchFields={searchFields}
      emptyMessage="No projects"
    />
  );
};

export default UserProjectTable;
