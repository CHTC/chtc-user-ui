import { Box, Link, Typography } from "@mui/material";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Typography variant={"h3"} component="h1" sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
        <Link href="/groups" style={{ textDecoration: "none", color: "inherit" }}>
          PI Projects
        </Link>
      </Typography>
      <Box>{children}</Box>
    </>
  );
}
