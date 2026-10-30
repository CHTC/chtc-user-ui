import { apiDelete } from "@/src/components/AuthProvider";
import makeDeleteCell from "@/src/components/Table/DeleteCell/makeDeleteCell";
import ServerTable, { ServerTableColumns, useServerTableRefresh } from "@/src/components/Table/ServerTable";
import type { SortState } from "@/src/components/Table/types";
import { DateCell, makeIconLinkCell, TruncatedTextCell } from "@/src/components/TableCells/TableCells";
import { Note } from "@/types";
import { Edit } from "@mui/icons-material";
import { useMemo } from "react";

interface ProjectNoteTableProps {
  projectId: number;
}

const defaultSort: SortState<keyof Note & string> = { columnId: "date", direction: "desc" };

const searchFields = ["note", "ticket"];

const tiebreakers: SortState[] = [{ columnId: "id", direction: "desc" }];

const ProjectNoteTable = ({ projectId }: ProjectNoteTableProps) => {
  const endpoint = `/projects/${projectId}/notes`;
  const refresh = useServerTableRefresh(endpoint);

  const columns = useMemo(
    (): ServerTableColumns<Note> => ({
      // The API sorts author by user id, not name, so this column isn't sortable
      author: { id: "author", name: "Author", value: (note) => note.author?.name ?? "" },
      ticket: { id: "ticket", name: "Ticket", sortable: true },
      note: { id: "note", name: "Note", CellComponent: TruncatedTextCell },
      date: { id: "date", name: "Date", sortable: true, firstSortDirection: "desc", CellComponent: DateCell },
      // Users without a NetID show their name instead of an empty entry
      users: { id: "users", name: "Users", value: (note) => note.users.map((user) => user.netid || user.name).join(", ") },
      edit: {
        id: "edit",
        name: "Edit",
        CellComponent: makeIconLinkCell<Note>({
          href: (note) => `/projects/notes/edit/?projectId=${projectId}&noteId=${note.id}`,
          icon: <Edit />,
          ariaLabel: "Edit Note",
        }),
      },
      delete: {
        id: "delete",
        name: "Delete",
        CellComponent: makeDeleteCell<Note>({
          mutate: refresh,
          handleDelete: (note) => apiDelete(`/projects/${projectId}/notes/${note.id}`),
          confirmButtonProps: { "aria-label": "Delete Note" },
        }),
      },
    }),
    [projectId, refresh],
  );

  return (
    <ServerTable
      endpoint={endpoint}
      columns={columns}
      defaultSort={defaultSort}
      tiebreakers={tiebreakers}
      defaultPageSize={5}
      urlPrefix="notes."
      searchLabel="Search by Note or Ticket"
      searchFields={searchFields}
      emptyMessage="No notes"
    />
  );
};

export default ProjectNoteTable;
