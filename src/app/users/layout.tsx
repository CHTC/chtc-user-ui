import { Add } from "@mui/icons-material";
import { Box, Button, Link, Typography } from "@mui/material";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Typography variant={"h3"} component="h1" sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
        <Link href="/users" style={{ textDecoration: "none", color: "inherit" }}>
          Users
        </Link>
        <Button startIcon={<Add />} href={`/users/create`}>
          Add User
        </Button>
      </Typography>
      <Box>{children}</Box>
    </>
  );
}
