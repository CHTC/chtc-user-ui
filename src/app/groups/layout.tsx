import {Typography, Box, Link, Button} from "@mui/material";
import { Add } from "@mui/icons-material";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Typography variant={"h3"} component="h1" sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
        <Link href="/groups" style={{ textDecoration: 'none', color: 'inherit' }}>
          Groups
        </Link>
        <Button startIcon={<Add/>}>
          <Link href={`/groups/create`} style={{ textDecoration: 'none', color: 'inherit' }}>
            Add Group
          </Link>
        </Button>
      </Typography>
      <Box>
        {children}
      </Box>
    </>
  );
}
