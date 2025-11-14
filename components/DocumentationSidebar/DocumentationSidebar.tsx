"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Link from "@mui/material/Link";
import type { NavigationItem } from "./types";
import { usePathname } from "next/navigation";

function NavigationFolder({ items, level = 0 }: { items: NavigationItem[]; level?: number }) {
  return (
    <>
      {items.map((item) => (
        <NavigationNode key={item.label + (item.path || "")} item={item} level={level} />
      ))}
    </>
  );
}

function NavigationNode({ item, level }: { item: NavigationItem; level: number }) {
  const pathname = usePathname();

  const [open, setOpen] = useState(level < 1);
  const hasChildren = !!item.children && item.children.length > 0;
  if (hasChildren) {
    return (
      <>
        <ListItem disablePadding sx={{ pl: level * 2 }}>
          <ListItemButton onClick={() => setOpen((o) => !o)}>
            {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            <ListItemText
              primary={
                <Typography variant={level === 0 ? "subtitle1" : "body2"} fontWeight={600}>
                  {item.label}
                </Typography>
              }
              sx={{ ml: 1 }}
            />
          </ListItemButton>
        </ListItem>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <NavigationFolder items={item.children!} level={level + 1} />
          </List>
        </Collapse>
      </>
    );
  }

  // Leaf node (link)
  const isActive = pathname === item.path;
  return (
    <Link
      href={item.path}
      underline="hover"
      color={isActive ? "primary.main" : "text.primary"}
      fontWeight={isActive ? 600 : 400}
    >
      <ListItem sx={{ pl: (level + 1) * 2 }}>{item.label}</ListItem>
    </Link>
  );
}

export default function DocumentationSidebar({ navigation }: { navigation: NavigationItem[] }) {
  return (
    <Box component="nav" aria-label="Documentation Sidebar" sx={{ p: 2, height: "100vh", overflowY: "auto" }}>
      <List>
        <NavigationFolder items={navigation} />
      </List>
    </Box>
  );
}
