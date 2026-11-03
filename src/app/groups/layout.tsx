import { Box, Link, Typography } from "@mui/material";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Typography variant={"h3"} component="h1" sx={{ mb: 2 }}>
        <Link href="/groups/" style={{ textDecoration: "none", color: "inherit" }}>
          Groups
        </Link>
      </Typography>
      <Box>{children}</Box>
    </>
  );
}
