import type { Metadata } from "next";

import AppShell from "@/src/components/AppShell";
import Banner from "@chtc/web-components/UW/Banner";
import { Box, Snackbar } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { Red_Hat_Display, Red_Hat_Text } from "next/font/google";
import { AuthClientProvider } from "../components/AuthProvider";
import { AlertProvider } from "../components/AlertProvider";
import "./globals.css";
import { theme } from "./theme";
import { SnackbarAlert } from "../components/SnackbarAlert";

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
  // description: "", // TODO
};

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
            <AuthClientProvider>
              <AlertProvider>
                <Banner />
                <SnackbarAlert />
                <AppShell>{children}</AppShell>
              </AlertProvider>
            </AuthClientProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </Box>
    </html>
  );
}
