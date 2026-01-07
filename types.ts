// Types generated from OpenAPI spec in openapi (1).json
// This file provides a consolidated set of interfaces/enums matching the backend API.

export type PositionEnum = "SELECT" | "FACULTY" | "STAFF" | "POSTDOC" | "GRAD_STUDENT" | "UNDERGRADUATE" | "OTHER";

export type RoleEnum = "MEMBER" | "PI";

export interface SubmitNode {
  id: number;
  name: string;
}

export interface UserSubmitNodeCreate {
  submit_node_id: number;
}

export interface UserSubmitGet {
  id: number;
  submit_node_id: number;
  submit_node_name: string;
  user_id: number;
  disk_quota: number | null;
  hpc_diskquota: number | null;
  hpc_inodequota: number | null;
  hpc_joblimit: number | null;
  hpc_corelimit: number | null;
  hpc_fairshare: number | null;
}

export interface Group {
  id: number;
  name: string;
  point_of_contact: string | null;
  unix_gid: number | null;
  has_groupdir: boolean | null;
}

export interface GroupCreateUpdate {
  name: string;
  point_of_contact?: string | null;
  unix_gid?: number | null;
  has_groupdir?: boolean | null;
}

export interface Project {
  id: number;
  name: string;
  pi: number | null;
  staff1: string | null;
  staff2: string | null;
  status: string | null;
  access: string | null;
  accounting_group: string;
  url: string | null;
  date: string | null;
  ticket: number | null;
  last_contact: string | null;
}

export interface PiProjectView {
  user_id: number;
  username: string | null;
  name: string | null;
  project_id: number;
  project_name: string;
  email1: string | null;
  phone1: string | null;
  netid: string | null;
}

export interface ProjectCreateUpdate {
  name: string;
  pi?: number | null;
  staff1?: string | null;
  staff2?: string | null;
  status?: string | null;
  access?: string | null;
  accounting_group: string;
  url?: string | null;
  date?: string | null;
  ticket?: number | null;
  last_contact?: string | null;
}

export interface User {
  id: number;
  username: string | null;
  name: string | null;
  email1: string;
  email2: string | null;
  netid: string | null;
  netid_exp_datetime: string | null;
  phone1: string | null;
  phone2: string | null;
  is_admin: boolean | null;
  auth_netid: boolean | null;
  auth_username: boolean | null;
  date: string | null;
  unix_uid: number | null;
  position: string;
  submit_nodes?: UserSubmitGet[];
  notes?: Note[];
  projects?: JoinedProjectView[];
}

export interface UserCreate {
  username?: string | null;
  name?: string | null;
  email1: string;
  email2?: string | null;
  netid?: string | null;
  netid_exp_datetime?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  is_admin?: boolean | null;
  auth_netid?: boolean | null;
  auth_username?: boolean | null;
  date?: string | null;
  unix_uid?: number | null;
  position?: PositionEnum | null;
  password?: string | null;
  primary_project_id: number;
  primary_project_role: RoleEnum;
  submit_nodes?: UserSubmitNodeCreate[] | null;
}

export interface UserUpdate {
  username?: string | null;
  name?: string | null;
  email1: string;
  email2?: string | null;
  netid?: string | null;
  netid_exp_datetime?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  is_admin?: boolean | null;
  auth_netid?: boolean | null;
  auth_username?: boolean | null;
  date?: string | null;
  unix_uid?: number | null;
  position?: PositionEnum | null;
  password?: string | null;
  submit_nodes?: UserSubmitNodeCreate[] | null;
}

export interface Note {
  id: number;
  ticket: string | null;
  note: string | null;
  author: string | null;
  date: string | null;
  users: User[];
}

export interface NoteCreate {
  ticket?: string | null;
  note?: string | null;
  users: number[];
}

export interface JoinedProjectView {
  id: number;
  project_id: number;
  project_name: string;
  project_staff1: string | null;
  project_staff2: string | null;
  project_status: string | null;
  project_accounting_group: string;
  project_last_contact: string | null;
  is_primary: boolean;
  username: string | null;
  name: string | null;
  email1: string;
  email2: string | null;
  netid: string | null;
  netid_exp_datetime: string | null;
  phone1: string | null;
  phone2: string | null;
  is_admin: boolean | null;
  auth_netid: boolean | null;
  auth_username: boolean | null;
  date: string | null;
  unix_uid: number | null;
  position: string;
  role: RoleEnum;
  last_note_ticket: string | null;
}

export interface UserProjectCreate {
  project_id?: number | null;
  user_id?: number | null;
  role?: RoleEnum | null;
  is_primary?: boolean | null;
}

export interface Relationship {
  id: number;
}

export interface Login {
  username: string;
  password: string;
}

export interface CurrentUser {
  username: string;
  is_admin: boolean;
}

export type SortDirection = "asc" | "desc";

export interface PaginationParams {
  page?: number;
  page_size?: number;
  query?: Record<string, string | string[]>;
  sortColumn?: string;
  sortDirection?: SortDirection;
}

export interface PaginatedResponse<T> {
  data: T;
  totalCount: number;
}

export interface ValidationError {
  loc: Array<string | number>;
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

// Other

export type FormMode = "create" | "edit";

// UI Types
import { ReactNode } from "react";

export interface NavigationItem {
  label: string;
  path?: string;
  icon?: ReactNode;
  children?: NavigationItem[];
}
