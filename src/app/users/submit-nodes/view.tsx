"use client";

import UserShell from "@/src/app/users/_components/UserShell";
import ActionButton from "@/src/components/ActionButton/ActionButton";
import AddAccordion from "@/src/components/AddAccordion/AddAccordion";
import { useAlert } from "@/src/components/AlertProvider";
import { apiFetch } from "@/src/components/AuthProvider";
import StaticTable from "@/src/components/Table/StaticTable";
import { fetchJson } from "@/src/utils/fetchList";
import { apiErrorMessage } from "@/src/utils/formErrors";
import { useRevalidateUserAndGroups } from "@/src/utils/userCache";
import type { ActionConfig, CellComponentProps, ColumnConfig } from "@chtc/web-components";
import type { SubmitNode, User, UserSubmitGet } from "@/types";
import { Delete } from "@mui/icons-material";
import { Button, FormControl, InputLabel, MenuItem, Select, Stack, TableCell, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import useSWR from "swr";

function View() {
  return <UserShell>{(user, id) => <UserSubmitNodes user={user} id={id} />}</UserShell>;
}

/**
 * A user's submit nodes. Access to a node is membership in the node's group, so adding or removing
 * one changes that membership; the API takes the user's whole list and only touches direct memberships.
 */
const UserSubmitNodes = ({ user, id }: { user: User; id: number }) => {
  const { showAlert } = useAlert();
  // Submit node changes are stored as group memberships, so refresh the user and their groups
  const revalidate = useRevalidateUserAndGroups(id);
  const { data: allNodes } = useSWR("/submit_nodes?page_size=1000", (url: string) => fetchJson<SubmitNode[]>(url));

  const [selectedNodeId, setSelectedNodeId] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nodes = useMemo(() => user.submit_nodes ?? [], [user.submit_nodes]);
  const assignedIds = new Set(nodes.map((node) => node.id));
  // Only a node with a group can be granted; nodes the user already has aren't offered again
  const available = (allNodes ?? []).filter((node) => node.group_id !== null && !assignedIds.has(node.id));

  const saveNodes = async (nodeIds: number[]) => {
    const response = await apiFetch(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ submit_nodes: nodeIds.map((nodeId) => ({ submit_node_id: nodeId })) }),
    });
    if (!response.ok) throw new Error(await apiErrorMessage(response, "Failed to update submit nodes"));
    await revalidate();
  };

  const addNode = async () => {
    if (selectedNodeId === "") return;
    setIsSubmitting(true);
    setError(null);
    try {
      await saveNodes([...nodes.map((node) => node.id), selectedNodeId]);
      showAlert("ADD_MEMBER_SUCCESS", allNodes?.find((node) => node.id === selectedNodeId)?.name ?? "submit node");
      setSelectedNodeId("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add submit node");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo((): (ColumnConfig<UserSubmitGet> | ActionConfig<UserSubmitGet>)[] => {
    const RemoveCell = ({ row }: CellComponentProps<UserSubmitGet, keyof UserSubmitGet>) => {
      const remaining = nodes.filter((node) => node.id !== row.id).map((node) => node.id);
      return (
        <TableCell>
          {/* Table keys rows by index, so key the button by node to keep an open Confirm on its own row */}
          <ActionButton
            key={row.id}
            method="PATCH"
            growDirection="left"
            url={`/users/${id}`}
            body={{ submit_nodes: remaining.map((nodeId) => ({ submit_node_id: nodeId })) }}
            icon={<Delete />}
            color="error"
            ariaLabel={`Remove ${row.name}`}
            onSuccess={() => {
              showAlert("REMOVE_MEMBER_SUCCESS", row.name);
              void revalidate();
            }}
          />
        </TableCell>
      );
    };
    return [
      { id: "name", name: "Name" },
      { id: "remove", name: "Remove", CellComponent: RemoveCell },
    ];
  }, [nodes, id, showAlert, revalidate]);

  return (
    <>
      <AddAccordion title="Add submit node">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <FormControl sx={{ flexGrow: 1 }}>
            <InputLabel id="add-submit-node-label">Submit node</InputLabel>
            <Select
              labelId="add-submit-node-label"
              label="Submit node"
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value as number | "")}
              disabled={isSubmitting}
            >
              {available.map((node) => (
                <MenuItem key={node.id} value={node.id}>
                  {node.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={addNode} disabled={selectedNodeId === "" || isSubmitting}>
            Add
          </Button>
        </Stack>
        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </AddAccordion>
      <StaticTable data={nodes} columns={columns} emptyMessage="No submit nodes" />
    </>
  );
};

export default View;
