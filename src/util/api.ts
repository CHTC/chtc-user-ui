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
  ApiParams,
} from "./types";

/** Client for interacting with the authenticated API. */
class AuthenticatedClient {
  private baseUrl: string;
  private csrfToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // #region Authentication

  /**
   * Login with username and password.
   * Sets httpOnly cookies (login_token and csrf_token) on successful login.
   */
  async login(username: string, password: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || `Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.extractCsrfToken();
    return data;
  }

  /** Logout and clear tokens. */
  async logout(): Promise<{ message: string }> {
    const response = await this.request("/logout", { method: "POST" });

    if (!response.ok) {
      throw new Error(`Logout failed: ${response.statusText}`);
    }

    this.csrfToken = null;
    return response.json();
  }

  /** Get current user information. */
  async getCurrentUser(): Promise<CurrentUser> {
    const response = await this.request("/me", { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to get current user: ${response.statusText}`);
    }

    return response.json();
  }

  /** Check if authenticated (by using login_token cookie). */
  isAuthenticated(): boolean {
    if (typeof document === "undefined") {
      return false;
    }

    const cookies = document.cookie.split(";");
    const loginCookie = cookies.find((cookie) => cookie.trim().startsWith("login_token="));
    return !!loginCookie;
  }

  // #endregion Authentication

  // #region Users

  /** Get all users, with pagination. */
  async getUsers(params?: ApiParams): Promise<User[]> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.set("page", params.page.toString());
    if (params?.page_size !== undefined) queryParams.set("page_size", params.page_size.toString());
    if (params?.query) {
      Object.entries(params.query).forEach(([key, value]) => queryParams.set(key, value));
    }

    const response = await this.request(`/users?${queryParams}`, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to get users: ${response.statusText}`);
    }

    return response.json();
  }

  /** Get a single user by ID. */
  async getUser(userId: number): Promise<User> {
    const response = await this.request(`/users/${userId}`, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.statusText}`);
    }

    return response.json();
  }

  /** Create a new user. */
  async createUser(user: UserCreate): Promise<User> {
    const response = await this.request("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.statusText}`);
    }

    return response.json();
  }

  /** Delete a user. */
  async deleteUser(userId: number): Promise<void> {
    const response = await this.request(`/users/${userId}`, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.statusText}`);
    }
  }

  /** Get projects for a user. */
  async getUserProjects(userId: number, params?: ApiParams): Promise<JoinedProjectView[]> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.set("page", params.page.toString());
    if (params?.page_size !== undefined) queryParams.set("page_size", params.page_size.toString());

    const response = await this.request(`/users/${userId}/projects?${queryParams}`, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to get user projects: ${response.statusText}`);
    }

    return response.json();
  }

  // #endregion Users

  // #region Groups

  /** Get all groups, with pagination. */
  async getGroups(params?: ApiParams): Promise<Group[]> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.set("page", params.page.toString());
    if (params?.page_size !== undefined) queryParams.set("page_size", params.page_size.toString());
    if (params?.query) {
      Object.entries(params.query).forEach(([key, value]) => queryParams.set(key, value));
    }

    const response = await this.request(`/groups?${queryParams}`, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to get groups: ${response.statusText}`);
    }

    return response.json();
  }

  /** Get a single group by ID. */
  async getGroup(groupId: number): Promise<Group> {
    const response = await this.request(`/groups/${groupId}`, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to get group: ${response.statusText}`);
    }

    return response.json();
  }

  /** Create a new group. */
  async createGroup(group: GroupCreate): Promise<Group> {
    const response = await this.request("/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(group),
    });

    if (!response.ok) {
      throw new Error(`Failed to create group: ${response.statusText}`);
    }

    return response.json();
  }

  /** Update a group. */
  async updateGroup(groupId: number, group: GroupUpdate): Promise<Group> {
    const response = await this.request(`/groups/${groupId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(group),
    });

    if (!response.ok) {
      throw new Error(`Failed to update group: ${response.statusText}`);
    }

    return response.json();
  }

  /** Delete a group. */
  async deleteGroup(groupId: number): Promise<void> {
    const response = await this.request(`/groups/${groupId}`, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(`Failed to delete group: ${response.statusText}`);
    }
  }

  /** Get users in a group. */
  async getGroupUsers(groupId: number, params?: ApiParams): Promise<User[]> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.set("page", params.page.toString());
    if (params?.page_size !== undefined) queryParams.set("page_size", params.page_size.toString());

    const response = await this.request(`/groups/${groupId}/users?${queryParams}`, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to get group users: ${response.statusText}`);
    }

    return response.json();
  }

  /** Add a user to a group. */
  async addUserToGroup(groupId: number, userId: number): Promise<Record<string, unknown>> {
    const response = await this.request(`/groups/${groupId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add user to group: ${response.statusText}`);
    }

    return response.json();
  }

  /** Remove a user from a group. */
  async removeUserFromGroup(groupId: number, userId: number): Promise<void> {
    const response = await this.request(`/groups/${groupId}/users/${userId}`, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(`Failed to remove user from group: ${response.statusText}`);
    }
  }

  // #endregion Groups

  // #region Projects

  /** Get all projects, with pagination. */
  async getProjects(params?: ApiParams): Promise<Project[]> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.set("page", params.page.toString());
    if (params?.page_size !== undefined) queryParams.set("page_size", params.page_size.toString());
    if (params?.query) {
      Object.entries(params.query).forEach(([key, value]) => queryParams.set(key, value));
    }

    const response = await this.request(`/projects?${queryParams}`, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to get projects: ${response.statusText}`);
    }

    return response.json();
  }

  /** Get a single project by ID. */
  async getProject(projectId: number): Promise<Project> {
    const response = await this.request(`/projects/${projectId}`, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to get project: ${response.statusText}`);
    }

    return response.json();
  }

  /** Create a new project. */
  async createProject(project: ProjectCreate): Promise<Project> {
    const response = await this.request("/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      throw new Error(`Failed to create project: ${response.statusText}`);
    }

    return response.json();
  }

  /** Update a project. */
  async updateProject(projectId: number, project: ProjectUpdate): Promise<Project> {
    const response = await this.request(`/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      throw new Error(`Failed to update project: ${response.statusText}`);
    }

    return response.json();
  }

  /** Delete a project. */
  async deleteProject(projectId: number): Promise<void> {
    const response = await this.request(`/projects/${projectId}`, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(`Failed to delete project: ${response.statusText}`);
    }
  }

  /** Get users in a project. */
  async getProjectUsers(projectId: number, params?: ApiParams): Promise<JoinedProjectView[]> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.set("page", params.page.toString());
    if (params?.page_size !== undefined) queryParams.set("page_size", params.page_size.toString());

    const response = await this.request(`/projects/${projectId}/users?${queryParams}`, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to get project users: ${response.statusText}`);
    }

    return response.json();
  }

  /** Add a user to a project. */
  async addUserToProject(projectId: number, userProject: UserProjectCreate): Promise<Record<string, unknown>> {
    const response = await this.request(`/projects/${projectId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userProject),
    });

    if (!response.ok) {
      throw new Error(`Failed to add user to project: ${response.statusText}`);
    }

    return response.json();
  }

  /** Remove a user from a project. */
  async removeUserFromProject(projectId: number, userId: number): Promise<void> {
    const response = await this.request(`/projects/${projectId}/users/${userId}`, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(`Failed to remove user from project: ${response.statusText}`);
    }
  }

  /** Get notes for a project. */
  async getProjectNotes(projectId: number, params?: ApiParams): Promise<Note[]> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.set("page", params.page.toString());
    if (params?.page_size !== undefined) queryParams.set("page_size", params.page_size.toString());

    const response = await this.request(`/projects/${projectId}/notes?${queryParams}`, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to get project notes: ${response.statusText}`);
    }

    return response.json();
  }

  /** Add a note to a project. */
  async addNoteToProject(projectId: number, note: NoteCreate): Promise<Note> {
    const response = await this.request(`/projects/${projectId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    });

    if (!response.ok) {
      throw new Error(`Failed to add note to project: ${response.statusText}`);
    }

    return response.json();
  }

  /** Delete a note from a project. */
  async deleteNoteFromProject(projectId: number, noteId: number): Promise<void> {
    const response = await this.request(`/projects/${projectId}/notes/${noteId}`, { method: "DELETE" });

    if (!response.ok) {
      throw new Error(`Failed to delete note from project: ${response.statusText}`);
    }
  }

  // #endregion Projects

  // #region PI Projects

  /** Get PI projects view. */
  async getPiProjects(params?: ApiParams): Promise<PiProjectView[]> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.set("page", params.page.toString());
    if (params?.page_size !== undefined) queryParams.set("page_size", params.page_size.toString());

    const response = await this.request(`/pi-projects?${queryParams}`, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to get PI projects: ${response.statusText}`);
    }

    return response.json();
  }

  // #endregion PI Projects

  // #region Private Helper Methods

  /** Make an authenticated request with CSRF protection. */
  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        ...options.headers,
        ...this.getHeaders(options.method),
      },
    });

    return response;
  }

  /** Get headers including CSRF token for state-changing requests. */
  private getHeaders(method?: string): HeadersInit {
    const headers: HeadersInit = {};

    if (method && ["POST", "PUT", "DELETE", "PATCH"].includes(method.toUpperCase())) {
      if (!this.csrfToken) {
        this.extractCsrfToken();
      }
      if (this.csrfToken) {
        headers["X-CSRF-Token"] = this.csrfToken;
      }
    }

    return headers;
  }

  /** Extract CSRF token from cookies. */
  private extractCsrfToken(): void {
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";");
      const csrfCookie = cookies.find((cookie) => cookie.trim().startsWith("csrf_token="));
      if (csrfCookie) {
        this.csrfToken = csrfCookie.split("=")[1];
      }
    }
  }

  // #endregion Private Helper Methods
}

export default AuthenticatedClient;
