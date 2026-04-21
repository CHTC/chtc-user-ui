import { Button } from "@mui/material";
import { useAuthClient } from "./AuthProvider";

export function AuthButton() {
  const { client, isAuthenticated } = useAuthClient();

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
        <>
          <Button
            href={"/forms/user-applications/create"}
            variant={"contained"}
            color={"secondary"}
          >
            Apply for Account
          </Button>
          <Button
            href={"/api/login"}
            variant={"text"}
            // @ts-expect-error Colors must be broken because this works just fine and is more extensible than hardcoding a color
            color={"primary.contrastText"}
          >
            Login
          </Button>
        </>
      )}
    </>
  );
}

export default AuthButton;
