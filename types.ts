export type PositionEnum = "SELECT" | "FACULTY" | "STAFF" | "POSTDOC" | "GRAD_STUDENT" | "UNDERGRADUATE" | "OTHER";

export type RoleEnum = "MEMBER" | "PI";

export type FormStatusEnum = "PENDING" | "APPROVED" | "DENIED";

export type EntityManagerEnum = "APPLICATION" | "MANIFEST" | "MORGRIDGE_ACTIVE_DIRECTORY";

export interface TokenGet {
  id: number;
  created_by: number;
  description: string;
  created_at: string;
  expires_at: string | null;
}

export interface TokenGetFull extends TokenGet {
  token: string;
}

export interface TokenPost {
  description: string;
  expires_at?: string | null;
}

export interface TokenPermissionGet {
  token_id: number;
  method: string;
  route: string;
}

export interface TokenPermissionPost {
  token_id: number;
  method: string;
  route: string;
}

export interface RouteGet {
  method: string;
  route: string;
}

export interface SubmitNode {
  id: number;
  name: string;
  group_id: number | null;
}

export interface UserSubmitNodeCreate {
  submit_node_id: number;
}

export interface UserSubmitGet {
  // disk_quota: number | null;
  // hpc_diskquota: number | null;
  // hpc_inodequota: number | null;
  // hpc_joblimit: number | null;
  // hpc_corelimit: number | null;
  // hpc_fairshare: number | null;
  user_id: number;
  id: number;
  name: string;
  group_id: number | null;
}

export interface Group {
  id: number;
  name: string;
  point_of_contact: User | null;
  unix_gid: number | null;
  has_groupdir: boolean | null;
}

export interface GroupCreateUpdate {
  name: string;
  point_of_contact?: number | null;
  unix_gid?: number | null;
  has_groupdir?: boolean | null;
}

export interface FieldsOfScience {
  fos_id: string;
  sed_cip_title: string | null;
  broad_field: string | null;
  major_field: string | null;
  detailed_field: string | null;
}

export interface CollegeAndDepartment {
  id: number;
  college: string | null;
  department: string | null;
}

export interface Project {
  id: number;
  name: string;
  display_name: string | null;
  description: string | null;
  pi: number | null;
  staff1: User | null;
  staff2: User | null;
  status: string | null;
  access: string | null;
  accounting_group: string;
  url: string | null;
  date: string | null;
  ticket: number | null;
  last_contact: string | null;
  college_and_department_id: number | null;
  fos_id: string | null;
  college_and_department: CollegeAndDepartment | null;
  field_of_science: FieldsOfScience | null;
  managed_by: EntityManagerEnum | null;
}

export interface PiProjectView {
  user_id: number;
  name: string | null;
  project_id: number;
  project_name: string;
  email1: string | null;
  phone1: string | null;
  netid: string | null;
}

export interface ProjectCreateUpdate {
  name: string;
  display_name?: string | null;
  description?: string | null;
  pi?: number | null;
  staff1?: number | null;
  staff2?: number | null;
  status?: string | null;
  access?: string | null;
  accounting_group: string;
  url?: string | null;
  date?: string | null;
  ticket?: number | null;
  last_contact?: string | null;
  college_and_department_id?: number | null;
  fos_id?: string | null;
}

export interface User {
  id: number;
  name: string | null;
  email1: string;
  email2: string | null;
  netid: string | null;
  netid_exp_datetime: string | null;
  phone1: string | null;
  phone2: string | null;
  is_admin: boolean | null;
  active: boolean | null;
  date: string | null;
  unix_uid: number | null;
  position: string;
  created_at: string;
  updated_at: string;
  submit_nodes?: UserSubmitGet[];
  notes?: Note[];
  projects?: JoinedProjectView[];
  groups?: UserGroupView[];
  user_forms?: UserForm[];
}

export interface UserCreate {
  name?: string | null;
  email1: string;
  email2?: string | null;
  netid?: string | null;
  netid_exp_datetime?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  is_admin?: boolean | null;
  active?: boolean | null;
  date?: string | null;
  unix_uid?: number | null;
  position?: PositionEnum | null;
  password?: string | null;
  primary_project_id: number;
  primary_project_role: RoleEnum;
  submit_nodes?: UserSubmitNodeCreate[] | null;
}

export interface UserUpdate {
  name?: string | null;
  email1: string;
  email2?: string | null;
  netid?: string | null;
  netid_exp_datetime?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  is_admin?: boolean | null;
  active?: boolean | null;
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
  author: User | null;
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
  project_staff1: User | null;
  project_staff2: User | null;
  project_status: string | null;
  project_accounting_group: string;
  project_last_contact: string | null;
  is_primary: boolean;
  name: string | null;
  email1: string;
  email2: string | null;
  netid: string | null;
  netid_exp_datetime: string | null;
  phone1: string | null;
  phone2: string | null;
  is_admin: boolean | null;
  active: boolean | null;
  date: string | null;
  unix_uid: number | null;
  position: string;
  role: RoleEnum;
  last_note_ticket: string | null;
  managed_by: EntityManagerEnum;
  created_at: string;
  updated_at: string;
}

export interface UserProjectCreate {
  project_id?: number | null;
  user_id?: number | null;
  role?: RoleEnum | null;
  is_primary?: boolean | null;
  managed_by?: EntityManagerEnum;
}

export interface UserGroupCreateUpdate {
  user_id: number | null;
  managed_by?: EntityManagerEnum;
}

// Returned by GET /users/{user_id}/groups
export interface UserGroupView {
  group_id: number;
  user_id: number;
  managed_by: EntityManagerEnum | null;
  created_at: string | null;
  updated_at: string | null;
  name: string;
  point_of_contact: User | null;
  unix_gid: number | null;
  has_groupdir: boolean;
}

// Returned by GET /groups/{group_id}/users
export interface GroupUserView {
  group_id: number;
  user_id: number;
  managed_by: EntityManagerEnum | null;
  created_at: string | null;
  updated_at: string | null;
  name: string;
  netid: string | null;
  username: string | null;
  is_admin: boolean | null;
  active: boolean | null;
  unix_uid: number | null;
}

export interface BaseForm {
  id: number;
  status: FormStatusEnum;
  created_by?: User | null;
  created_at: string;
  updated_by?: User | null;
  updated_at: string;
}

export interface UserForm extends BaseForm {
  pi_id?: number | null;
  pi_name?: string | null;
  email?: string | null;
  pi_email?: string | null;
  position: PositionEnum;
  content: Record<string, any>;
}

export interface UserFormPost {
  email?: string | null;
  pi_id?: number | null;
  pi_name?: string | null;
  pi_email?: string | null;
  position: PositionEnum;
  department?: string | null;
  mentor_name?: string | null;
  mentor_email?: string | null;
  marketing_attribution?: string | null;
  how_chtc_can_help?: string | null;
  research_computing_area?: string | null;
  software_link?: string | null;
  computing_type?: string | null;
  cpu_cores?: string | null;
  memory_gb?: string | null;
  disk_space_gb?: string | null;
  calculation_runtime_hours?: string | null;
  gpu_type?: string | null;
  calculation_quantity?: string | null;
  special_access?: string | null;
  extra_info?: string | null;
}

export interface UserFormPatch {
  status: FormStatusEnum;
  preserve_existing_data?: boolean;
  email?: string;
  project_id?: number;
  user_position?: PositionEnum;
  submit_nodes?: UserSubmitNodeCreate[];
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

import type { ReactNode } from "react";

export interface NavigationItem {
  label: string;
  path?: string;
  icon?: ReactNode;
  children?: NavigationItem[];
}
