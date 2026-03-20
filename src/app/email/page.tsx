"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import { apiFetch } from "@/src/components/AuthProvider";
import ProjectAutocomplete from "@/src/components/ProjectAutocomplete/ProjectAutocomplete";
import SubmitNodeAutocomplete from "@/src/components/SubmitNodeAutocomplete/SubmitNodeAutocomplete";
import type { JoinedProjectView, Project, SubmitNode, User } from "@/types";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import useSWR from "swr";

type StatusFilter = "all" | "active" | "past";
type RoleFilter = "any" | "admin" | "pi";

type CommittedFilters = {
  status: StatusFilter;
  role: RoleFilter;
  projectId: number | null;
  submitNodeId: number | null;
};

function qs(params: Record<string, string | number>): string {
  const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  return q.toString() ? `?${q}` : "";
}

function toEmails(items: Array<{ email1?: string | null; email2?: string | null }>): string[] {
  const emailSet = new Set<string>();
  items.forEach((u) => {
    if (u.email1) emailSet.add(u.email1);
    if (u.email2) emailSet.add(u.email2);
  });
  return Array.from(emailSet).sort();
}

async function fetchEmails(filters: CommittedFilters): Promise<string[]> {
  const { status, role, projectId, submitNodeId } = filters;
  if (projectId !== null && submitNodeId !== null) {
    throw new Error("Cannot filter by both project and submit node at the same time");
  }

  if (projectId === null && role === "pi") {
    throw new Error("Cannot filter by PI role when no project is selected");
  }

  const params: Record<string, string> = {};
  params.page_size = "10000";
  if (status === "active") params.active = "eq.true";
  if (status === "past") params.active = "eq.false";
  if (role === "admin") params.is_admin = "eq.true";

  if (projectId !== null) {
    // By project (all filters server-side)
    if (role === "pi") params.role = "eq.PI";

    const res = await apiFetch(`/projects/${projectId}/users${qs(params)}`);
    if (!res.ok) throw new Error(await res.text());

    const users: JoinedProjectView[] = await res.json();
    return toEmails(users);
  }

  if (submitNodeId !== null) {
    // By submit node (all users fetched, filter client-side by submit node)
    const res = await apiFetch(`/users${qs(params)}`);
    if (!res.ok) throw new Error(await res.text());

    const data: User[] = await res.json();
    const users = data.filter((u) => u.submit_nodes?.some((sn) => sn.submit_node_id === submitNodeId));
    return toEmails(users);
  }

  // Simple case:
  // No project, no submit node, no PI to check
  const res = await apiFetch(`/users${qs(params)}`);

  if (!res.ok) throw new Error(await res.text());
  const data: User[] = await res.json();

  return toEmails(data);
}

function Page() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [role, setRole] = useState<RoleFilter>("any");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedSubmitNode, setSelectedSubmitNode] = useState<SubmitNode | null>(null);
  const [committedFilters, setCommittedFilters] = useState<CommittedFilters | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    data: emails = [],
    isLoading,
    error,
  } = useSWR(committedFilters, fetchEmails, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const handleQuery = () => {
    setCommittedFilters({
      status,
      role,
      projectId: selectedProject?.id ?? null,
      submitNodeId: selectedSubmitNode?.id ?? null,
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(emails.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetResults = () => setCommittedFilters(null);

  return (
    <AuthGuard message="You must be logged in to view this page.">
      <Box>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filter Options
          </Typography>

          {/* Row 1: Status + Role side by side */}
          <Box sx={{ display: "flex", gap: 6, mb: 3, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="overline" color="text.secondary" display="block">
                Status
              </Typography>
              <ToggleButtonGroup
                value={status}
                exclusive
                color="primary"
                onChange={(_, v) => {
                  if (v) {
                    setStatus(v);
                    resetResults();
                  }
                }}
                size="small"
              >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="active">Active</ToggleButton>
                <ToggleButton value="past">Past</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="overline" color="text.secondary" display="block">
                Role
              </Typography>
              <ToggleButtonGroup
                value={role}
                exclusive
                color="primary"
                onChange={(_, v) => {
                  if (v) {
                    setRole(v);
                    resetResults();
                  }
                }}
                size="small"
              >
                <ToggleButton value="any">Any</ToggleButton>
                <ToggleButton value="admin">Admin</ToggleButton>
                <Tooltip title={!selectedProject ? "Select a project first" : ""}>
                  <span>
                    <ToggleButton value="pi" disabled={!selectedProject}>
                      PI
                    </ToggleButton>
                  </span>
                </Tooltip>
              </ToggleButtonGroup>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Row 2: Project + Submit Node side by side */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <Box sx={{ flex: 1, minWidth: 220 }}>
              <Typography variant="overline" color="text.secondary" display="block">
                Project
              </Typography>
              <ProjectAutocomplete
                disabled={!!selectedSubmitNode}
                value={selectedProject ?? undefined}
                onSelect={(p) => {
                  setSelectedProject(p);
                  resetResults();
                }}
              />
            </Box>

            <Box sx={{ flex: 1, minWidth: 220 }}>
              <Typography variant="overline" color="text.secondary" display="block">
                Submit Node
              </Typography>
              <SubmitNodeAutocomplete
                disabled={!!selectedProject}
                value={selectedSubmitNode ?? undefined}
                onSelect={(n) => {
                  setSelectedSubmitNode(n);
                  resetResults();
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleQuery}
              disabled={isLoading}
            >
              Run Query
            </Button>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error instanceof Error ? error.message : "Failed to fetch emails"}
          </Alert>
        )}

        {committedFilters !== null && !isLoading && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography variant="h6">Results ({emails.length} emails)</Typography>
              </Box>
              {emails.length > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                  onClick={handleCopy}
                  color={copied ? "success" : "primary"}
                >
                  {copied ? "Copied!" : "Copy All"}
                </Button>
              )}
            </Box>
            {emails.length > 0 ? (
              <Box
                sx={{
                  p: 2,
                  bgcolor: "grey.50",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  maxHeight: 400,
                  overflow: "auto",
                  fontFamily: "monospace",
                  fontSize: "0.8125rem",
                  lineHeight: 1.8,
                }}
              >
                {emails.join(", ")}
              </Box>
            ) : (
              <Typography>No emails found.</Typography>
            )}
          </Paper>
        )}
      </Box>
    </AuthGuard>
  );
}

export default Page;
