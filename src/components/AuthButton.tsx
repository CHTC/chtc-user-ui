import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  CircularProgress,
} from "@mui/material";
import { useAuthClient } from "./AuthProvider";
import { useState } from "react";

export function AuthButton() {
  const { client, isAuthenticated } = useAuthClient();

  const [loginModalShown, setLoginModalShown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (username === "" || password === "") {
      setError("Username and password are required.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await client.login(username, password);

      if (result.success) {
        // login successful
        setLoginModalShown(false);
        setUsername("");
        setPassword("");
      } else {
        // login failed
        setError(result.error);
        setPassword("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setLoginModalShown(false);
    setError(null);
    setUsername("");
    setPassword("");
  };

  return (
    <>
      {isAuthenticated ? (
        <Button
          variant={"outlined"}
          onClick={async () => {
            await client.logout();
          }}
          // @ts-expect-error Colors must be broken because this works just fine and is more extensible than hardcoding a color
          color={"primary.contrastText"}
        >
          Logout
        </Button>
      ) : (
        <Button
          variant={"outlined"}
          onClick={() => setLoginModalShown(true)}
          // @ts-expect-error Colors must be broken because this works just fine and is more extensible than hardcoding a color
          color={"primary.contrastText"}
        >
          Login
        </Button>
      )}

      <Dialog open={loginModalShown} onClose={handleClose} maxWidth="xs" fullWidth>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <DialogTitle>Login</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                autoFocus
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
              />
            </Box>

            <Box sx={{ color: "error.main", pt: 2 }}>{error}</Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={isLoading} type="button">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={isLoading}>
              {isLoading ? <CircularProgress size={24} /> : "Login"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

export default AuthButton;
