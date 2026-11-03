"use client";

import {AuthGuard} from "@/src/components/AuthGuard";
import {apiFetch, useAuthClient} from "@/src/components/AuthProvider";
import ActionButton from "@/src/components/ActionButton/ActionButton";
import ProjectDataAccess from "@/src/components/ProjectDataAccess/ProjectDataAccess";
import ProjectMembersTable from "@/src/components/ProjectMembersTable/ProjectMembersTable";
import ProjectPiTable from "@/src/components/ProjectPiTable/ProjectPiTable";
import {ProjectForm} from "@/src/components/Forms/ProjectForm/ProjectForm";
import ProjectNoteTable from "@/src/components/ProjectNoteTable/ProjectNoteTable";
import {ApiError} from "@/src/utils/formErrors";
import usePageTitle from "@/src/utils/usePageTitle";
import { ProjectForbiddenError, useProject } from "@/src/utils/useProject";
import type {ProjectCreateUpdate} from "@/types";
import {Add, Delete} from "@mui/icons-material";
import {Alert, Box, Breadcrumbs, Button, Chip, Link, Skeleton, Stack, Typography} from "@mui/material";

import NextLink from "next/link";
import {useSearchParams} from "next/navigation";
import {Component, type ReactNode, Suspense, useState} from "react";
import {useAlert} from "@/src/components/AlertProvider";

/** Shows a short message for a 403 on the project; any other error is rethrown to the app's boundary */
class ForbiddenBoundary extends Component<{ children: ReactNode }, { forbidden: boolean }> {
  state = { forbidden: false };
  static getDerivedStateFromError(error: unknown) {
    if (error instanceof ProjectForbiddenError) return { forbidden: true };
    throw error;
  }
  render() {
    if (this.state.forbidden) return <Typography color="error">You do not have access to this project.</Typography>;
    return this.props.children;
  }
}

function View() {
  const { showAlert } = useAlert()

  const handleSubmit = async (
    id: number,
    payload: ProjectCreateUpdate,
    update: () => void,
    setError: (error: string | ApiError | null) => void,
    setIsSubmitting: (isSubmitting: boolean) => void,
  ) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to parse structured error response
        try {
          const errorData = await response.json();
          setError(errorData as ApiError);
        } catch {
          // Fallback to status text if JSON parsing fails
          setError(`Failed to update project: ${response.statusText}`);
        }
        return;
      }

      update();

      showAlert("UPDATE_PROJECT_SUCCESS")
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to update project";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard message="You must be logged in to edit a project.">
      <Box>
        <Breadcrumbs>
          <Typography color="text.primary">Update Project</Typography>
        </Breadcrumbs>
        <ForbiddenBoundary>
          <Suspense fallback={<Skeleton variant={"rectangular"} height={"100"} />}>
            <ProjectPage handleSubmit={handleSubmit} />
          </Suspense>
        </ForbiddenBoundary>
      </Box>
    </AuthGuard>
  );
}

const ProjectFormSuspense = ({
  id,
  handleSubmit,
}: {
  id: number | null;
  handleSubmit: (
    id: number,
    payload: ProjectCreateUpdate,
    update: () => void,
    setError: (error: string | ApiError | null) => void,
    setIsSubmitting: (isSubmitting: boolean) => void,
  ) => Promise<void>;
}) => {
  const { data: project, mutate } = useProject(id);
  const { currentUser } = useAuthClient();
  const { showAlert } = useAlert();
  const [error, setError] = useState<string | ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  usePageTitle(project ? "Project: " + project.name : null);

  if (!id) {
    return <p>No project ID provided.</p>;
  }

  const expiredAt = project?.expires_at ? new Date(project.expires_at) : null;
  const isExpired = expiredAt !== null && expiredAt.getTime() < Date.now();

  return (
    <>
      {isExpired && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This project expired on {expiredAt.toLocaleString()}.
        </Alert>
      )}
      {currentUser?.is_admin && !isExpired && (
        <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          {/* Nothing is removed: the API sets expires_at to now */}
          <Typography>Expire project</Typography>
          <ActionButton
            method="DELETE"
            icon={<Delete />}
            color="error"
            url={`/projects/${id}`}
            ariaLabel="Expire project"
            onSuccess={() => {
              showAlert("EXPIRE_PROJECT_SUCCESS", project?.name ?? "");
              void mutate();
            }}
          />
        </Box>
      )}
      <ProjectForm
        // The form copies its initial values once, so remount it when the saved project changes
        key={`${project?.expires_at}-${project?.pi_group_id}-${project?.project_group_id}`}
        mode="edit"
        initialValues={project}
        onSubmit={(payload: ProjectCreateUpdate) => handleSubmit(id, payload, mutate, setError, setIsSubmitting)}
        error={error}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

const ProjectPage = ({
  handleSubmit,
}: {
  handleSubmit: (
    id: number,
    payload: ProjectCreateUpdate,
    update: () => void,
    setError: (error: string | ApiError | null) => void,
    setIsSubmitting: (isSubmitting: boolean) => void,
  ) => Promise<void>;
}) => {
  const searchParams = useSearchParams();
  const id = Number.parseInt(searchParams.get("id") || "") || null;

  if (!id) {
    return <Typography color="error">No project ID provided.</Typography>;
  }

  return (
    <>
      <Box id="top" sx={{ scrollMarginTop: "80px" }}>
        <Stack direction="row" spacing={2}>
          <Link href="#users">Jump to Members</Link>
          <Link href="#pis">Jump to PIs</Link>
          <Link href="#notes">Jump to Notes</Link>
        </Stack>
      </Box>
      <Box my={3}>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
          <ProjectFormSuspense id={id} handleSubmit={handleSubmit} />
        </Suspense>
      </Box>
      <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
        <ProjectBody id={id} />
      </Suspense>
    </>
  );
};

/** Everything below the metadata form; it needs the project's group ids, so it waits for the project */
const ProjectBody = ({ id }: { id: number }) => {
  const { data: project } = useProject(id);
  const { currentUser } = useAuthClient();
  const isStaff = !!currentUser?.is_admin;

  if (!project) return null;

  return (
    <>
      <Box id="users" my={4} sx={{ scrollMarginTop: "80px" }}>
        <Typography variant={"h4"} component="h3" sx={{ mb: 2 }}>
          Members
        </Typography>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
          <ProjectMembersTable projectId={id} project={project} />
        </Suspense>
      </Box>
      <Box id="pis" my={4} sx={{ scrollMarginTop: "80px" }}>
        <Typography variant={"h4"} component="h3" sx={{ mb: 2 }}>
          PIs
        </Typography>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"200px"} />}>
          <ProjectPiTable projectId={id} />
        </Suspense>
      </Box>
      {isStaff && (
        <Box my={4}>
          <Typography variant={"h4"} component="h3" sx={{ mb: 2 }}>
            Data Access
          </Typography>
          <Suspense fallback={<Skeleton variant={"rectangular"} height={"60px"} />}>
            <ProjectDataAccess projectGroupId={project.project_group_id} />
          </Suspense>
        </Box>
      )}
      {(project.pi_group_id || project.project_group_id) && (
        <Stack direction="row" spacing={1} my={4}>
          {project.pi_group_id && (
            <Chip label="PI group" component={NextLink} href={`/groups/edit?id=${project.pi_group_id}`} clickable />
          )}
          {project.project_group_id && (
            <Chip label="Project group" component={NextLink} href={`/groups/edit?id=${project.project_group_id}`} clickable />
          )}
        </Stack>
      )}
      <Box>
        <Link href="#top">Back to top</Link>
      </Box>
      <Box id="notes" my={4} sx={{ scrollMarginTop: "80px" }}>
        <Typography variant={"h4"} component="h3" sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
          Notes
          <Button variant="contained" startIcon={<Add />} href={`/projects/notes/create/?project_id=${id}`} >
            Add Note
          </Button>
        </Typography>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
          <ProjectNoteTable projectId={id} />
        </Suspense>
      </Box>
      <Box>
        <Link href="#top">Back to top</Link>
      </Box>
    </>
  );
};

export default View;
