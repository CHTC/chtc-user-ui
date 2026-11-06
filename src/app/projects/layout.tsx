import SectionHeader from "@/src/components/SectionHeader/SectionHeader";
import { Add } from "@mui/icons-material";
import { Box, Button } from "@mui/material";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SectionHeader
        title="Projects"
        href="/projects/"
        action={
          <Button startIcon={<Add />} href={`/projects/create/`}>
            Add Project
          </Button>
        }
      />
      <Box>{children}</Box>
    </>
  );
}
