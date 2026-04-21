"use client";

import { chtcTheme } from "@chtc/web-components";
import { createTheme, responsiveFontSizes } from "@mui/material";
import { Red_Hat_Display, Red_Hat_Text } from "next/font/google";
import Link from "next/link";

// We are here for the font families only, the fonts are loaded in the layout
const rhd = Red_Hat_Display({ subsets: ["latin"] });
const rht = Red_Hat_Text({ subsets: ["latin"] });

const theme = responsiveFontSizes(
  createTheme({
    ...chtcTheme,
    palette: {
      primary: {
        main: "#B61F24",
      },
      secondary: {
        main: "#000000",
      },
    },
    typography: {
      allVariants: {
        fontWeight: 500,
      },
      h1: {
        fontFamily: rhd.style.fontFamily,
        fontWeight: 600,
      },
      h2: {
        fontFamily: rhd.style.fontFamily,
        fontWeight: 600,
      },
      h3: {
        fontFamily: rhd.style.fontFamily,
        fontWeight: 600,
      },
      h4: {
        fontFamily: rhd.style.fontFamily,
        fontWeight: 700,
      },
      h5: {
        fontFamily: rhd.style.fontFamily,
        fontWeight: 800,
      },
      h6: {
        fontFamily: rhd.style.fontFamily,
        fontWeight: 800,
      },
      fontFamily: [rht.style.fontFamily, "Helvetica Neue", "Helvetica", "Arial", "Lucida Grande", "sans-serif"].join(
        ",",
      ),
    },
    components: {
      MuiLink: {
        defaultProps: {
          component: Link,
        },
      },
    },
  }),
  { factor: 2 },
);

export { rhd, rht, theme };
