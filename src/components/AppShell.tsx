"use client";

import Header from "@/src/components/Header";
import { useAuthClient } from "@/src/components/AuthProvider";
import { Folder, Group, People, School } from "@mui/icons-material";
import { Box, Container } from "@mui/material";

const adminPages = [
  { label: "Users", path: "/users/", icon: <People /> },
  { label: "Projects", path: "/projects/", icon: <Folder /> },
  { label: "Groups", path: "/groups/", icon: <Group /> },
  { label: "PIs", path: "/pis/", icon: <School /> },
  { label: "Email", path: "/email/", icon: <People /> },
  { label: "Forms", path: "/forms/user-applications/", icon: <People /> },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuthClient();

  return (
    <>
      <Header pages={currentUser?.is_admin ? adminPages : []} />
      <Container maxWidth="lg">
        <Box my={2}>{children}</Box>
      </Container>
    </>
  );
}
