import { EntityManagerEnum } from "@/types";
import { MenuItem, TextField } from "@mui/material";

const MANAGED_BY_OPTIONS: { value: EntityManagerEnum; label: string }[] = [
  { value: "APPLICATION", label: "Application" },
  { value: "MANIFEST", label: "Manifest" },
  { value: "MORGRIDGE_ACTIVE_DIRECTORY", label: "Morgridge Active Directory" },
];

interface ManagedBySelectProps {
  value: EntityManagerEnum;
  onChange: (value: EntityManagerEnum) => void;
  disabled?: boolean;
  label?: string;
  helperText?: string;
}

/** Controlled picker for who manages an entity; the caller decides when to save */
const ManagedBySelect = ({ value, onChange, disabled, label = "Managed by", helperText }: ManagedBySelectProps) => (
  <TextField
    select
    label={label}
    value={value}
    onChange={(e) => onChange(e.target.value as EntityManagerEnum)}
    disabled={disabled}
    helperText={helperText}
    fullWidth
  >
    {MANAGED_BY_OPTIONS.map((opt) => (
      <MenuItem key={opt.value} value={opt.value}>
        {opt.label}
      </MenuItem>
    ))}
  </TextField>
);

export default ManagedBySelect;
