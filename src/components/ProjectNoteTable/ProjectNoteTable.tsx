import makeDeleteCell from "@/src/components/Table/DeleteCell/makeDeleteCell";
import ServerTable, { ServerTableColumns, useServerTableRefresh } from "@/src/components/Table/ServerTable";
import type { SortState } from "@/src/components/Table/types";
import { DateCell, makeIconLinkCell, TruncatedTextCell } from "@/src/components/TableCells/TableCells";
import { apiDelete, apiPageFetcher } from "@/src/utils/tableQuery";
import { Note } from "@/types";
import { Edit } from "@mui/icons-material";
import { useMemo } from "react";

interface ProjectNoteTableProps {
  projectId: number;
}

const defaultSort: SortState<keyof Note & string> = { columnId: "date", direction: "desc" };

const fetchOptions = {
  searchFields: ["note", "ticket"],
  tiebreakers: [{ columnId: "id", direction: "desc" }] satisfies SortState[],
};

const ProjectNoteTable = ({ projectId }: ProjectNoteTableProps) => {
  const cacheKey = `/projects/${projectId}/notes`;
  const refresh = useServerTableRefresh(cacheKey);
  const fetchPage = useMemo(() => apiPageFetcher<Note>(cacheKey, fetchOptions), [cacheKey]);

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
      cacheKey={cacheKey}
      fetchPage={fetchPage}
      columns={columns}
      defaultSort={defaultSort}
      defaultPageSize={10}
      urlPrefix="notes."
      searchLabel="Search by Note or Ticket"
      emptyMessage="No notes"
    />
  );
};

export default ProjectNoteTable;
