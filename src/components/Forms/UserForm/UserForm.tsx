"use client";

import { apiFetch } from "@/src/components/AuthProvider";
import FormErrorAlert from "@/src/components/FormErrorAlert/FormErrorAlert";
import ProjectAutocomplete from "@/src/components/ProjectAutocomplete/ProjectAutocomplete";
import { ApiError } from "@/src/utils/formErrors";
import type { PositionEnum, RoleEnum, UserCreate, UserUpdate } from "@/types";
import { Project, SubmitNode, UserSubmitGet, UserSubmitNodeCreate } from "@/types";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
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
  primary_project_role: RoleEnum | "";
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
}

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
    primary_project_role: initial?.primary_project_role ?? "",
    submit_nodes: (initial?.submit_nodes as UserSubmitNodeCreate[] | undefined)?.map((x) => x.submit_node_id) ?? [],
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
  primary_project_role: "Primary Project Role",
  submit_nodes: "Submit Nodes",
};

export const UserForm: React.FC<UserFormProps> = ({ mode, initialValues, onSubmit, isSubmitting = false, error, adminView }) => {
  const [values, setValues] = useState<UserFormValues>(() => normalizeInitialValues(initialValues));
  const [selectedSubmitNodeId, setSelectedSubmitNodeId] = useState<number | "">("");

  // Check if selected node is already assigned
  const userSubmitNodeIds =
    mode === "edit"
      ? ((initialValues?.submit_nodes as UserSubmitGet[] | undefined)?.map((n) => n.submit_node_id) ?? [])
      : values.submit_nodes;
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
        primary_project_id: Number(values.primary_project_id),
        primary_project_role: values.primary_project_role as RoleEnum,
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

    // Handle submit_nodes diff for edit: compare ID arrays, and only set if changed
    const initialSubmitNodeIds =
      (initial.submit_nodes as UserSubmitNodeCreate[] | undefined)?.map((x) => x.submit_node_id) ?? [];
    if (!arraysEqual(values.submit_nodes, initialSubmitNodeIds)) {
      updatePayload.submit_nodes = values.submit_nodes.map((id) => ({ submit_node_id: id }));
    }

    await onSubmit(updatePayload);
  };

  const { data: submitNodes } = useSWR<SubmitNode[]>("/submit_nodes", async () => {
    const response = await apiFetch("/submit_nodes");
    return response.json();
  });

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <FormErrorAlert error={error ?? null} fieldNameMap={FIELD_NAME_MAP} />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h4">Basic Info</Typography>
          <Stack spacing={2} mt={2}>
            <TextField
              label="Name"
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              fullWidth
              disabled={isSubmitting}
            />

            <TextField
              label="Email (primary)"
              value={values.email1}
              onChange={(e) => handleChange("email1", e.target.value)}
              required
              fullWidth
              disabled={isSubmitting}
            />

            <TextField
              label="Email (secondary)"
              value={values.email2}
              onChange={(e) => handleChange("email2", e.target.value)}
              fullWidth
              disabled={isSubmitting}
            />

            <TextField
              label="NetID"
              required={values.active === true}
              value={values.netid}
              onChange={(e) => handleChange("netid", e.target.value)}
              fullWidth
              disabled={isSubmitting || !adminView}
            />

            <TextField
              label="Phone 1"
              value={values.phone1}
              onChange={(e) => handleChange("phone1", e.target.value)}
              fullWidth
              disabled={isSubmitting}
            />

            <TextField
              label="Phone 2"
              value={values.phone2}
              onChange={(e) => handleChange("phone2", e.target.value)}
              fullWidth
              disabled={isSubmitting}
            />

            <TextField
              label="Unix UID"
              value={values.unix_uid}
              onChange={(e) => handleChange("unix_uid", e.target.value)}
              fullWidth
              disabled={isSubmitting || !adminView}
              helperText="Optional numeric UNIX user ID"
            />

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

            {mode === "create" && adminView && (
              <ProjectAutocomplete
                onSelect={(project: Project | null) => {
                  handleChange("primary_project_id", String(project?.id ?? ""));
                }}
                value={values.primary_project_id ? { id: parseInt(values.primary_project_id, 10) } : undefined}
                required
              />
            )}

            {mode === "create" && adminView && (
              <FormControl fullWidth>
                <InputLabel id="primary-project-role-label">Primary Project Role</InputLabel>
                <Select
                  labelId="primary-project-role-label"
                  label="Primary Project Role"
                  value={values.primary_project_role}
                  onChange={(e) => handleChange("primary_project_role", e.target.value as RoleEnum | "")}
                  required
                  disabled={isSubmitting}
                >
                  <MenuItem value="">Select Role</MenuItem>
                  <MenuItem value="MEMBER">Member</MenuItem>
                  <MenuItem value="PI">PI</MenuItem>
                </Select>
              </FormControl>
            )}

            <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
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
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
              <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                {mode === "create" ? "Create" : "Save"}
              </Button>
            </Box>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={2}>
            <Typography variant="h4">Submit Nodes</Typography>

            {adminView && (
              <Stack direction="row" spacing={2} alignItems="center">
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
                    {submitNodes?.map((node) => (
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
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  {mode === "edit" && (
                    <>
                      <TableCell>Disk Quota</TableCell>
                      <TableCell>HPC Disk</TableCell>
                      <TableCell>HPC Inode</TableCell>
                      <TableCell>Job Limit</TableCell>
                      <TableCell>Core Limit</TableCell>
                      <TableCell>Fairshare</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {values.submit_nodes.length > 0 ? (
                  values.submit_nodes.map((nodeId) => {
                    const node = submitNodes?.find((n) => n.id === nodeId);
                    if (!node) return null;

                    if (mode === "edit") {
                      // For edit mode, try to get quota info from initialValues
                      const initialNode = (initialValues?.submit_nodes as UserSubmitGet[] | undefined)?.find(
                        (n) => n.submit_node_id === nodeId,
                      );
                      return (
                        <TableRow key={nodeId}>
                          <TableCell>{node.name}</TableCell>
                          <TableCell>{initialNode?.disk_quota ?? ""}</TableCell>
                          <TableCell>{initialNode?.hpc_diskquota ?? ""}</TableCell>
                          <TableCell>{initialNode?.hpc_inodequota ?? ""}</TableCell>
                          <TableCell>{initialNode?.hpc_joblimit ?? ""}</TableCell>
                          <TableCell>{initialNode?.hpc_corelimit ?? ""}</TableCell>
                          <TableCell>{initialNode?.hpc_fairshare ?? ""}</TableCell>
                        </TableRow>
                      );
                    } else {
                      // For create mode, just show the name
                      return (
                        <TableRow key={nodeId}>
                          <TableCell>{node.name}</TableCell>
                        </TableRow>
                      );
                    }
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={mode === "edit" ? 7 : 1} align="center">
                      No submit nodes selected
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserForm;
