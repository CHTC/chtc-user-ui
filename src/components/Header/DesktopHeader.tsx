"use client";

import Toolbar from "@mui/material/Toolbar";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Button from "@mui/material/Button";
import React from "react";

import Title from "@/src/components/Header/Title";
import { NavigationItem } from "@/src/components/DocumentationSidebar";
import AuthButton from "../AuthButton";

const DesktopHeader = ({ pages }: { pages: NavigationItem[] }) => (
  <Toolbar disableGutters>
    <Grid container justifyContent="space-between" alignItems="center" flexGrow={1}>
      <Grid size={{ md: "auto", lg: 4 }}>
        <Title />
      </Grid>
      <Grid size={{ md: "auto", lg: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", flexGrow: 1 }}>
          {pages.map(({ label, path }) => (
            <Link key={path} href={path}>
              <Button sx={{ my: 2, color: "white", display: "block" }}>{label}</Button>
            </Link>
          ))}
        </Box>
      </Grid>
      <Grid size={{ md: "auto", lg: 4 }}>
        <Box display={"flex"} justifyContent={"right"} alignItems={"center"} gap={2}>
          <AuthButton />
        </Box>
      </Grid>
    </Grid>
  </Toolbar>
);

export default DesktopHeader;
