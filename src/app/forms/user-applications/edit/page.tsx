"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import {apiFetch} from "@/src/components/AuthProvider";
import UserApplicationEditForm from "@/src/components/Forms/UserApplicationForm/UserApplicationEditForm";
import type { ApiError } from "@/src/components/Forms/UserForm/UserForm";
import type { UserForm, UserFormPatch } from "@/types";
import { Box, Skeleton, Typography } from "@mui/material";
import {useRouter, useSearchParams} from "next/navigation";
import { Suspense, useState } from "react";
import useSWR from "swr";

const userApplicationFetcher = async (id: number | null) => {
  if (!id) return null;

  // todo: use the /forms/user-applications/{id} endpoint once it's implemented
  const response = await apiFetch(`/forms/user-applications?id=eq.${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user application with id ${id}: ${response.statusText}`);
  }

  const data = (await response.json()) as UserForm[];
  return data[0] ?? null;
};

function Page() {
  return (
    <AuthGuard message="You must be logged in to edit a user application.">
      <Suspense fallback={<Skeleton variant="rectangular" height="100" />}>
        <UserApplicationPage />
      </Suspense>
    </AuthGuard>
  );
}

function UserApplicationPage() {
  const searchParams = useSearchParams();
  const id = Number.parseInt(searchParams.get("id") || "", 10) || null;

  if (!id) {
    return <Typography color="error">No user application ID provided.</Typography>;
  }

  return (
    <Box sx={{ p: 3, width: "100%" }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Edit User Application
      </Typography>
      <Suspense fallback={<Skeleton variant="rectangular" height="400" />}>
        <UserApplicationFormSuspense id={id} />
      </Suspense>
    </Box>
  );
}

function UserApplicationFormSuspense({ id }: { id: number }) {

  const { data, mutate } = useSWR([`/forms/user-applications`, id], () => userApplicationFetcher(id), {
    suspense: true,
  });
  const [error, setError] = useState<string | ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  if (!data) {
    return <Typography color="error">User application not found.</Typography>;
  }

  const handleSubmit = async (payload: UserFormPatch) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/forms/user-applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          setError(errorData as ApiError);
        } catch {
          setError(`Failed to update user application: ${response.statusText}`);
        }
        return;
      }

      await mutate();
      router.push("/forms/user-applications");

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update user application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UserApplicationEditForm initialValues={data} onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
  );
}

export default Page;
