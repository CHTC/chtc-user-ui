"use client";

import { useAlert } from "@/src/components/AlertProvider";
import { apiFetch, useAuthClient } from "@/src/components/AuthProvider";
import ActionButton from "@/src/components/ActionButton/ActionButton";
import AuditLogTable from "@/src/components/AuditLogTable/AuditLogTable";
import { AuthGuard } from "@/src/components/AuthGuard";
import { GroupForm } from "@/src/components/Forms/GroupForm/GroupForm";
import { GroupAccessPanel, GroupMemberOfPanel } from "@/src/components/GroupAccessPanel";
import GroupMembersPanel from "@/src/components/GroupMembersPanel";
import { fetchJson, ForbiddenError } from "@/src/utils/fetchList";
import { ApiError } from "@/src/utils/formErrors";
import usePageTitle from "@/src/utils/usePageTitle";
import type { Group, GroupCreateUpdate } from "@/types";
import { Delete } from "@mui/icons-material";
import { Alert, Box, Breadcrumbs, Button, Skeleton, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import useSWR from "swr";

function View() {
  return (
    <AuthGuard message="You must be logged in to edit a group.">
      <Box>
        <Breadcrumbs>
          <Typography color="text.primary">Group</Typography>
        </Breadcrumbs>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
          <GroupPage />
        </Suspense>
      </Box>
    </AuthGuard>
  );
}

// A 403 becomes data so the page can say so instead of throwing into the error boundary
const groupFetcher = async (id: number): Promise<Group | "forbidden"> => {
  try {
    return await fetchJson<Group>(`/groups/${id}`);
  } catch (e) {
    if (e instanceof ForbiddenError) return "forbidden";
    throw e;
  }
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box mt={5}>
    <Typography variant={"h4"} component="h3" mb={2}>
      {title}
    </Typography>
    <Suspense fallback={<Skeleton variant={"rectangular"} height={"100px"} />}>{children}</Suspense>
  </Box>
);

const GroupPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { currentUser } = useAuthClient();
  const isStaff = !!currentUser?.is_admin;
  const id = Number.parseInt(searchParams.get("id") || "") || null;

  const { data: group, mutate } = useSWR(id ? [`/groups/${id}`] : null, () => groupFetcher(id!), { suspense: true });
  // The owner's name for the autocomplete; non-staff owners may not be allowed to read it, so failures fall back to the id
  const ownerId = group && group !== "forbidden" ? group.owner_group_id : null;
  const { data: ownerGroup } = useSWR(ownerId ? [`/groups/${ownerId}`] : null, () => fetchJson<Group>(`/groups/${ownerId}`), {
    shouldRetryOnError: false,
  });

  const [error, setError] = useState<string | ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  usePageTitle(group && group !== "forbidden" ? "Group: " + group.name : null);

  if (!id) {
    return <Typography color="error">No group ID provided.</Typography>;
  }
  if (!group || group === "forbidden") {
    return <Typography color="error">You do not have access to this group</Typography>;
  }

  const deleted = group.deleted_at !== null;
  const canEdit = isStaff && !deleted;

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
      const detail = await response
        .json()
        .then((data) => (typeof data?.detail === "string" ? data.detail : response.statusText))
        .catch(() => response.statusText);
      showAlert("ACTION_ERROR", detail);
      return;
    }
    const updated: Group = await response.json();
    showAlert("ALLOCATE_GID_SUCCESS", updated.unix_gid ?? 0);
    await mutate();
  };

  return (
    <>
      {deleted && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Deleted on {new Date(group.deleted_at!).toLocaleString()}
        </Alert>
      )}
      {/* key remounts the form with the saved values after a save or an allocated GID */}
      <GroupForm
        key={`${group.updated_at}-${group.unix_gid}-${ownerGroup?.id ?? ""}`}
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
                router.push("/groups");
              }}
            />
          ) : undefined
        }
      />

      {!deleted && (
        <Section title="Members">
          {/* The API only lets staff and the owners load this page, so any non-staff viewer here can administer */}
          <GroupMembersPanel groupId={id} canAdminister={true} />
        </Section>
      )}

      <Section title="Member of">
        <GroupMemberOfPanel groupId={id} groupName={group.name} />
      </Section>

      <Section title="Access">
        <GroupAccessPanel groupId={id} groupName={group.name} />
      </Section>

      <Section title="History">
        <AuditLogTable url={`/groups/${id}/audit_log`} />
      </Section>
    </>
  );
};

export default View;
