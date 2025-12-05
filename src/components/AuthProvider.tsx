"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type {
  User,
  UserCreate,
  Group,
  GroupCreate,
  GroupUpdate,
  Project,
  ProjectCreate,
  ProjectUpdate,
  Note,
  NoteCreate,
  JoinedProjectView,
  PiProjectView,
  UserProjectCreate,
  CurrentUser,
  PaginationParams,
  PaginatedResponse,
} from "@/src/util/types";

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
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<{ message: string }>;
  getCurrentUser: () => Promise<CurrentUser>;

  // Users
  getUsers: (params?: PaginationParams) => Promise<PaginatedResponse<User[]>>;
  getUser: (userId: number) => Promise<User>;
  createUser: (user: UserCreate) => Promise<User>;
  deleteUser: (userId: number) => Promise<void>;
  getUserProjects: (userId: number, params?: PaginationParams) => Promise<JoinedProjectView[]>;

  // Groups
  getGroups: (params?: PaginationParams) => Promise<PaginatedResponse<Group[]>>;
  getGroup: (groupId: number) => Promise<Group>;
  createGroup: (group: GroupCreate) => Promise<Group>;
  updateGroup: (groupId: number, group: GroupUpdate) => Promise<Group>;
  deleteGroup: (groupId: number) => Promise<void>;
  getGroupUsers: (groupId: number, params?: PaginationParams) => Promise<User[]>;
  addUserToGroup: (groupId: number, userId: number) => Promise<Record<string, unknown>>;
  removeUserFromGroup: (groupId: number, userId: number) => Promise<void>;

  // Projects
  getProjects: (params?: PaginationParams) => Promise<PaginatedResponse<Project[]>>;
  getProject: (projectId: number) => Promise<Project>;
  createProject: (project: ProjectCreate) => Promise<Project>;
  updateProject: (projectId: number, project: ProjectUpdate) => Promise<Project>;
  deleteProject: (projectId: number) => Promise<void>;
  getProjectUsers: (projectId: number, params?: PaginationParams) => Promise<JoinedProjectView[]>;
  addUserToProject: (projectId: number, userProject: UserProjectCreate) => Promise<Record<string, unknown>>;
  removeUserFromProject: (projectId: number, userId: number) => Promise<void>;
  getProjectNotes: (projectId: number, params?: PaginationParams) => Promise<Note[]>;
  addNoteToProject: (projectId: number, note: NoteCreate) => Promise<Note>;
  deleteNoteFromProject: (projectId: number, noteId: number) => Promise<void>;

  // PI Projects
  getPiProjects: (params?: PaginationParams) => Promise<PiProjectView[]>;
};

type AuthContextValue = {
  client: ApiClient;
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
async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
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

// Helper to build query strings
function buildQuery(params?: PaginationParams): string {
  if (!params) return "";
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", params.page.toString());
  if (params.page_size !== undefined) query.set("page_size", params.page_size.toString());
  if (params.query) {
    Object.entries(params.query).forEach(([key, value]) => query.set(key, value));
  }
  return query.toString() ? `?${query}` : "";
}

export function AuthClientProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiFetch("/me");
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const client: ApiClient = {
    // Authentication
    login: useCallback(async (username: string, password: string): Promise<LoginResult> => {
      try {
        const response = await apiFetch("/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          return { success: false, error: "Invalid username or password" };
        }

        const data = await response.json();
        setIsAuthenticated(true);
        return { success: true, message: data.message };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Login failed" };
      }
    }, []),

    logout: useCallback(async (): Promise<{ message: string }> => {
      const response = await apiFetch("/logout", { method: "POST" });
      if (!response.ok) throw new Error(`Logout failed: ${response.statusText}`);
      setIsAuthenticated(false);
      return response.json();
    }, []),

    getCurrentUser: useCallback(async (): Promise<CurrentUser> => {
      const response = await apiFetch("/me");
      if (!response.ok) throw new Error(`Failed to get current user: ${response.statusText}`);
      return response.json();
    }, []),

    // Users
    getUsers: useCallback(async (params?: PaginationParams): Promise<PaginatedResponse<User[]>> => {
      const response = await apiFetch(`/users${buildQuery(params)}`);
      if (!response.ok) throw new Error(`Failed to get users: ${response.statusText}`);
      const totalCount = parseInt(response.headers.get("X-Total-Count") || "0", 10);
      const data = await response.json();
      return { data, totalCount };
    }, []),

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

    getUserProjects: useCallback(async (userId: number, params?: PaginationParams): Promise<JoinedProjectView[]> => {
      const response = await apiFetch(`/users/${userId}/projects${buildQuery(params)}`);
      if (!response.ok) throw new Error(`Failed to get user projects: ${response.statusText}`);
      return response.json();
    }, []),

    // Groups
    getGroups: useCallback(async (params?: PaginationParams): Promise<PaginatedResponse<Group[]>> => {
      const response = await apiFetch(`/groups${buildQuery(params)}`);
      if (!response.ok) throw new Error(`Failed to get groups: ${response.statusText}`);
      const totalCount = parseInt(response.headers.get("X-Total-Count") || "0", 10);
      const data = await response.json();
      return { data, totalCount };
    }, []),

    getGroup: useCallback(async (groupId: number): Promise<Group> => {
      const response = await apiFetch(`/groups/${groupId}`);
      if (!response.ok) throw new Error(`Failed to get group: ${response.statusText}`);
      return response.json();
    }, []),

    createGroup: useCallback(async (group: GroupCreate): Promise<Group> => {
      const response = await apiFetch("/groups", {
        method: "POST",
        body: JSON.stringify(group),
      });
      if (!response.ok) throw new Error(`Failed to create group: ${response.statusText}`);
      return response.json();
    }, []),

    updateGroup: useCallback(async (groupId: number, group: GroupUpdate): Promise<Group> => {
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

    getGroupUsers: useCallback(async (groupId: number, params?: PaginationParams): Promise<User[]> => {
      const response = await apiFetch(`/groups/${groupId}/users${buildQuery(params)}`);
      if (!response.ok) throw new Error(`Failed to get group users: ${response.statusText}`);
      return response.json();
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
    getProjects: useCallback(async (params?: PaginationParams): Promise<PaginatedResponse<Project[]>> => {
      const response = await apiFetch(`/projects${buildQuery(params)}`);
      if (!response.ok) throw new Error(`Failed to get projects: ${response.statusText}`);
      const totalCount = parseInt(response.headers.get("X-Total-Count") || "0", 10);
      const data = await response.json();
      return { data, totalCount };
    }, []),

    getProject: useCallback(async (projectId: number): Promise<Project> => {
      const response = await apiFetch(`/projects/${projectId}`);
      if (!response.ok) throw new Error(`Failed to get project: ${response.statusText}`);
      return response.json();
    }, []),

    createProject: useCallback(async (project: ProjectCreate): Promise<Project> => {
      const response = await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify(project),
      });
      if (!response.ok) throw new Error(`Failed to create project: ${response.statusText}`);
      return response.json();
    }, []),

    updateProject: useCallback(async (projectId: number, project: ProjectUpdate): Promise<Project> => {
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

    getProjectUsers: useCallback(async (projectId: number, params?: PaginationParams): Promise<JoinedProjectView[]> => {
      const response = await apiFetch(`/projects/${projectId}/users${buildQuery(params)}`);
      if (!response.ok) throw new Error(`Failed to get project users: ${response.statusText}`);
      return response.json();
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
      []
    ),

    removeUserFromProject: useCallback(async (projectId: number, userId: number): Promise<void> => {
      const response = await apiFetch(`/projects/${projectId}/users/${userId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Failed to remove user from project: ${response.statusText}`);
    }, []),

    getProjectNotes: useCallback(async (projectId: number, params?: PaginationParams): Promise<Note[]> => {
      const response = await apiFetch(`/projects/${projectId}/notes${buildQuery(params)}`);
      if (!response.ok) throw new Error(`Failed to get project notes: ${response.statusText}`);
      return response.json();
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

    // PI Projects
    getPiProjects: useCallback(async (params?: PaginationParams): Promise<PiProjectView[]> => {
      const response = await apiFetch(`/pi-projects${buildQuery(params)}`);
      if (!response.ok) throw new Error(`Failed to get PI projects: ${response.statusText}`);
      return response.json();
    }, []),
  };

  return <AuthClientContext.Provider value={{ client, isAuthenticated }}>{children}</AuthClientContext.Provider>;
}

/** Hook for consuming auth context. */
export function useAuthClient() {
  const ctx = useContext(AuthClientContext);
  if (!ctx) {
    throw new Error("useAuthClient must be used within an AuthClientProvider");
  }
  return ctx;
}
