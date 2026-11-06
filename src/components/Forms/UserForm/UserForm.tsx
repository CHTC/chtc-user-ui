"use client";

import { apiFetch } from "@/src/components/AuthProvider";
import FormErrorAlert from "@/src/components/FormErrorAlert/FormErrorAlert";
import ProjectAutocomplete from "@/src/components/ProjectAutocomplete/ProjectAutocomplete";
import { ApiError } from "@/src/utils/formErrors";
import type { PositionEnum, UserCreate, UserUpdate } from "@/types";
import { Project, SubmitNode, UserSubmitGet } from "@/types";
import StaticTable from "@/src/components/Table/StaticTable";
import type { ColumnConfig } from "@chtc/web-components";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

export type UserFormMode = "create" | "edit";

// Re-export for backward compatibility
export type { ApiError } from "@/src/utils/formErrors";

export interface UserFormValues {
  name: string;
  email1: string;
  email2: string;
  netid: string;
  phone1: string;
  phone2: string;
  is_admin: boolean;
  active: boolean;
  unix_uid: string; // string in form, converted to number | null
  position: PositionEnum | "";
  primary_project_id: string; // string in form, converted to number
  submit_nodes: number[]; // store selected submit_node IDs for easier diffing
}

export interface UserFormProps {
  mode: UserFormMode;
  /**
   * Initial values for the form. Typically from a User or UserCreate-like payload.
   */
  initialValues?: Partial<UserCreate & UserUpdate>;
  /**
   * Called with cleaned form values converted to API payload shape.
   */
  onSubmit: (payload: UserCreate | Partial<UserUpdate>) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string | ApiError | null;
  adminView?: boolean; // whether to show admin-only fields in submit node table
  /** Off on the user's details page, where submit nodes have their own page */
  showSubmitNodes?: boolean;
}

const SUBMIT_NODE_COLUMNS: ColumnConfig<SubmitNode>[] = [{ id: "name", name: "Name" }];

function normalizeInitialValues(initial?: Partial<UserCreate & UserUpdate>): UserFormValues {
  return {
    name: initial?.name ?? "",
    email1: initial?.email1 ?? "",
    email2: initial?.email2 ?? "",
    netid: initial?.netid ?? "",
    phone1: initial?.phone1 ?? "",
    phone2: initial?.phone2 ?? "",
    is_admin: initial?.is_admin ?? false,
    active: initial?.active ?? true,
    unix_uid: initial?.unix_uid !== undefined && initial?.unix_uid !== null ? String(initial.unix_uid) : "",
    position: initial?.position ?? "",
    primary_project_id:
      initial?.primary_project_id !== undefined && initial?.primary_project_id !== null
        ? String(initial.primary_project_id)
        : "",
    submit_nodes: (initial?.submit_nodes as UserSubmitGet[] | undefined)?.map((x) => x.id) ?? [],
  };
}

// helper to normalize undefined vs null vs empty string for comparison
const normalizeComparable = (value: unknown) => {
  if (value === undefined) return undefined;
  return value === "" ? null : value;
};

const arraysEqual = (a: number[] | undefined, b: number[] | undefined) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
};

// Field name mappings for error display
const FIELD_NAME_MAP: Record<string, string> = {
  name: "Name",
  email1: "Email (primary)",
  email2: "Email (secondary)",
  netid: "NetID",
  phone1: "Phone 1",
  phone2: "Phone 2",
  unix_uid: "Unix UID",
  position: "Position",
  primary_project_id: "Primary Project",
  submit_nodes: "Submit Nodes",
};

export const UserForm: React.FC<UserFormProps> = ({
  mode,
  initialValues,
  onSubmit,
  isSubmitting = false,
  error,
  adminView,
  showSubmitNodes = true,
}) => {
  const [values, setValues] = useState<UserFormValues>(() => normalizeInitialValues(initialValues));
  const [selectedSubmitNodeId, setSelectedSubmitNodeId] = useState<number | "">("");

  const savedSubmitNodeIds = useMemo(
    () => (initialValues?.submit_nodes as UserSubmitGet[] | undefined)?.map((n) => n.id) ?? [],
    [initialValues?.submit_nodes],
  );
  const userSubmitNodeIds = mode === "edit" ? savedSubmitNodeIds : values.submit_nodes;

  // Submit nodes are granted through group membership, so they can change outside this
  // form (e.g. removing a group). Pick up the new set when the fetched user actually
  // changes, without clobbering pending edits on an otherwise identical revalidation.
  const lastSavedSubmitNodeIds = useRef(savedSubmitNodeIds);
  useEffect(() => {
    if (arraysEqual(lastSavedSubmitNodeIds.current, savedSubmitNodeIds)) return;
    lastSavedSubmitNodeIds.current = savedSubmitNodeIds;
    setValues((prev) => ({ ...prev, submit_nodes: savedSubmitNodeIds }));
  }, [savedSubmitNodeIds]);

  // Check if selected node is already assigned
  const isNodeAssigned = selectedSubmitNodeId ? userSubmitNodeIds.includes(selectedSubmitNodeId as number) : false;

  const handleChange = (field: keyof UserFormValues, value: string | boolean | number[]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSubmitNode = () => {
    if (!selectedSubmitNodeId) return;

    // Add to local state - changes will be saved when form is submitted
    handleChange("submit_nodes", [...values.submit_nodes, selectedSubmitNodeId as number]);
    setSelectedSubmitNodeId("");
  };

  const handleRemoveSubmitNode = () => {
    if (!selectedSubmitNodeId) return;

    // Remove from local state - changes will be saved when form is submitted
    const nodeId = selectedSubmitNodeId as number;
    handleChange(
      "submit_nodes",
      values.submit_nodes.filter((id) => id !== nodeId),
    );
    setSelectedSubmitNodeId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "create") {
      const payload: UserCreate = {
        name: values.name || null,
        email1: values.email1,
        email2: values.email2 || null,
        netid: values.netid || null,
        phone1: values.phone1 || null,
        phone2: values.phone2 || null,
        is_admin: values.is_admin,
        active: values.active,
        unix_uid: values.unix_uid ? Number(values.unix_uid) : null,
        position: values.position || null,
        // Optional; when given the API also adds the user to the project
        ...(values.primary_project_id ? { primary_project_id: Number(values.primary_project_id) } : {}),
        ...(values.submit_nodes?.length
          ? { submit_nodes: values.submit_nodes.map((id) => ({ submit_node_id: id })) }
          : {}),
      };

      await onSubmit(payload);
      return;
    }

    // EDIT MODE: build a partial UserUpdate containing only changed fields
    const updatePayload: Partial<UserUpdate> = {};

    const initial = initialValues ?? {};

    const maybeSet = <K extends keyof UserUpdate>(key: K, newVal: UserUpdate[K], initialRaw: unknown) => {
      const normalizedNew = normalizeComparable(newVal);
      const normalizedOld = normalizeComparable(initialRaw as unknown as UserUpdate[K]);
      if (normalizedNew !== normalizedOld) {
        updatePayload[key] = newVal;
      }
    };

    maybeSet("name", (values.name || null) as UserUpdate["name"], initial.name);
    maybeSet("email1", values.email1 as UserUpdate["email1"], initial.email1);
    maybeSet("email2", (values.email2 || null) as UserUpdate["email2"], initial.email2);
    maybeSet("netid", (values.netid || null) as UserUpdate["netid"], initial.netid);
    maybeSet("phone1", (values.phone1 || null) as UserUpdate["phone1"], initial.phone1);
    maybeSet("phone2", (values.phone2 || null) as UserUpdate["phone2"], initial.phone2);
    maybeSet("is_admin", values.is_admin as UserUpdate["is_admin"], initial.is_admin);
    maybeSet("active", values.active as UserUpdate["active"], initial.active);
    maybeSet(
      "unix_uid",
      (values.unix_uid ? Number(values.unix_uid) : null) as UserUpdate["unix_uid"],
      initial.unix_uid,
    );
    maybeSet("position", (values.position || null) as UserUpdate["position"], initial.position);

    // Staff only (the API ignores it otherwise); an emptied field sends null, which clears it
    if (adminView) {
      maybeSet(
        "primary_project_id",
        (values.primary_project_id ? Number(values.primary_project_id) : null) as UserUpdate["primary_project_id"],
        initial.primary_project_id,
      );
    }

    // Handle submit_nodes diff for edit: compare ID arrays, and only set if changed
    if (!arraysEqual(values.submit_nodes, savedSubmitNodeIds)) {
      updatePayload.submit_nodes = values.submit_nodes.map((id) => ({ submit_node_id: id }));
    }

    await onSubmit(updatePayload);
  };

  const { data: submitNodes } = useSWR<SubmitNode[]>("/submit_nodes", async () => {
    const response = await apiFetch("/submit_nodes");
    return response.json();
  });

  const validSubmitNodes = submitNodes?.filter((node) => node.group_id !== null);

  // The user's submit nodes as rows for the table; ids the node list doesn't know are left out
  const selectedSubmitNodes = values.submit_nodes
    .map((nodeId) => submitNodes?.find((n) => n.id === nodeId))
    .filter((node): node is SubmitNode => !!node);

  // One field per row, except the two emails and the two phones, which pair up; all stack on narrow screens
  const half = { xs: 12, md: 6 };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <FormErrorAlert error={error ?? null} fieldNameMap={FIELD_NAME_MAP} />

      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            label="Name"
            value={values.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            fullWidth
            disabled={isSubmitting}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            label="NetID"
            required={values.active === true}
            value={values.netid}
            onChange={(e) => handleChange("netid", e.target.value)}
            fullWidth
            disabled={isSubmitting || !adminView}
          />
        </Grid>
        {adminView && (
          <Grid size={12}>
            <ProjectAutocomplete
              onSelect={(project: Project | null) => {
                handleChange("primary_project_id", String(project?.id ?? ""));
              }}
              value={values.primary_project_id ? { id: parseInt(values.primary_project_id, 10) } : undefined}
              label="Primary Project"
              helperText={mode === "create" ? "Also adds the user to the project" : undefined}
              disabled={isSubmitting}
            />
          </Grid>
        )}
        <Grid size={half}>
          <TextField
            label="Email (primary)"
            value={values.email1}
            onChange={(e) => handleChange("email1", e.target.value)}
            required
            fullWidth
            disabled={isSubmitting || !adminView}
          />
        </Grid>
        <Grid size={half}>
          <TextField
            label="Email (secondary)"
            value={values.email2}
            onChange={(e) => handleChange("email2", e.target.value)}
            fullWidth
            disabled={isSubmitting}
          />
        </Grid>
        <Grid size={half}>
          <TextField
            label="Phone 1"
            value={values.phone1}
            onChange={(e) => handleChange("phone1", e.target.value)}
            fullWidth
            disabled={isSubmitting}
          />
        </Grid>
        <Grid size={half}>
          <TextField
            label="Phone 2"
            value={values.phone2}
            onChange={(e) => handleChange("phone2", e.target.value)}
            fullWidth
            disabled={isSubmitting}
          />
        </Grid>
        <Grid size={12}>
          <FormControl fullWidth>
            <InputLabel id="position-label">Position</InputLabel>
            <Select
              labelId="position-label"
              label="Position"
              value={values.position}
              onChange={(e) => handleChange("position", e.target.value as PositionEnum | "")}
              disabled={isSubmitting || !adminView}
            >
              <MenuItem value="">Select Position</MenuItem>
              <MenuItem value="FACULTY">Faculty</MenuItem>
              <MenuItem value="STAFF">Staff</MenuItem>
              <MenuItem value="POSTDOC">Postdoc</MenuItem>
              <MenuItem value="GRAD_STUDENT">Grad Student</MenuItem>
              <MenuItem value="UNDERGRADUATE">Undergraduate</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={12}>
          <TextField
            label="Unix UID"
            value={values.unix_uid}
            onChange={(e) => handleChange("unix_uid", e.target.value)}
            fullWidth
            disabled={isSubmitting || !adminView}
            helperText="Optional numeric UNIX user ID"
          />
        </Grid>

        <Grid size={12}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.active}
                  onChange={(e) => handleChange("active", e.target.checked)}
                  disabled={isSubmitting || !adminView}
                />
              }
              label="Active (must have NetID)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.is_admin}
                  onChange={(e) => handleChange("is_admin", e.target.checked)}
                  disabled={isSubmitting || !adminView}
                />
              }
              label="Is Admin"
            />
          </Box>
        </Grid>

        {showSubmitNodes && (
          <Grid size={12}>
            <Stack spacing={2}>
              <Typography variant="h6" component="h3">
                Submit Nodes
              </Typography>
              {adminView && (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                  <FormControl sx={{ flexGrow: 1 }}>
                    <InputLabel id="submit-node-label">Select Submit Node</InputLabel>
                    <Select
                      labelId="submit-node-label"
                      label="Select Submit Node"
                      value={selectedSubmitNodeId}
                      onChange={(e) => setSelectedSubmitNodeId(e.target.value as number)}
                      disabled={isSubmitting}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {validSubmitNodes?.map((node) => (
                        <MenuItem key={node.id} value={node.id}>
                          {node.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddSubmitNode}
                    disabled={!selectedSubmitNodeId || isNodeAssigned || isSubmitting}
                  >
                    Add
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleRemoveSubmitNode}
                    disabled={!selectedSubmitNodeId || !isNodeAssigned || isSubmitting}
                  >
                    Remove
                  </Button>
                </Stack>
              )}
              <StaticTable
                data={selectedSubmitNodes}
                columns={SUBMIT_NODE_COLUMNS}
                emptyMessage="No submit nodes selected"
              />
            </Stack>
          </Grid>
        )}

        <Grid size={12}>
          <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserForm;
