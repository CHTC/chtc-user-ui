"use client";

import { apiFetch } from "@/src/components/AuthProvider";
import ProjectAutocomplete from "@/src/components/ProjectAutocomplete/ProjectAutocomplete";
import type { PositionEnum, RoleEnum, UserCreate, UserUpdate } from "@/types";
import { Project, SubmitNode, UserSubmitNodeCreate } from "@/types";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import React, { useState } from "react";
import useSWR from "swr";

export type UserFormMode = "create" | "edit";

export interface UserFormValues {
  username: string;
  name: string;
  email1: string;
  email2: string;
  netid: string;
  phone1: string;
  phone2: string;
  is_admin: boolean;
  auth_netid: boolean;
  auth_username: boolean;
  unix_uid: string; // string in form, converted to number | null
  position: PositionEnum | "";
  password: string;
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
  error?: string | null;
}

function normalizeInitialValues(initial?: Partial<UserCreate & UserUpdate>): UserFormValues {
  return {
    username: initial?.username ?? "",
    name: initial?.name ?? "",
    email1: initial?.email1 ?? "",
    email2: initial?.email2 ?? "",
    netid: initial?.netid ?? "",
    phone1: initial?.phone1 ?? "",
    phone2: initial?.phone2 ?? "",
    is_admin: initial?.is_admin ?? false,
    auth_netid: initial?.auth_netid ?? false,
    auth_username: initial?.auth_username ?? false,
    unix_uid: initial?.unix_uid !== undefined && initial?.unix_uid !== null ? String(initial.unix_uid) : "",
    position: initial?.position ?? "",
    password: initial?.password ?? "",
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

export const UserForm: React.FC<UserFormProps> = ({ mode, initialValues, onSubmit, isSubmitting = false, error }) => {
  const [values, setValues] = useState<UserFormValues>(() => normalizeInitialValues(initialValues));

  const handleChange = (field: keyof UserFormValues, value: string | boolean | number[]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "create") {
      const payload: UserCreate = {
        username: values.username || null,
        name: values.name || null,
        email1: values.email1,
        email2: values.email2 || null,
        netid: values.netid || null,
        phone1: values.phone1 || null,
        phone2: values.phone2 || null,
        is_admin: values.is_admin,
        auth_netid: values.auth_netid,
        auth_username: values.auth_username,
        unix_uid: values.unix_uid ? Number(values.unix_uid) : null,
        position: values.position || null,
        password: values.password || null,
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

    maybeSet("username", (values.username || null) as UserUpdate["username"], initial.username);
    maybeSet("name", (values.name || null) as UserUpdate["name"], initial.name);
    maybeSet("email1", values.email1 as UserUpdate["email1"], initial.email1);
    maybeSet("email2", (values.email2 || null) as UserUpdate["email2"], initial.email2);
    maybeSet("netid", (values.netid || null) as UserUpdate["netid"], initial.netid);
    maybeSet("phone1", (values.phone1 || null) as UserUpdate["phone1"], initial.phone1);
    maybeSet("phone2", (values.phone2 || null) as UserUpdate["phone2"], initial.phone2);
    maybeSet("is_admin", values.is_admin as UserUpdate["is_admin"], initial.is_admin);
    maybeSet("auth_netid", values.auth_netid as UserUpdate["auth_netid"], initial.auth_netid);
    maybeSet("auth_username", values.auth_username as UserUpdate["auth_username"], initial.auth_username);
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
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, maxWidth: 600 }}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Username"
          value={values.username}
          onChange={(e) => handleChange("username", e.target.value)}
          fullWidth
          disabled={isSubmitting}
        />

        <TextField
          label="Name"
          value={values.name}
          onChange={(e) => handleChange("name", e.target.value)}
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
          value={values.netid}
          onChange={(e) => handleChange("netid", e.target.value)}
          fullWidth
          disabled={isSubmitting}
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
          disabled={isSubmitting}
          helperText="Optional numeric UNIX user ID"
        />

        <FormControl fullWidth>
          <InputLabel id="position-label">Position</InputLabel>
          <Select
            labelId="position-label"
            label="Position"
            value={values.position}
            onChange={(e) => handleChange("position", e.target.value as PositionEnum | "")}
            disabled={isSubmitting}
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

        {submitNodes && Array.isArray(submitNodes) && submitNodes.length > 0 && (
          <Box>
            <Box sx={{ mb: 1, fontWeight: 500 }}>Submit Nodes</Box>
            <Stack direction="column" spacing={0} flexWrap="wrap">
              {submitNodes.map((node) => {
                const checked = values.submit_nodes.includes(node.id);
                return (
                  <FormControlLabel
                    key={node.id}
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...values.submit_nodes, node.id]
                            : values.submit_nodes.filter((id) => id !== node.id);
                          handleChange("submit_nodes", next);
                        }}
                        disabled={isSubmitting}
                      />
                    }
                    label={node.name}
                  />
                );
              })}
            </Stack>
          </Box>
        )}

        {mode === "create" && (
          <ProjectAutocomplete
            onSelect={(project: Project | null) => {
              handleChange("primary_project_id", String(project?.id ?? ""));
            }}
            value={values.primary_project_id ? { id: parseInt(values.primary_project_id, 10) } : undefined}
          />
        )}

        {mode === "create" && (
          <FormControl fullWidth>
            <InputLabel id="primary-project-role-label">Primary Project Role</InputLabel>
            <Select
              labelId="primary-project-role-label"
              label="Primary Project Role"
              value={values.primary_project_role}
              onChange={(e) => handleChange("primary_project_role", e.target.value as RoleEnum | "")}
              disabled={isSubmitting}
            >
              <MenuItem value="">Select Role</MenuItem>
              <MenuItem value="MEMBER">Member</MenuItem>
              <MenuItem value="PI">PI</MenuItem>
            </Select>
          </FormControl>
        )}

        <FormControlLabel
          control={
            <Checkbox
              checked={values.is_admin}
              onChange={(e) => handleChange("is_admin", e.target.checked)}
              disabled={isSubmitting}
            />
          }
          label="Is Admin"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={values.auth_netid}
              onChange={(e) => handleChange("auth_netid", e.target.checked)}
              disabled={isSubmitting}
            />
          }
          label="Auth via NetID"
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={values.auth_username}
              onChange={(e) => handleChange("auth_username", e.target.checked)}
              disabled={isSubmitting}
            />
          }
          label="Auth via Username"
        />

        {mode === "create" && (
          <TextField
            label="Password"
            type="password"
            value={values.password}
            onChange={(e) => handleChange("password", e.target.value)}
            fullWidth
            disabled={isSubmitting}
          />
        )}

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default UserForm;
