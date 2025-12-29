"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Breadcrumbs, Button, Link, Skeleton, Typography } from "@mui/material";
import { useAuthClient } from "@/src/components/AuthProvider";
import { UserForm } from "@/src/components/Forms/UserForm/UserForm";
import { apiFetch } from "@/src/components/AuthProvider";

import useSWR from "swr";

import UserProjectTable from "@/src/components/UserProjectTable/UserProjectTable";
import UserGroupTable from "@/src/components/UserGroupTable/UserGroupTable";
import { UserCreate, UserUpdate } from "@/types";

function Page() {
  const { isAuthenticated } = useAuthClient();

  const handleSubmit = async (id: number, payload: UserCreate | Partial<UserUpdate>, update: () => void) => {
    try {
      await apiFetch(`/users/${id}`, {
        method: "PATCH",
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
        <Typography variant="h6">You must be logged in to create a user.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs>
        <Typography color="text.primary">Update User</Typography>
      </Breadcrumbs>
      <Suspense fallback={<Skeleton variant={"rectangular"} height={"100"} />}>
        <UserPage handleSubmit={handleSubmit} />
      </Suspense>
    </Box>
  );
}

// Fetcher function for SWR
const userFetcher = async (id: number | null) => {
  if (!id) return null;
  const response = await apiFetch(`/users/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user with id ${id}: ${response.statusText}`);
  }
  return response.json();
};

const UserFormSuspense = ({
  id,
  handleSubmit,
}: {
  id: number | null;
  handleSubmit: (id: number, payload: UserCreate | Partial<UserUpdate>, update: () => void) => Promise<void>;
}) => {
  const { data: user, mutate } = useSWR(id ? [`/users/${id}`] : null, () => userFetcher(id), { suspense: true });

  if (!id) {
    return <p>No user ID provided.</p>;
  }

  return (
    <UserForm
      mode="edit"
      initialValues={user}
      onSubmit={(payload: UserCreate | Partial<UserUpdate>) => handleSubmit(id, payload, mutate)}
    />
  );
};

const UserPage = ({
  handleSubmit,
}: {
  handleSubmit: (id: number, payload: UserCreate | Partial<UserUpdate>, update: () => void) => Promise<void>;
}) => {
  const searchParams = useSearchParams();
  const id = Number.parseInt(searchParams.get("id") || "") || null;

  return (
    <>
      <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
        <UserFormSuspense id={id} handleSubmit={handleSubmit} />
      </Suspense>
      <Box my={4}>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
          <Typography variant={"h4"} component="h3" sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
            <Link href="/groups" style={{ textDecoration: "none", color: "inherit" }}>
              Projects
            </Link>
          </Typography>
          <UserProjectTable userId={id!} />
        </Suspense>
      </Box>
      <Box my={4}>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
          <Typography variant={"h4"} component="h3" sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
            <Link href="/groups" style={{ textDecoration: "none", color: "inherit" }}>
              Groups
            </Link>
          </Typography>
          <UserGroupTable userId={id!} />
        </Suspense>
      </Box>
    </>
  );
};

export default Page;
