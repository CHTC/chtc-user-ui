"use client";

import type { ApiError } from "@/src/components/Forms/UserForm/UserForm";
import ProjectAutocomplete from "@/src/components/ProjectAutocomplete/ProjectAutocomplete";
import SubmitNodeAutocomplete from "@/src/components/SubmitNodeAutocomplete/SubmitNodeAutocomplete";
import type { FormStatusEnum, PositionEnum, Project, SubmitNode, UserForm, UserFormPatch } from "@/types";
import { Alert, Box, Button, Chip, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";

export interface UserApplicationEditFormProps {
  initialValues?: UserForm | null;
  onSubmit: (payload: UserFormPatch) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string | ApiError | null;
  submitSuccess?: boolean;
}

function formatPosition(position: PositionEnum) {
  return position
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function UserApplicationEditForm({
  initialValues,
  onSubmit,
  isSubmitting = false,
  error = null,
  submitSuccess = false,
}: UserApplicationEditFormProps) {
  const [status, setStatus] = useState<FormStatusEnum>(initialValues?.status ?? "PENDING");
  const [project, setProject] = useState<Project | null>(null);
  const [projectPosition, setProjectPosition] = useState<PositionEnum | "">(initialValues?.position ?? "");
  const [selectedSubmitNode, setSelectedSubmitNode] = useState<SubmitNode | null>(null);
  const [submitNodes, setSubmitNodes] = useState<SubmitNode[]>([]);

  const validationMessage = useMemo(() => {
    if (status === "APPROVED") {
      if (!project) {
        return "Select a project before approving.";
      }

      if (projectPosition === "") {
        return "Choose a project position before approving.";
      }

      if (submitNodes.length === 0) {
        return "Add at least one submit node before approving.";
      }
    }

    return null;
  }, [project, projectPosition, status, submitNodes.length]);

  const handleAddSubmitNode = () => {
    if (!selectedSubmitNode || submitNodes.some((node) => node.id === selectedSubmitNode.id)) {
      return;
    }
    setSubmitNodes((current) => [...current, selectedSubmitNode]);
    setSelectedSubmitNode(null);
  };

  const handleRemoveSubmitNode = (id: number) => {
    setSubmitNodes((current) => current.filter((node) => node.id !== id));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationMessage) return;

    await onSubmit({
      status,
      project_id: project?.id ?? 0,
      project_position: projectPosition as PositionEnum,
      submit_nodes: submitNodes.map((node) => node.name),
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="subtitle1">Submitted By</Typography>
          <Typography>{initialValues?.created_by?.name ?? initialValues?.created_by?.email1 ?? "-"}</Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle1">PI</Typography>
          <Typography>
            {initialValues?.pi_name ?? initialValues?.pi_email ?? `User ID ${initialValues?.pi_id ?? "-"}`}
          </Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle1">Requested Position</Typography>
          <Typography>{initialValues?.position ? formatPosition(initialValues.position) : "-"}</Typography>
        </Stack>

        <FormControl fullWidth>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as FormStatusEnum)}
            disabled={isSubmitting || initialValues?.status !== "PENDING"}
          >
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="APPROVED">Approved</MenuItem>
            <MenuItem value="DENIED">Denied</MenuItem>
          </Select>
        </FormControl>

        <ProjectAutocomplete
          value={project ?? undefined}
          onSelect={setProject}
          required={status === "APPROVED"}
          disabled={isSubmitting || status !== "APPROVED"}
        />

        <FormControl fullWidth>
          <InputLabel id="project-position-label">Project Position</InputLabel>
          <Select
            labelId="project-position-label"
            label="Project Position"
            value={projectPosition}
            onChange={(event) => setProjectPosition(event.target.value as PositionEnum | "")}
            disabled={isSubmitting || status !== "APPROVED"}
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

        <Stack spacing={2}>
          <SubmitNodeAutocomplete
            value={selectedSubmitNode ?? undefined}
            onSelect={setSelectedSubmitNode}
            disabled={isSubmitting || status !== "APPROVED"}
          />
          <Box>
            <Button
              type="button"
              variant="outlined"
              onClick={handleAddSubmitNode}
              disabled={!selectedSubmitNode || isSubmitting || status !== "APPROVED"}
            >
              Add Submit Node
            </Button>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {submitNodes.map((node) => (
              <Chip
                key={node.id}
                label={node.name}
                onDelete={isSubmitting || status !== "APPROVED" ? undefined : () => handleRemoveSubmitNode(node.id)}
              />
            ))}
          </Stack>
        </Stack>

        {validationMessage && !submitSuccess ? <Alert severity="info">{validationMessage}</Alert> : null}
        {error ? <Alert severity="error">{typeof error === "string" ? error : "Failed to submit form."}</Alert> : null}

        {!submitSuccess ? (
          <Button type="submit" variant="contained" disabled={Boolean(validationMessage) || isSubmitting}>
            {isSubmitting ? "Submitting..." : "Save"}
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}

export default UserApplicationEditForm;
