import type { Metadata } from "next";

import { Folder, Group, People, School } from "@mui/icons-material";
import { Box } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { Red_Hat_Display, Red_Hat_Text } from "next/font/google";

import Banner from "@chtc/web-components/UW/Banner";
import Footer from "@chtc/web-components/UW/Footer";

import Header from "@/components/Header";
import LogoBar from "@/components/LogoBar";
import { theme } from "./theme";
import "./globals.css";

const rhd = Red_Hat_Display({
  subsets: ["latin"],
  style: ["normal"],
  weight: ["300", "400", "700"],
  display: "swap",
});
const rht = Red_Hat_Text({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CHTC User App",
  description: "TODO",
};

const pages = [
  { label: "Users", path: "/users", icon: <People /> },
  { label: "Projects", path: "/projects", icon: <Folder /> },
  { label: "Groups", path: "/groups", icon: <Group /> },
  { label: "PIs", path: "/pis", icon: <School /> },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${rht.className} ${rhd.className}`}>
      <Box component={"body"} sx={{ margin: 0, padding: 0 }}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <Banner />
            <Header pages={pages} />
            {children}
            <Footer accessibilityEmail={"badger.compute@wisc.edu"} />
            <LogoBar />
          </ThemeProvider>
        </AppRouterCacheProvider>
      </Box>
    </html>
  );
}
