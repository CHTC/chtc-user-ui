import SectionHeader from "@/src/components/SectionHeader/SectionHeader";
import { Box } from "@mui/material";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SectionHeader title="Groups" href="/groups/" />
      <Box>{children}</Box>
    </>
  );
}
