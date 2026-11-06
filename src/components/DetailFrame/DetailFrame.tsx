"use client";

import {
  Box,
  Breadcrumbs,
  Collapse,
  Grid,
  Link as MuiLink,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface DetailPage {
  label: string;
  /** The page's path, e.g. "/projects/members/"; the record's id is added as ?id= */
  path: string;
  /**
   * Pages under this one, shown indented below it while any of them (or this page) is open. The
   * first should share this page's path, so opening the parent opens its first child.
   */
  children?: DetailPage[];
}

interface DetailFrameProps {
  /** The list the record belongs to, e.g. { label: "Projects", href: "/projects/" } */
  section: { label: string; href: string };
  /** The record's name */
  title: ReactNode;
  pages: DetailPage[];
  id: number;
  /** Shown above the page, e.g. a deleted warning */
  banner?: ReactNode;
  children: ReactNode;
}

// trailingSlash is on, but compare without it so "/projects" and "/projects/" match
const normalize = (path: string) => path.replace(/\/+$/, "");

/**
 * The frame for every page of one record: a menu of its pages down the left, and on the right the
 * breadcrumbs (list › record's name) and the current page, sharing one left edge.
 */
const DetailFrame = ({ section, title, pages, id, banner, children }: DetailFrameProps) => {
  const pathname = normalize(usePathname());
  const isCurrent = (page: DetailPage) => normalize(page.path) === pathname;

  const item = (page: DetailPage, nested: boolean) => (
    <ListItemButton
      key={`${page.label}-${page.path}`}
      component={Link}
      href={`${page.path}?id=${id}`}
      selected={isCurrent(page)}
      aria-current={isCurrent(page) ? "page" : undefined}
      sx={{ borderRadius: 1, ...(nested && { pl: 4 }) }}
    >
      <ListItemText primary={page.label} />
    </ListItemButton>
  );

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 3, lg: 2 }}>
        <List
          component="nav"
          aria-label={`${section.label} pages`}
          dense
          disablePadding
          sx={{ position: { md: "sticky" }, top: 16 }}
        >
          {pages.map((page) => {
            if (!page.children?.length) return item(page, false);
            const open = isCurrent(page) || page.children.some(isCurrent);
            return (
              <Box key={`${page.label}-${page.path}`}>
                {/* The child that shares this path is the one highlighted, so the parent only links */}
                <ListItemButton component={Link} href={`${page.path}?id=${id}`} sx={{ borderRadius: 1 }}>
                  <ListItemText primary={page.label} />
                </ListItemButton>
                <Collapse in={open}>
                  <List component="div" dense disablePadding>
                    {page.children.map((child) => item(child, true))}
                  </List>
                </Collapse>
              </Box>
            );
          })}
        </List>
      </Grid>
      <Grid size={{ xs: 12, md: 9, lg: 10 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <MuiLink component={Link} href={section.href} underline="hover" color="inherit">
            {section.label}
          </MuiLink>
          {/* The breadcrumbs are the page's only heading, so the record's name is its h1 */}
          <Typography color="text.primary" component="h1" variant="body1">
            {title}
          </Typography>
        </Breadcrumbs>
        {banner}
        <Box>{children}</Box>
      </Grid>
    </Grid>
  );
};

export default DetailFrame;
