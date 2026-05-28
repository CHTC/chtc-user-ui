import { apiFetch } from "@/src/components/AuthProvider";
import { EntityManagerEnum } from "@/types";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { CircularProgress, FormControl, FormHelperText, InputAdornment, MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { green, red } from "@mui/material/colors";
import { useEffect, useRef, useState } from "react";

const MANAGED_BY_OPTIONS: { value: EntityManagerEnum; label: string }[] = [
  { value: "APPLICATION", label: "Application" },
  { value: "MANIFEST", label: "Manifest" },
  { value: "MORGRIDGE_ACTIVE_DIRECTORY", label: "Morgridge Active Directory" },
];

interface ManagedBySelectProps {
  value: EntityManagerEnum;
  patchUrl: string;
  onSuccess?: () => void;
}

const ManagedBySelect = ({ value, patchUrl, onSuccess }: ManagedBySelectProps) => {
  const [current, setCurrent] = useState<EntityManagerEnum>(value);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(false), 1000);
    return () => clearTimeout(timer);
  }, [success]);

  const handleChange = async (e: SelectChangeEvent) => {
    if (loading || pendingRef.current) return;
    const newValue = e.target.value as EntityManagerEnum;
    const previous = current;
    setCurrent(newValue);
    setLoading(true);
    pendingRef.current = true;
    setSuccess(false);
    setError(false);
    setAnnouncement("");
    const minDelay = new Promise((resolve) => setTimeout(resolve, 500));
    try {
      await Promise.all([
        apiFetch(patchUrl, {
          method: "PATCH",
          body: JSON.stringify({ managed_by: newValue }),
        }),
        minDelay,
      ]);
      setSuccess(true);
      setAnnouncement("Management updated successfully.");
      onSuccess?.();
    } catch {
      await minDelay;
      setCurrent(previous);
      setError(true);
      setAnnouncement("Failed to update management. Please try again.");
    } finally {
      setLoading(false);
      pendingRef.current = false;
    }
  };

  const status: "success" | "error" | "idle" = success ? "success" : error ? "error" : "idle";

  return (
    <FormControl size="small" sx={{ minWidth: 180 }}>
      {/* Visually hidden aria-live region for screen readers */}
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {announcement}
      </span>

      <Select
        value={current}
        onChange={handleChange}
        aria-busy={loading}
        endAdornment={
          loading ? (
            <InputAdornment position="end" sx={{ mr: 1.5 }}>
              <CircularProgress size={16} thickness={5} />
            </InputAdornment>
          ) : status === "idle" ? undefined : (
            <InputAdornment position="end" sx={{ mr: 1.5 }}>
              {status === "success" ? (
                <CheckCircleIcon fontSize="small" sx={{ color: green[600] }} />
              ) : (
                <ErrorIcon fontSize="small" sx={{ color: red[600] }} />
              )}
            </InputAdornment>
          )
        }
        sx={{
          transition: "background-color 0.4s ease",
          ...(status === "success" && {
            backgroundColor: green[100],
            "& .MuiOutlinedInput-notchedOutline": { borderColor: green[600] },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: green[700] },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: green[700] },
          }),
          ...(status === "error" && {
            backgroundColor: red[50],
            "& .MuiOutlinedInput-notchedOutline": { borderColor: red[600] },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: red[700] },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: red[700] },
          }),
        }}
      >
        {MANAGED_BY_OPTIONS.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>

      {status === "error" && (
        <FormHelperText sx={{ color: red[700], mx: 0 }}>
          Failed to save. Please try again.
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default ManagedBySelect;

