"use client";

import type {
  Group,
  GroupCreateUpdate,
  Note,
  NoteCreate,
  Project,
  ProjectCreateUpdate,
  TokenGetFull,
  TokenPost,
  User,
  UserCreate,
  UserProjectCreate,
} from "@/types";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type LoginResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

export type ApiClient = {
  // Authentication
  logout: () => Promise<{ message: string }>;
  getCurrentUser: () => Promise<User>;

  // Users
  getUser: (userId: number) => Promise<User>;
  createUser: (user: UserCreate) => Promise<User>;
  deleteUser: (userId: number) => Promise<void>;

  // Groups
  getGroup: (groupId: number) => Promise<Group>;
  createGroup: (group: GroupCreateUpdate) => Promise<Group>;
  updateGroup: (groupId: number, group: GroupCreateUpdate) => Promise<Group>;
  deleteGroup: (groupId: number) => Promise<void>;
  addUserToGroup: (groupId: number, userId: number) => Promise<Record<string, unknown>>;
  removeUserFromGroup: (groupId: number, userId: number) => Promise<void>;

  // Projects
  getProject: (projectId: number) => Promise<Project>;
  createProject: (project: ProjectCreateUpdate) => Promise<Project>;
  updateProject: (projectId: number, project: ProjectCreateUpdate) => Promise<Project>;
  deleteProject: (projectId: number) => Promise<void>;
  addUserToProject: (projectId: number, userProject: UserProjectCreate) => Promise<Record<string, unknown>>;
  removeUserFromProject: (projectId: number, userId: number) => Promise<void>;
  addNoteToProject: (projectId: number, note: NoteCreate) => Promise<Note>;
  deleteNoteFromProject: (projectId: number, noteId: number) => Promise<void>;

  // Tokens
  getToken: (tokenId: number) => Promise<TokenGetFull>;
  createToken: (token: TokenPost) => Promise<TokenGetFull>;
  deleteToken: (tokenId: number) => Promise<void>;
};

type AuthContextValue = {
  loading: boolean;
  client: ApiClient;
  currentUser: User | null;
  update: () => void; // Function to trigger a refresh of the current user data
  isAuthenticated: boolean;
};

const AuthClientContext = createContext<AuthContextValue | null>(null);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

// Get CSRF token from cookie
function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? match[1] : null;
}

// Simple fetch wrapper with credentials and CSRF token
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Merge any existing headers
  if (options.headers) {
    const existingHeaders = new Headers(options.headers);
    existingHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  // Add CSRF token for state-changing requests
  const method = options.method?.toUpperCase() || "GET";
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  }

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });
}

export function AuthClientProvider({ children }: { children: React.ReactNode }) {

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/me");
      setIsAuthenticated(response.ok);
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      }
    } catch {
      setIsAuthenticated(false);
    }
    setLoading(false);
  };

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const client: ApiClient = {
    logout: useCallback(async (): Promise<{ message: string }> => {
      const response = await apiFetch("/logout", { method: "POST" });
      if (!response.ok) throw new Error(`Logout failed: ${response.statusText}`);
      setIsAuthenticated(false);
      return response.json();
    }, []),

    getCurrentUser: useCallback(async (): Promise<User> => {
      const response = await apiFetch("/me");
      if (!response.ok) throw new Error(`Failed to get current user: ${response.statusText}`);
      return response.json();
    }, []),

    // Users
    getUser: useCallback(async (userId: number): Promise<User> => {
      const response = await apiFetch(`/users/${userId}`);
      if (!response.ok) throw new Error(`Failed to get user: ${response.statusText}`);
      return response.json();
    }, []),

    createUser: useCallback(async (user: UserCreate): Promise<User> => {
      const response = await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify(user),
      });
      if (!response.ok) throw new Error(`Failed to create user: ${response.statusText}`);
      return response.json();
    }, []),

    deleteUser: useCallback(async (userId: number): Promise<void> => {
      const response = await apiFetch(`/users/${userId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Failed to delete user: ${response.statusText}`);
    }, []),

    // Groups
    getGroup: useCallback(async (groupId: number): Promise<Group> => {
      const response = await apiFetch(`/groups/${groupId}`);
      if (!response.ok) throw new Error(`Failed to get group: ${response.statusText}`);
      return response.json();
    }, []),

    createGroup: useCallback(async (group: GroupCreateUpdate): Promise<Group> => {
      const response = await apiFetch("/groups", {
        method: "POST",
        body: JSON.stringify(group),
      });
      if (!response.ok) throw new Error(`Failed to create group: ${response.statusText}`);
      return response.json();
    }, []),

    updateGroup: useCallback(async (groupId: number, group: GroupCreateUpdate): Promise<Group> => {
      const response = await apiFetch(`/groups/${groupId}`, {
        method: "PUT",
        body: JSON.stringify(group),
      });
      if (!response.ok) throw new Error(`Failed to update group: ${response.statusText}`);
      return response.json();
    }, []),

    deleteGroup: useCallback(async (groupId: number): Promise<void> => {
      const response = await apiFetch(`/groups/${groupId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Failed to delete group: ${response.statusText}`);
    }, []),

    addUserToGroup: useCallback(async (groupId: number, userId: number): Promise<Record<string, unknown>> => {
      const response = await apiFetch(`/groups/${groupId}/users`, {
        method: "POST",
        body: JSON.stringify({ id: userId }),
      });
      if (!response.ok) throw new Error(`Failed to add user to group: ${response.statusText}`);
      return response.json();
    }, []),

    removeUserFromGroup: useCallback(async (groupId: number, userId: number): Promise<void> => {
      const response = await apiFetch(`/groups/${groupId}/users/${userId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Failed to remove user from group: ${response.statusText}`);
    }, []),

    // Projects
    getProject: useCallback(async (projectId: number): Promise<Project> => {
      const response = await apiFetch(`/projects/${projectId}`);
      if (!response.ok) throw new Error(`Failed to get project: ${response.statusText}`);
      return response.json();
    }, []),

    createProject: useCallback(async (project: ProjectCreateUpdate): Promise<Project> => {
      const response = await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify(project),
      });
      if (!response.ok) throw new Error(`Failed to create project: ${response.statusText}`);
      return response.json();
    }, []),

    updateProject: useCallback(async (projectId: number, project: ProjectCreateUpdate): Promise<Project> => {
      const response = await apiFetch(`/projects/${projectId}`, {
        method: "PUT",
        body: JSON.stringify(project),
      });
      if (!response.ok) throw new Error(`Failed to update project: ${response.statusText}`);
      return response.json();
    }, []),

    deleteProject: useCallback(async (projectId: number): Promise<void> => {
      const response = await apiFetch(`/projects/${projectId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Failed to delete project: ${response.statusText}`);
    }, []),

    addUserToProject: useCallback(
      async (projectId: number, userProject: UserProjectCreate): Promise<Record<string, unknown>> => {
        const response = await apiFetch(`/projects/${projectId}/users`, {
          method: "POST",
          body: JSON.stringify(userProject),
        });
        if (!response.ok) throw new Error(`Failed to add user to project: ${response.statusText}`);
        return response.json();
      },
      [],
    ),

    removeUserFromProject: useCallback(async (projectId: number, userId: number): Promise<void> => {
      const response = await apiFetch(`/projects/${projectId}/users/${userId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Failed to remove user from project: ${response.statusText}`);
    }, []),

    addNoteToProject: useCallback(async (projectId: number, note: NoteCreate): Promise<Note> => {
      const response = await apiFetch(`/projects/${projectId}/notes`, {
        method: "POST",
        body: JSON.stringify(note),
      });
      if (!response.ok) throw new Error(`Failed to add note to project: ${response.statusText}`);
      return response.json();
    }, []),

    deleteNoteFromProject: useCallback(async (projectId: number, noteId: number): Promise<void> => {
      const response = await apiFetch(`/projects/${projectId}/notes/${noteId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Failed to delete note from project: ${response.statusText}`);
    }, []),

    // Tokens
    getToken: useCallback(async (tokenId: number): Promise<TokenGetFull> => {
      const response = await apiFetch(`/tokens/${tokenId}`);
      if (!response.ok) throw new Error(`Failed to get token: ${response.statusText}`);
      return response.json();
    }, []),

    createToken: useCallback(async (token: TokenPost): Promise<TokenGetFull> => {
      const response = await apiFetch("/tokens", {
        method: "POST",
        body: JSON.stringify(token),
      });
      if (!response.ok) throw new Error(`Failed to create token: ${response.statusText}`);
      return response.json();
    }, []),

    deleteToken: useCallback(async (tokenId: number): Promise<void> => {
      const response = await apiFetch(`/tokens/${tokenId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Failed to delete token: ${response.statusText}`);
    }, []),
  };

  return <AuthClientContext.Provider value={{ loading, client, currentUser, isAuthenticated, update: checkAuth }}>{children}</AuthClientContext.Provider>;
}

/** Hook for consuming auth context. */
export function useAuthClient() {
  const ctx = useContext(AuthClientContext);
  if (!ctx) {
    throw new Error("useAuthClient must be used within an AuthClientProvider");
  }
  return ctx;
}
