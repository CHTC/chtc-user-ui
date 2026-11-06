"use client";

import ActionButton from "@/src/components/ActionButton/ActionButton";
import { useAlert } from "@/src/components/AlertProvider";
import { apiFetch, useAuthClient } from "@/src/components/AuthProvider";
import { GroupForm } from "@/src/components/Forms/GroupForm/GroupForm";
import { useGroup } from "@/src/app/groups/_components/GroupShell";
import { useReadableGroup } from "@/src/utils/groupCache";
import { ApiError, apiErrorMessage } from "@/src/utils/formErrors";
import type { Group, GroupCreateUpdate } from "@/types";
import { Delete } from "@mui/icons-material";
import { Button, Chip } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** The group's own fields, with Allocate GID and Delete for staff */
const GroupDetails = ({ group, id }: { group: Group; id: number }) => {
  const router = useRouter();
  const { showAlert } = useAlert();
  const { currentUser } = useAuthClient();
  const { mutate } = useGroup(id);

  // The owner's name for the autocomplete; non-staff owners may not be allowed to read it, so failures fall back to the id
  const ownerId = group.owner_group_id;
  const ownerGroup = useReadableGroup(ownerId);

  const [error, setError] = useState<string | ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = !!currentUser?.is_admin && group.deleted_at === null;

  const handleSubmit = async (payload: GroupCreateUpdate) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/groups/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      if (!response.ok) {
        try {
          setError((await response.json()) as ApiError);
        } catch {
          setError(`Failed to update group: ${response.statusText}`);
        }
        return;
      }
      await mutate();
      showAlert("UPDATE_GROUP_SUCCESS");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allocateGid = async () => {
    const response = await apiFetch(`/groups/${id}/unix_gid`, { method: "POST" });
    if (!response.ok) {
      showAlert("ACTION_ERROR", await apiErrorMessage(response, "Failed to allocate a GID"));
      return;
    }
    const updated: Group = await response.json();
    showAlert("ALLOCATE_GID_SUCCESS", updated.unix_gid ?? 0);
    await mutate();
  };

  return (
    <>
      {group.managed_by !== "APPLICATION" && (
        <Chip label={`Managed by ${group.managed_by}`} size="small" color="warning" variant="outlined" sx={{ mt: 2 }} />
      )}
      {/* key remounts the form with the saved values after a save or an allocated GID */}
      <GroupForm
        key={`${group.updated_at}-${group.managed_by}-${group.unix_gid}-${ownerGroup?.id ?? ""}`}
        mode="edit"
        initialValues={group}
        ownerGroup={ownerGroup}
        canEdit={canEdit}
        onSubmit={handleSubmit}
        error={error}
        isSubmitting={isSubmitting}
        gidAction={
          canEdit ? (
            <Button variant="outlined" onClick={allocateGid} sx={{ whiteSpace: "nowrap", mt: 1 }}>
              Allocate GID
            </Button>
          ) : undefined
        }
        extraActions={
          canEdit ? (
            <ActionButton
              method="DELETE"
              icon={<Delete />}
              color="error"
              url={`/groups/${id}`}
              ariaLabel="Delete group"
              onSuccess={() => {
                showAlert("DELETE_GROUP_SUCCESS", group.name);
                router.push("/groups/");
              }}
            />
          ) : undefined
        }
      />
    </>
  );
};

export default GroupDetails;
