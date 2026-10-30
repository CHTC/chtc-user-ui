import ActionButton from "@/src/components/ActionButton/ActionButton";
import { useAlert } from "@/src/components/AlertProvider";
import makeDeleteCell from "@/src/components/Table/DeleteCell/makeDeleteCell";
import ServerTable, { ServerTableColumns, useServerTableRefresh } from "@/src/components/Table/ServerTable";
import type { CellComponentProps, SortState } from "@/src/components/Table/types";
import { DateCell, makeLinkedTextCell, makeManagedByCell } from "@/src/components/TableCells/TableCells";
import { apiDelete, apiPageFetcher } from "@/src/utils/tableQuery";
import { JoinedProjectView } from "@/types";
import { Star, StarBorder } from "@mui/icons-material";
import { Box, IconButton, TableCell } from "@mui/material";
import { useMemo } from "react";

interface UserProjectTableProps {
  userId: number;
  adminView?: boolean;
}

// Primary project first, then alphabetical
const defaultSort: SortState<keyof JoinedProjectView & string> = { columnId: "is_primary", direction: "desc" };

const fetchOptions = {
  searchFields: ["project_name"],
  tiebreakers: [
    { columnId: "project_name", direction: "asc" },
    { columnId: "project_id", direction: "asc" },
  ] satisfies SortState[],
};

/** A filled star on the primary project; admins can star another project to make it primary */
function makePrimaryProjectCell({ userId, adminView, onChange }: { userId: number; adminView: boolean; onChange: () => void }) {
  const PrimaryProjectCell = ({ row: project }: CellComponentProps<JoinedProjectView, keyof JoinedProjectView>) => {
    const { showAlert } = useAlert();

    return (
      // Wide enough for the star and its Confirm button, which would otherwise cover the next column
      <TableCell sx={{ minWidth: 176 }}>
        {project.is_primary ? (
          // The primary project is changed by starring another one, so this does nothing
          // Same 48px box and padding as ConfirmButton so the stars line up
          <Box sx={{ width: 48, height: 48, p: 0.5 }}>
            <IconButton aria-label={`${project.project_name} is the primary project`} color="error" disableRipple sx={{ cursor: "default" }}>
              <Star />
            </IconButton>
          </Box>
        ) : (
          adminView && (
            <ActionButton
              key={project.project_id}
              url={`/users/${userId}/projects/${project.project_id}`}
              method="PATCH"
              body={{ is_primary: true }}
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

const UserProjectTable = ({ userId, adminView = false }: UserProjectTableProps) => {
  const cacheKey = `/users/${userId}/projects`;
  const refresh = useServerTableRefresh(cacheKey);
  const fetchPage = useMemo(() => apiPageFetcher<JoinedProjectView>(cacheKey, fetchOptions), [cacheKey]);

  const columns = useMemo(
    (): ServerTableColumns<JoinedProjectView> => ({
      project_name: {
        id: "project_name",
        name: "Name",
        sortable: true,
        CellComponent: makeLinkedTextCell<JoinedProjectView>({
          href: (project) => `/projects/edit/?id=${project.project_id}`,
          ariaLabel: "Go to project",
        }),
      },
      role: { id: "role", name: "Role", sortable: true },
      is_primary: {
        id: "is_primary",
        name: "Is Primary",
        sortable: true,
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
        managed_by: {
          id: "managed_by",
          name: "Managed By",
          CellComponent: makeManagedByCell<JoinedProjectView>({
            patchUrl: (project) => `/projects/${project.project_id}/users/${userId}`,
            onSuccess: refresh,
          }),
        },
        remove: {
          id: "remove",
          name: "Action",
          CellComponent: makeDeleteCell<JoinedProjectView>({
            mutate: refresh,
            handleDelete: (project) => apiDelete(`/projects/${project.project_id}/users/${userId}`),
            confirmButtonProps: { "aria-label": "Delete User" },
          }),
        },
      }),
    }),
    [adminView, userId, refresh],
  );

  return (
    <ServerTable
      cacheKey={cacheKey}
      fetchPage={fetchPage}
      columns={columns}
      defaultSort={defaultSort}
      defaultPageSize={10}
      urlPrefix="projects."
      searchLabel="Search by Project Name"
      emptyMessage="No projects"
    />
  );
};

export default UserProjectTable;
