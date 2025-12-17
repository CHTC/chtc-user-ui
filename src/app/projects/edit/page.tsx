"use client";

import React, {Suspense} from "react";
import {useSearchParams} from "next/navigation";
import {Box, Breadcrumbs, Button, Link, Skeleton, Typography} from "@mui/material";
import { useAuthClient } from "@/src/components/AuthProvider";
import { ProjectForm } from "@/src/components/Forms/ProjectForm/ProjectForm";
import { apiFetch} from "@/src/components/AuthProvider";
import type { ProjectCreate } from "@/src/util/types";
import {ProjectCreateUpdate} from "@/types";
import useSWR from "swr";
import ProjectUserTable from "@/src/components/ProjectUserTable/ProjectUserTable";
import ProjectNoteTable from "@/src/components/ProjectNoteTable/ProjectNoteTable";
import { Add } from "@mui/icons-material";

function Page() {
  const { isAuthenticated } = useAuthClient();

  const handleSubmit = async (id: number, payload: ProjectCreateUpdate, update: () => void) => {
    try {
      await apiFetch(`/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      update();
    } catch (e: unknown) {
      // Optionally handle error here if you want to display it
    }
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ width: "100%", padding: 2 }}>
        <Typography variant="h6">You must be logged in to create a project.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs>
        <Typography color="text.primary">Update Project</Typography>
      </Breadcrumbs>
      <Suspense fallback={<Skeleton variant={"rectangular"} height={"100"}/>}>
        <ProjectPage handleSubmit={handleSubmit} />
      </Suspense>
    </Box>
  );
}

// Fetcher function for SWR
const projectFetcher = async (id: number | null) => {
  if (!id) return null;
  const response = await apiFetch(`/projects/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch project with id ${id}: ${response.statusText}`);
  }
  return response.json();
};

const ProjectFormSuspense = ({id, handleSubmit}: {id: number | null, handleSubmit: (id: number, payload: ProjectCreate, update: () => void) => Promise<void>}) => {
  const {data: project, mutate} = useSWR(id ? [`/projects/${id}`] : null, () => projectFetcher(id), {suspense: true});

  if(!id) {
    return <p>No project ID provided.</p>
  }

  return <ProjectForm
    mode="edit"
    initialValues={project}
    onSubmit={(payload: ProjectCreate) => handleSubmit(id, payload, mutate)}
  />
}

const ProjectPage = ({handleSubmit}: {handleSubmit: (id: number, payload: ProjectCreate, update: () => void) => Promise<void>}) => {

  const searchParams = useSearchParams()
  const id = Number.parseInt(searchParams.get('id') || "") || null;

  return <>
    <Box my={3}>
      <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"}/>}>
        <ProjectFormSuspense id={id} handleSubmit={handleSubmit} />
      </Suspense>
    </Box>
    <Box my={4}>
      <Typography variant={"h4"} component="h3">Users</Typography>
      <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"}/>}>
        <ProjectUserTable projectId={id!} />
      </Suspense>
    </Box>
    <Box my={4}>
      <Typography variant={"h4"} component="h3" sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
        <Link href="/groups" style={{ textDecoration: 'none', color: 'inherit' }}>
          Notes
        </Link>
        <Button startIcon={<Add/>}>
          <Link href={`/projects/notes/create?project_id=${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            Add Note
          </Link>
        </Button>
      </Typography>
      <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"}/>}>
        <ProjectNoteTable projectId={id!} />
      </Suspense>
    </Box>
  </>
}

export default Page;
