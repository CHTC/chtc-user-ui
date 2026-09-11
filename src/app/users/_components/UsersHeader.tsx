import { Box, Link, Typography } from "@mui/material";
import CreateUserButton from "./CreateUserButton";

/**
 * The "Users" heading that sits above the user directory and the pages reached
 * from it.
 *
 * This used to be `users/layout.tsx`, which meant every route under /users/ got
 * it whether it belonged to the directory or not. The job pages live at
 * /users/jobs/, /users/jobs/calendar/ and /users/me/jobs/ and are full pages in
 * their own right with their own headings, so the header is now rendered by the
 * pages that want it rather than inherited by every page beneath the segment.
 */
export default function UsersHeader({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <Typography
        variant={"h3"}
        component="h1"
        sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}
      >
        <Link href="/users/" style={{ textDecoration: "none", color: "inherit" }}>
          Users
        </Link>
        <CreateUserButton />
      </Typography>
      <Box>{children}</Box>
    </>
  );
}
