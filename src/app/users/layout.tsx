import { Add } from "@mui/icons-material";
import { Box, Button, Link, Typography } from "@mui/material";
import CreateUserButton from "./_components/CreateUserButton";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Typography variant={"h3"} component="h1" sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
        <Link href="/users/" style={{ textDecoration: "none", color: "inherit" }}>
          Users
        </Link>
        <CreateUserButton />
      </Typography>
      <Box>{children}</Box>
    </>
  );
}
