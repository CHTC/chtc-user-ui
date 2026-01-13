import { apiFetch } from "@/src/components/AuthProvider";
import { Note } from "@/types";
import { ConfirmButton } from "@chtc/web-components";
import { Delete, Edit } from "@mui/icons-material";
import { Box, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Tooltip } from "@mui/material";
import Link from "next/link";
import useSWR from "swr";

interface ProjectNoteTableProps {
  projectId: number;
}

const ProjectNoteTable = ({ projectId }: ProjectNoteTableProps) => {
  const { data: notes, mutate } = useSWR(
    `/projects/${projectId}/notes`,
    async (): Promise<Note[]> => {
      const projectUserResponse = await apiFetch(`/projects/${projectId}/notes?date=order_by.desc`);
      return projectUserResponse.json();
    },
    { suspense: true },
  );

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
                  <ConfirmButton
                    aria-label={"Delete Note"}
                    color={"error"}
                    onConfirm={async () => {
                      await apiFetch(`/projects/${projectId}/notes/${note.id}`, {
                        method: "DELETE",
                      });
                      mutate();
                      // Optionally, you can add a way to refresh the data here
                    }}
                  >
                    <Delete />
                  </ConfirmButton>
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
