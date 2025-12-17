import { Add } from "@mui/icons-material";
import {Typography, Box, Link, Button} from "@mui/material";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Typography variant={"h3"} component="h1" sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
        <Link href="/users" style={{ textDecoration: 'none', color: 'inherit' }}>
          Users
        </Link>
        <Button startIcon={<Add/>}>
          <Link href={`/users/create`} style={{ textDecoration: 'none', color: 'inherit' }}>
            Add User
          </Link>
        </Button>
      </Typography>
      <Box>
        {children}
      </Box>
    </>
  );
}
