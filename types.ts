export type PositionEnum = "SELECT" | "FACULTY" | "STAFF" | "POSTDOC" | "GRAD_STUDENT" | "UNDERGRADUATE" | "OTHER";

export type FormStatusEnum = "PENDING" | "APPROVED" | "DENIED";

export type EntityManagerEnum = "APPLICATION" | "MANIFEST" | "MORGRIDGE_ACTIVE_DIRECTORY";

export type AuditActionEnum =
  | "member_added"
  | "member_removed"
  | "group_created"
  | "group_deleted"
  | "owner_group_changed"
  | "metadata_changed";

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
  user_id: number;
  id: number;
  name: string;
  group_id: number | null;
}

// Groups

/** Who may administer a new group: nobody but staff, an owners group, or owners + managers (the design's O/M structure) */
export type GroupAdministration = "none" | "owners" | "owners_and_managers";

export interface Group {
  id: number;
  name: string;
  unix_gid: number | null;
  /** null means only staff administer the group */
  owner_group_id: number | null;
  description: string | null;
  expires_at: string | null;
  /** Groups are soft-deleted; staff can still read a deleted group */
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupCreateUpdate {
  name: string;
  unix_gid?: number | null;
  description?: string | null;
  expires_at?: string | null;
  owner_group_id?: number | null;
  /** Create only; cannot be combined with owner_group_id */
  administration?: GroupAdministration;
}

/** A direct membership row (GET /groups/{id}/direct_members): exactly one of member_user / member_group is set */
export interface GroupMember {
  id: number;
  group_id: number;
  member_user: User | null;
  member_group: Group | null;
  managed_by: EntityManagerEnum;
  created_at: string;
}

export interface GroupMemberCreate {
  user_id?: number;
  group_id?: number;
  managed_by?: EntityManagerEnum;
}

/**
 * A path is the chain of group ids from the group being viewed down to the group
 * the user is a direct member of. Direct membership is a path of length 1.
 */
export type MembershipPath = number[];
export type MembershipPathNames = string[];

/** Returned by GET /groups/{id}/members: every user with access through the group, and how */
export interface GroupMembersView {
  group_id: number;
  user_id: number;
  direct: boolean;
  paths: MembershipPath[];
  path_names: MembershipPathNames[];
  /** From the direct membership row, null when access comes only through another group */
  managed_by: EntityManagerEnum | null;
  name: string | null;
  netid: string | null;
  username: string | null;
  email1: string | null;
  is_admin: boolean | null;
  active: boolean | null;
  unix_uid: number | null;
  position: PositionEnum | null;
}

/** Returned by GET /users/{id}/groups: every group the user is an effective member of, and how */
export interface UserGroupsView {
  user_id: number;
  group_id: number;
  direct: boolean;
  paths: MembershipPath[];
  path_names: MembershipPathNames[];
  managed_by: EntityManagerEnum | null;
  name: string;
  unix_gid: number | null;
  owner_group_id: number | null;
  description: string | null;
  expires_at: string | null;
  deleted_at: string | null;
}

/** Returned by GET /groups/{id}/member_of: each path runs from the containing group down to this group */
export interface GroupMemberOf {
  group: Group;
  paths: MembershipPath[];
}

/** One access object reachable from a group (GET /groups/{id}/access). via is [] when the object references this group directly */
export interface GroupAccessProject {
  project_id: number;
  name: string;
  display_name: string | null;
  as: "pi_group" | "project_group";
  group_id: number;
  via: MembershipPath[];
}

export interface GroupAccessDataAccess {
  id: number;
  backing_store_id: number;
  backing_store_name: string;
  path: string;
  group_id: number;
  via: MembershipPath[];
}

export interface GroupAccessSubmitNode {
  id: number;
  name: string;
  group_id: number;
  via: MembershipPath[];
}

export interface GroupAccess {
  projects: GroupAccessProject[];
  data_access: GroupAccessDataAccess[];
  submit_nodes: GroupAccessSubmitNode[];
}

export interface UnixGroup {
  id: number;
  name: string;
  unix_gid: number;
  members: string[];
}

// Data access

export interface BackingStore {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackingStoreCreateUpdate {
  name: string;
  description?: string | null;
}

export interface DataAccess {
  id: number;
  backing_store_id: number;
  /** null grants access to no one */
  group_id: number | null;
  path: string;
  inode_count: number | null;
  byte_size: number | null;
  created_at: string;
  updated_at: string;
}

export interface DataAccessCreate {
  backing_store_id: number;
  group_id?: number | null;
  path: string;
  inode_count?: number | null;
  byte_size?: number | null;
}

/** backing_store_id and path are immutable after create */
export interface DataAccessUpdate {
  group_id?: number | null;
  inode_count?: number | null;
  byte_size?: number | null;
}

// Audit log

export interface AuditLogEntry {
  id: number;
  occurred_at: string;
  actor_id: number | null;
  actor: User | null;
  action: AuditActionEnum;
  group_id: number | null;
  member_user_id: number | null;
  member_user: User | null;
  member_group_id: number | null;
  member_group: Group | null;
  caused_by: number | null;
  details: Record<string, unknown> | null;
}

// Projects

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
  /** Effective members of this group are the project's PIs; staff only */
  pi_group_id: number | null;
  /** Effective members of this group are the project's members */
  project_group_id: number | null;
  /** Set by "deleting" a project; acting on expiry happens outside the application */
  expires_at: string | null;
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
}

export interface PiProjectView {
  user_id: number;
  name: string | null;
  project_id: number;
  project_name: string;
  project_display_name: string | null;
  email1: string | null;
  phone1: string | null;
  netid: string | null;
}

export interface ProjectCreateUpdate {
  name: string;
  display_name?: string | null;
  description?: string | null;
  /** Staff only. On create, leave both group ids out to have the pi/managers/project groups generated */
  pi_group_id?: number | null;
  project_group_id?: number | null;
  expires_at?: string | null;
  /** Create only: users seeded into the pi group */
  pi_ids?: number[];
  staff1?: number | null;
  staff2?: number | null;
  status?: string | null;
  access?: string | null;
  accounting_group?: string;
  url?: string | null;
  date?: string | null;
  ticket?: number | null;
  last_contact?: string | null;
  college_and_department_id?: number | null;
  fos_id?: string | null;
}

export interface ProjectPiCreate {
  user_id: number;
}

// Users

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
  /** Need not be a project the user is currently a member of */
  primary_project_id: number | null;
  created_at: string;
  updated_at: string;
  submit_nodes?: UserSubmitGet[];
  notes?: Note[];
  projects?: JoinedProjectView[];
  groups?: UserGroupsView[];
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
  /** When given, the user is also added to that project's group */
  primary_project_id?: number | null;
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
  /** Staff only; null clears it */
  primary_project_id?: number | null;
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

/** One row per (user, project) where the user is an effective member of the project group */
export interface JoinedProjectView {
  id: number;
  project_id: number;
  project_name: string;
  project_display_name: string | null;
  project_staff1: User | null;
  project_staff2: User | null;
  project_status: string | null;
  project_accounting_group: string;
  project_last_contact: string | null;
  project_pi_group_id: number | null;
  project_project_group_id: number | null;
  project_expires_at: string | null;
  /** users.primary_project_id points at this project */
  is_primary: boolean;
  /** Effective member of the project's pi group */
  is_pi: boolean;
  name: string | null;
  username: string | null;
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
  last_note_ticket: string | null;
  /** From the direct membership row on the project group; null when access comes only through another group */
  managed_by: EntityManagerEnum | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Body of POST /projects/{id}/users */
export interface UserProjectCreate {
  user_id: number;
  managed_by?: EntityManagerEnum;
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
