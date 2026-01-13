import { useState } from "react";

/**
 * Generic hook for managing form state
 * Provides values, setValues, and handleChange functionality
 */
export function useFormState<T>(initialValues: T | (() => T)): {
  values: T;
  setValues: React.Dispatch<React.SetStateAction<T>>;
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
  resetForm: (newValues?: T) => void;
} {
  const [values, setValues] = useState<T>(initialValues);

  const handleChange = <K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = (newValues?: T) => {
    if (newValues) {
      setValues(newValues);
    } else {
      setValues(typeof initialValues === "function" ? (initialValues as () => T)() : initialValues);
    }
  };

  return { values, setValues, handleChange, resetForm };
}
