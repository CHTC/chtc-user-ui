"use client";

import Header from "@/src/components/Header";
import { useAuthClient } from "@/src/components/AuthProvider";
import { Folder, Group, People, School, Add, Storage, History } from "@mui/icons-material";
import { Box, Container } from "@mui/material";

const adminPages = [
  { label: "Users", path: "/users/", icon: <People /> },
  { label: "Projects", path: "/projects/", icon: <Folder /> },
  { label: "Groups", path: "/groups/", icon: <Group /> },
  { label: "Data Access", path: "/data-access/", icon: <Storage /> },
  { label: "PI List", path: "/pis/", icon: <School /> },
  { label: "Audit Log", path: "/audit-log/", icon: <History /> },
  { label: "Email", path: "/email/", icon: <People /> },
  { label: "Forms", path: "/forms/user-applications/", icon: <People /> },
];

// Group owners administer their groups' members from the same pages staff use; the API
// limits what they see and can do
const userPages = [
  { label: "Account", path: "/users/me", icon: <People />},
  { label: "Groups", path: "/groups/", icon: <Group /> },
  { label: "Application", path: "/forms/user-applications/create/", icon: <Add />},
];


export default function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthenticated } = useAuthClient();

  const pages = currentUser?.is_admin ? adminPages : isAuthenticated ? userPages : [];

  return (
    <>
      <Header pages={pages} />
      <Container maxWidth="lg">
        <Box my={2}>{children}</Box>
      </Container>
    </>
  );
}
