import SectionHeader from "@/src/components/SectionHeader/SectionHeader";
import { Box } from "@mui/material";
import CreateUserButton from "./_components/CreateUserButton";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SectionHeader title="Users" href="/users/" action={<CreateUserButton />} />
      <Box>{children}</Box>
    </>
  );
}
