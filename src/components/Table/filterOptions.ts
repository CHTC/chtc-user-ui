import type { RoleEnum } from "@/types";

// Choices for options filters on columns that have no shared option list elsewhere

export const ROLE_OPTIONS: { value: RoleEnum; label: string }[] = [
  { value: "MEMBER", label: "Member" },
  { value: "PI", label: "PI" },
];

// Project status is free text in the database; the project form only offers these two
export const PROJECT_STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];
