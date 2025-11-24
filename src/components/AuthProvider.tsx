"use client";

import { createContext, useContext } from "react";
import AuthenticatedClient from "../util/api";

const AuthClientContext = createContext<AuthenticatedClient | null>(null);

/** Provides authentication context to its children components. */
export function AuthClientProvider({ children }: { children: React.ReactNode }) {
  const authClient = new AuthenticatedClient("/api");

  return <AuthClientContext.Provider value={authClient}>{children}</AuthClientContext.Provider>;
}

/** Custom hook to access the authentication context. */
export function useAuthClient() {
  const client = useContext(AuthClientContext);
  if (!client) {
    throw new Error("useAuthClient must be used within an AuthClientProvider");
  }
  return { client, isAuthenticated: client.isAuthenticated() };
}
