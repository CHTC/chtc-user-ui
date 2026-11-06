"use client";

import { useAlert } from "@/src/components/AlertProvider";
import { apiFetch } from "@/src/components/AuthProvider";
import { UserForm } from "@/src/components/Forms/UserForm/UserForm";
import { ApiError } from "@/src/utils/formErrors";
import { useRevalidateUserAndGroups } from "@/src/utils/userCache";
import type { User, UserCreate, UserUpdate } from "@/types";
import { useState } from "react";

/** The user's own fields, as staff edit them */
const UserDetails = ({ user, id }: { user: User; id: number }) => {
  const { showAlert } = useAlert();
  // Submit node changes are stored as group memberships, so refresh the group table too.
  const revalidate = useRevalidateUserAndGroups(id);
  const [error, setError] = useState<string | ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payload: UserCreate | Partial<UserUpdate>) => {
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
          setError((await response.json()) as ApiError);
        } catch {
          // Fallback to status text if JSON parsing fails
          setError(`Failed to update user: ${response.statusText}`);
        }
        return;
      }

      await revalidate();
      showAlert("UPDATE_USER_SUCCESS");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UserForm
      mode="edit"
      initialValues={user as Partial<UserCreate & UserUpdate>}
      onSubmit={handleSubmit}
      error={error}
      isSubmitting={isSubmitting}
      adminView={true}
      showSubmitNodes={false}
    />
  );
};

export default UserDetails;
