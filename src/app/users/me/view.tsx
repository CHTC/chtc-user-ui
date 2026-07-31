"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import {apiFetch, useAuthClient} from "@/src/components/AuthProvider";
import { UserForm } from "@/src/components/Forms/UserForm/UserForm";
import { ApiError } from "@/src/utils/formErrors";
import { Box, Skeleton, Typography } from "@mui/material";
import PendingApplicationBanner from "@/src/app/users/_components/PendingApplicationBanner";
import { Suspense, useState } from "react";

import useSWR from "swr";

import UserGroupTable from "@/src/components/UserGroupTable/UserGroupTable";
import UserProjectTable from "@/src/components/UserProjectTable/UserProjectTable";
import { User, UserCreate, UserUpdate } from "@/types";

function View() {
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
  adminView = false
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

  const { currentUser } = useAuthClient();

  if (!currentUser) {
    return <Skeleton height={400} />;
  }

  return (
    <>
      <PendingApplicationBanner />
      <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
        <UserFormSuspense id={currentUser?.id} handleSubmit={handleSubmit} adminView={currentUser.is_admin || undefined} />
      </Suspense>
      <Box my={4}>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
          <Typography variant={"h4"} component="h3" sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
            Projects
          </Typography>
          <UserProjectTable userId={currentUser?.id} adminView={currentUser.is_admin || undefined} />
        </Suspense>
      </Box>
      <Box my={4}>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
          <Typography variant={"h4"} component="h3" sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
            Groups
          </Typography>
          <UserGroupTable userId={currentUser?.id} adminView={currentUser.is_admin || undefined} />
        </Suspense>
      </Box>
    </>
  );
};

export default View;
