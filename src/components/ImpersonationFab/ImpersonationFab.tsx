"use client";

import { useAuthClient } from "@/src/components/AuthProvider";
import UserAutocomplete from "@/src/components/UserAutocomplete/UserAutocomplete";
import type { User } from "@/types";
import { Person, PersonOff } from "@mui/icons-material";
import { Alert, Box, Button, Fab, Popover, Typography } from "@mui/material";
import { useState } from "react";

// The UI has to be built with NEXT_PUBLIC_ALLOW_IMPERSONATE=true as well as the API being started
// with ALLOW_IMPERSONATE=true; neither alone shows the picker
const UI_ENABLED = process.env.NEXT_PUBLIC_ALLOW_IMPERSONATE === "true";

/**
 * A small person button in the bottom right corner for staff to view the site as another user.
 * It opens a panel with a user picker, or, while viewing as someone, with who that is and a button
 * to go back. The picker needs both the UI's and the API's flag; the way back is shown for any
 * running "view as" session so nobody is left stuck as someone else. The page reloads on either
 * change so nothing cached for the other user remains.
 */
const ImpersonationFab = () => {
  const { currentUser, client } = useAuthClient();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const impersonator = currentUser?.impersonator ?? null;
  const canStart = UI_ENABLED && !!currentUser?.can_impersonate;
  if (!currentUser || (!canStart && !impersonator)) return null;

  const run = async (action: () => Promise<User>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setBusy(false);
    }
  };

  const label = impersonator ? `Viewing as ${currentUser.name ?? currentUser.email1}` : "View the site as another user";

  return (
    <>
      <Fab
        color={impersonator ? "warning" : "primary"}
        size="small"
        aria-label={label}
        title={label}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ position: "fixed", right: 16, bottom: 16, zIndex: (theme) => theme.zIndex.speedDial }}
      >
        {impersonator ? <PersonOff /> : <Person />}
      </Fab>
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        slotProps={{ paper: { sx: { p: 2, width: 320, mt: -1 } } }}
      >
        {impersonator ? (
          <Box display="flex" flexDirection="column" gap={1.5}>
            <Typography variant="body2">
              Viewing as <strong>{currentUser.name ?? currentUser.email1}</strong>, logged in as{" "}
              {impersonator.name ?? impersonator.email1}.
            </Typography>
            <Button variant="contained" color="warning" disabled={busy} onClick={() => run(client.stopImpersonating)}>
              Stop viewing as {currentUser.name ?? "this user"}
            </Button>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={1.5}>
            <Typography variant="body2">View the site as another user. Everything you do counts as them.</Typography>
            <UserAutocomplete
              label="User"
              disabled={busy}
              onSelect={(user) => {
                if (user) void run(() => client.impersonate(user.id));
              }}
            />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {error}
          </Alert>
        )}
      </Popover>
    </>
  );
};

export default ImpersonationFab;
