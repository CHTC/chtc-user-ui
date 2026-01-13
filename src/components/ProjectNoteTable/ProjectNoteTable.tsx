import DeleteActionButton from "@/src/components/DeleteActionButton/DeleteActionButton";
import { useTableFetch } from "@/src/utils/useTableFetch";
import { Note } from "@/types";
import { Edit } from "@mui/icons-material";
import { Box, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Tooltip } from "@mui/material";
import Link from "next/link";

interface ProjectNoteTableProps {
  projectId: number;
}

const ProjectNoteTable = ({ projectId }: ProjectNoteTableProps) => {
  const { data: notes, mutate } = useTableFetch<Note[]>(`/projects/${projectId}/notes?date=order_by.desc`);

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Author</TableCell>
          <TableCell>Ticket</TableCell>
          <TableCell>Note</TableCell>
          <TableCell>Date</TableCell>
          <TableCell>Users</TableCell>
          <TableCell>Action</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {notes &&
          (notes || []).map((note) => (
            <TableRow key={note.id}>
              <TableCell>{note.author}</TableCell>
              <TableCell>{note.ticket}</TableCell>
              <TableCell>
                <Tooltip title={note.note || ""} arrow>
                  <span style={{ cursor: "help" }}>
                    {note.note?.substring(0, 50)}
                    {note.note && note.note.length > 50 ? "..." : ""}
                  </span>
                </Tooltip>
              </TableCell>
              <TableCell>{note.date ? new Date(note?.date).toLocaleString() : ""}</TableCell>
              <TableCell>{note.users.map((x) => x.username).join(", ")}</TableCell>
              <TableCell>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <DeleteActionButton
                    url={`/projects/${projectId}/notes/${note.id}`}
                    onSuccess={mutate}
                    ariaLabel="Delete Note"
                  />
                  <IconButton aria-label={"Edit Note"}>
                    <Link href={`/projects/notes/edit?projectId=${projectId}&noteId=${note.id}`}>
                      <Edit />
                    </Link>
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
};

export default ProjectNoteTable;
