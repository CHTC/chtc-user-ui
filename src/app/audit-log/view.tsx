"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import { useAuthClient } from "@/src/components/AuthProvider";
import AuditLogTable, { type AuditQuery } from "@/src/components/AuditLogTable/AuditLogTable";
import type { AuditActionEnum } from "@/types";
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { useState } from "react";

const ACTIONS: AuditActionEnum[] = [
  "member_added",
  "member_removed",
  "group_created",
  "group_deleted",
  "owner_group_changed",
  "metadata_changed",
];

interface Filters {
  action: string;
  group_id: string;
  member_user_id: string;
  actor_id: string;
  from: string;
  to: string;
}

const EMPTY: Filters = { action: "", group_id: "", member_user_id: "", actor_id: "", from: "", to: "" };

// Each filter becomes `column=op.value`; blanks are left out
function toQuery(filters: Filters): AuditQuery {
  const query: AuditQuery = {};
  if (filters.action) query.action = `eq.${filters.action}`;
  if (filters.group_id) query.group_id = `eq.${filters.group_id}`;
  if (filters.member_user_id) query.member_user_id = `eq.${filters.member_user_id}`;
  if (filters.actor_id) query.actor_id = `eq.${filters.actor_id}`;
  const bounds = [filters.from && `ge.${filters.from}`, filters.to && `le.${filters.to}`].filter(Boolean) as string[];
  if (bounds.length > 0) query.occurred_at = bounds;
  return query;
}

function View() {
  const { currentUser } = useAuthClient();
  const [draft, setDraft] = useState<Filters>(EMPTY);
  // Filters only apply on Search so typing an id does not fire a request per keystroke
  const [applied, setApplied] = useState<Filters>(EMPTY);

  const set = (field: keyof Filters, value: string) => setDraft((prev) => ({ ...prev, [field]: value }));
  const idField = (field: "group_id" | "member_user_id" | "actor_id", label: string) => (
    <TextField
      label={label}
      size="small"
      type="number"
      value={draft[field]}
      onChange={(e) => set(field, e.target.value)}
      sx={{ width: 120 }}
    />
  );

  return (
    <AuthGuard message="You must be logged in to view the audit log.">
      {currentUser?.is_admin ? (
        <Box>
          <Box
            component="form"
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              setApplied(draft);
            }}
            sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3, alignItems: "center" }}
          >
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="audit-action-label">Action</InputLabel>
              <Select
                labelId="audit-action-label"
                label="Action"
                value={draft.action}
                onChange={(e) => set("action", e.target.value)}
              >
                <MenuItem value="">Any</MenuItem>
                {ACTIONS.map((action) => (
                  <MenuItem key={action} value={action}>
                    {action}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {idField("group_id", "Group id")}
            {idField("member_user_id", "User id")}
            {idField("actor_id", "Actor id")}
            <TextField
              label="From"
              size="small"
              type="datetime-local"
              value={draft.from}
              onChange={(e) => set("from", e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="To"
              size="small"
              type="datetime-local"
              value={draft.to}
              onChange={(e) => set("to", e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Button type="submit" variant="contained">
              Search
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setDraft(EMPTY);
                setApplied(EMPTY);
              }}
            >
              Clear
            </Button>
          </Box>
          <AuditLogTable url="/audit_log" query={toQuery(applied)} />
        </Box>
      ) : (
        <Alert severity="warning">Only staff can view the audit log.</Alert>
      )}
    </AuthGuard>
  );
}

export default View;
