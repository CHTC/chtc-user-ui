import type { Metadata } from "next";

import {Box} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import {Red_Hat_Display, Red_Hat_Text} from "next/font/google";
import {PlayArrow, Description, AssignmentTurnedIn, People, Folder, Group, School} from '@mui/icons-material';

import Banner from "@chtc/web-components/UW/Banner"
import Footer from "@chtc/web-components/UW/Footer"

import "./globals.css"
import {theme} from "./theme";
import Header from "@/components/Header";
import LogoBar from "@/components/LogoBar";
import {navigation} from "@/app/docs/navigation";
import Analytics from "@/components/Analytics";


const rhd = Red_Hat_Display({
	subsets: ['latin'], style: ['normal'], weight: ['300', '400', '700'], display: 'swap'
})
const rht = Red_Hat_Text({
	subsets: ['latin'], style: ['normal', 'italic'], weight: ['300', '400', '600'], display: 'swap'
})

export const metadata: Metadata = {
  title: "BadgerCompute",
  description: "Jupyter-based interactive compute service for researchers at the University of Wisconsin-Madison",
	metadataBase: new URL('https://badgercompute.chtc.chtc.io'),
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
			{ process.env.NEXT_PUBLIC_MATOMO_URL && process.env.NEXT_PUBLIC_MATOMO_SITE_ID &&
				<Analytics url={process.env.NEXT_PUBLIC_MATOMO_URL} siteId={process.env.NEXT_PUBLIC_MATOMO_SITE_ID} />
			}
      <Box component={"body"} sx={{ margin: 0, padding: 0 }}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <Banner />
						<Header pages={pages} />
						{children}
            <Footer
                accessibilityEmail={"badger.compute@wisc.edu"}
            />
						<LogoBar />
          </ThemeProvider>
        </AppRouterCacheProvider>
      </Box>
    </html>
  );
}
