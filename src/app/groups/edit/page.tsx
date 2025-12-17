"use client";

import React, {Suspense} from "react";
import {useSearchParams} from "next/navigation";
import {Box, Breadcrumbs, Skeleton, Typography} from "@mui/material";
import { useAuthClient } from "@/src/components/AuthProvider";
import { GroupForm } from "@/src/components/Forms/GroupForm/GroupForm";
import { apiFetch} from "@/src/components/AuthProvider";
import type { GroupCreate } from "@/src/util/types";
import {GroupCreateUpdate} from "@/types";
import useSWR from "swr";
import GroupUserTable from "@/src/components/GroupUserTable/GroupUserTable";

function Page() {
  const { isAuthenticated } = useAuthClient();

  const handleSubmit = async (id: number, payload: GroupCreateUpdate, update: () => void) => {
    try {
      await apiFetch(`/groups/${id}`, {
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
        <Typography variant="h6">You must be logged in to create a group.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs>
        <Typography color="text.primary">Update Group</Typography>
      </Breadcrumbs>
      <Suspense fallback={<Skeleton variant={"rectangular"} height={"100"}/>}>
        <GroupPage handleSubmit={handleSubmit} />
      </Suspense>
    </Box>
  );
}

// Fetcher function for SWR
const groupFetcher = async (id: number | null) => {
  if (!id) return null;
  const response = await apiFetch(`/groups/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch group with id ${id}: ${response.statusText}`);
  }
  return response.json();
};

const GroupFormSuspense = ({id, handleSubmit}: {id: number | null, handleSubmit: (id: number, payload: GroupCreate, update: () => void) => Promise<void>}) => {
  const {data: group, mutate} = useSWR(id ? [`/groups/${id}`] : null, () => groupFetcher(id), {suspense: true});

  if(!id) {
    return <p>No group ID provided.</p>
  }

  return <GroupForm
    mode="edit"
    initialValues={group}
    onSubmit={(payload: GroupCreate) => handleSubmit(id, payload, mutate)}
  />
}

const GroupPage = ({handleSubmit}: {handleSubmit: (id: number, payload: GroupCreate, update: () => void) => Promise<void>}) => {

  const searchParams = useSearchParams()
  const id = Number.parseInt(searchParams.get('id') || "") || null;

  return <>

    <Suspense fallback={<Skeleton variant={"rectangular"} height={"100"}/>}>
      <GroupFormSuspense id={id} handleSubmit={handleSubmit} />
    </Suspense>
    <Suspense fallback={<Skeleton variant={"rectangular"} height={"100"}/>}>
      <GroupUserTable groupId={id!} />
    </Suspense>
  </>
}

export default Page;
