"use client";

import { createContext, useContext } from "react";
import AuthenticatedClient from "../util/api";

const AuthContext = createContext<AuthenticatedClient | null>(null);

/** Provides authentication context to its children components. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authClient = new AuthenticatedClient("/api");

  // temporarily hardcode login for testing purposes
  authClient
    .login("admin", "password")
    .then((result) => {
      console.log(`Authentication result: ${result.message}`);
    })
    .catch((error) => {
      console.error("Authentication failed:", error);
    });

  return <AuthContext.Provider value={authClient}>{children}</AuthContext.Provider>;
}

/** Custom hook to access the authentication context. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
