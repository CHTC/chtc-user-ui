"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import { useAuthClient } from "@/src/components/AuthProvider";
import ProjectAutocomplete from "@/src/components/ProjectAutocomplete/ProjectAutocomplete";
import SubmitNodeAutocomplete from "@/src/components/SubmitNodeAutocomplete/SubmitNodeAutocomplete";
import type { JoinedProjectView, Project, SubmitNode, User } from "@/types";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import { useState } from "react";

type QueryType =
  | "all_admins"
  | "all_pis"
  | "all_active_users"
  | "all_past_users"
  | "users_with_submit_node"
  | "users_in_project";

function Page() {
  const { client } = useAuthClient();
  const [queryType, setQueryType] = useState<QueryType>("all_admins");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedSubmitNode, setSelectedSubmitNode] = useState<SubmitNode | null>(null);
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const extractEmails = (users: User[]): string[] => {
    const emailSet = new Set<string>();
    users.forEach((user) => {
      if (user.email1) emailSet.add(user.email1);
      if (user.email2) emailSet.add(user.email2);
    });
    return Array.from(emailSet).sort();
  };

  const extractEmailsFromProjectView = (users: JoinedProjectView[]): string[] => {
    const emailSet = new Set<string>();
    users.forEach((user) => {
      if (user.email1) emailSet.add(user.email1);
      if (user.email2) emailSet.add(user.email2);
    });
    return Array.from(emailSet).sort();
  };

  const handleQuery = async () => {
    setLoading(true);
    setError(null);
    setEmails([]);
    setCopied(false);

    try {
      let resultEmails: string[] = [];

      switch (queryType) {
        case "all_admins": {
          const result = await client.getUsers({
            page_size: 10000,
            query: { is_admin: "eq.true" },
          });
          resultEmails = extractEmails(result.data);
          break;
        }

        case "all_pis": {
          const piProjects = await client.getPiProjects({ page_size: 10000 });
          const emailSet = new Set<string>();
          piProjects.data.forEach((pi) => {
            if (pi.email1) emailSet.add(pi.email1);
          });
          resultEmails = Array.from(emailSet).sort();
          break;
        }

        case "all_active_users": {
          // active
          const result = await client.getUsers({
            page_size: 10000,
            query: { active: "eq.true" },
          });
          resultEmails = extractEmails(result.data);
          break;
        }

        case "all_past_users": {
          // !active
          const result = await client.getUsers({
            page_size: 10000,
            query: { active: "eq.false" },
          });
          resultEmails = extractEmails(result.data);
          break;
        }

        case "users_with_submit_node": {
          if (!selectedSubmitNode) {
            setError("Please select a submit node");
            setLoading(false);
            return;
          }

          // All users with submit_nodes containing selectedSubmitNode.id
          const allUsers = await client.getUsers({ page_size: 10000 });
          const usersWithNode = allUsers.data.filter((user) =>
            user.submit_nodes?.some((sn) => sn.submit_node_id === selectedSubmitNode.id),
          );
          resultEmails = extractEmails(usersWithNode);
          break;
        }

        case "users_in_project": {
          if (!selectedProject) {
            setError("Please select a project");
            setLoading(false);
            return;
          }
          const projectUsers = await client.getProjectUsers(selectedProject.id, {
            page_size: 10000,
          });
          resultEmails = extractEmailsFromProjectView(projectUsers);
          break;
        }
      }

      setEmails(resultEmails);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch emails");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const emailList = emails.join(", ");
    await navigator.clipboard.writeText(emailList);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AuthGuard message="You must be logged in to view this page.">
      <Box>
        <Paper sx={{ p: 3, mb: 3 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Query Type</InputLabel>
            <Select
              value={queryType}
              label="Query Type"
              onChange={(e) => {
                setQueryType(e.target.value as QueryType);
                setError(null);
                setEmails([]);
              }}
            >
              <MenuItem value="all_admins">All Admins</MenuItem>
              <MenuItem value="all_pis">All PIs</MenuItem>
              <MenuItem value="all_active_users">All Active Users</MenuItem>
              <MenuItem value="all_past_users">All Past Users</MenuItem>
              <MenuItem value="users_with_submit_node">Users with Specific Submit Node</MenuItem>
              <MenuItem value="users_in_project">Users Involved in a Project</MenuItem>
            </Select>
          </FormControl>

          {queryType === "users_in_project" && (
            <Box sx={{ mb: 2 }}>
              <ProjectAutocomplete value={selectedProject ?? undefined} onSelect={setSelectedProject} />
            </Box>
          )}

          {queryType === "users_with_submit_node" && (
            <Box sx={{ mb: 2 }}>
              <SubmitNodeAutocomplete value={selectedSubmitNode ?? undefined} onSelect={setSelectedSubmitNode} />
            </Box>
          )}

          <Button variant="contained" onClick={handleQuery} disabled={loading} fullWidth>
            {loading ? <CircularProgress size={24} /> : "Generate Email List"}
          </Button>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {emails.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6">
                Results ({emails.length} email{emails.length !== 1 ? "s" : ""})
              </Typography>
              <Button
                variant="outlined"
                startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                onClick={handleCopy}
                color={copied ? "success" : "primary"}
              >
                {copied ? "Copied!" : "Copy All"}
              </Button>
            </Box>
            <Box
              sx={{
                p: 2,
                bgcolor: "grey.100",
                borderRadius: 1,
                maxHeight: 400,
                overflow: "auto",
                fontFamily: "monospace",
                fontSize: "0.875rem",
              }}
            >
              {emails.join(", ")}
            </Box>
          </Paper>
        )}
      </Box>
    </AuthGuard>
  );
}

export default Page;
