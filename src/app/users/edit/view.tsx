"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import { apiFetch } from "@/src/components/AuthProvider";
import { UserForm } from "@/src/components/Forms/UserForm/UserForm";
import { ApiError } from "@/src/utils/formErrors";
import { Box, Skeleton, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import useSWR from "swr";

import UserGroupTable from "@/src/components/UserGroupTable/UserGroupTable";
import UserProjectTable from "@/src/components/UserProjectTable/UserProjectTable";
import {GroupCreateUpdate, User, UserCreate, UserUpdate} from "@/types";
import usePageTitle from "@/src/utils/usePageTitle";
import {useAlert} from "@/src/components/AlertProvider";

function View() {
  const { showAlert } = useAlert()

  const handleSubmit = async (
    id: number,
    payload: UserCreate | Partial<UserUpdate>,
    update: () => void,
    setError: (error: string | ApiError | null) => void,
    setIsSubmitting: (isSubmitting: boolean) => void,
  ) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to parse structured error response
        try {
          const errorData = await response.json();
          setError(errorData as ApiError);
        } catch {
          // Fallback to status text if JSON parsing fails
          setError(`Failed to update user: ${response.statusText}`);
        }
        return;
      }

      update();

      showAlert("UPDATE_USER_SUCCESS")
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to update user";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard message="You must be logged in to edit a user.">
      <Suspense fallback={<Skeleton variant={"rectangular"} height={"100"} />}>
        <UserPage handleSubmit={handleSubmit} />
      </Suspense>
    </AuthGuard>
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
  adminView = true
}: {
  id: number | null;
  handleSubmit: (
    id: number,
    payload: UserCreate | Partial<UserUpdate>,
    update: () => void,
    setError: (error: string | ApiError | null) => void,
    setIsSubmitting: (isSubmitting: boolean) => void,
  ) => Promise<void>;
  adminView?: boolean;
}) => {
  const { data: user, mutate } = useSWR(id ? [`/users/${id}`] : null, () => userFetcher(id) as Promise<User>, {
    suspense: true,
  });
  const [error, setError] = useState<string | ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  usePageTitle(user ? "User: " + user.name : null);

  if (!id) {
    return <p>No user ID provided.</p>;
  }

  return (
    <Box>
      <UserForm
        mode="edit"
        initialValues={user as Partial<UserCreate & UserUpdate>}
        onSubmit={(payload: UserCreate | Partial<UserUpdate>) =>
          handleSubmit(id, payload, mutate, setError, setIsSubmitting)
        }
        error={error}
        isSubmitting={isSubmitting}
        adminView={adminView}
      />
    </Box>
  );
};

const UserPage = ({
  handleSubmit,
}: {
  handleSubmit: (
    id: number,
    payload: UserCreate | Partial<UserUpdate>,
    update: () => void,
    setError: (error: string | ApiError | null) => void,
    setIsSubmitting: (isSubmitting: boolean) => void,
  ) => Promise<void>;
}) => {
  const searchParams = useSearchParams();
  const id = Number.parseInt(searchParams.get("id") || "") || null;

  if (!id) {
    return <Typography color="error">No user ID provided.</Typography>;
  }

  return (
    <>
      <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
        <UserFormSuspense id={id} handleSubmit={handleSubmit} adminView={true} />
      </Suspense>
      <Box my={4}>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
          <Typography variant={"h4"} component="h3" sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
            Projects
          </Typography>
          <UserProjectTable userId={id} adminView={true} />
        </Suspense>
      </Box>
      <Box my={4}>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
          <Typography variant={"h4"} component="h3" sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
            Groups
          </Typography>
          <UserGroupTable userId={id} adminView={true} />
        </Suspense>
      </Box>
    </>
  );
};

export default View;
