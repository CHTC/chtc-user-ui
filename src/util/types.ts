// Types for the API

export type PositionEnum = "SELECT" | "FACULTY" | "STAFF" | "POSTDOC" | "GRAD_STUDENT" | "UNDERGRADUATE" | "OTHER";
export type RoleEnum = "MEMBER" | "PI";

export interface User {
  id: number;
  username: string | null;
  name: string | null;
  email1: string | null;
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
}

export interface Group {
  id: number;
  name: string;
  point_of_contact: string | null;
  unix_gid: number | null;
  has_groupdir: boolean | null;
}

export interface GroupCreate {
  name: string;
  point_of_contact?: string | null;
  unix_gid?: number | null;
  has_groupdir?: boolean | null;
}

export interface GroupUpdate {
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

export interface ProjectCreate {
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

export interface ProjectUpdate {
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
  author?: string | null;
  date?: string | null;
  users: number[];
}

export interface JoinedProjectView {
  user_id: number;
  username: string;
  email1: string;
  phone1: string;
  netid: string;
  user_name: string;
  project_id: number;
  project_name: string;
  role: RoleEnum;
  last_note_ticket: string | null;
}

export interface PiProjectView {
  user_id: number;
  username: string;
  name: string;
  project_id: number;
  project_name: string;
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

export interface ApiParams {
  page?: number;
  page_size?: number;
  query?: Record<string, string>;
}
