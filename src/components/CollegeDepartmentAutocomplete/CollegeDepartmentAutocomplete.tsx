import { GenericAutocomplete } from "@/src/components/GenericAutocomplete/GenericAutocomplete";
import type { CollegeAndDepartment } from "@/types";

interface CollegeDepartmentAutocompleteProps {
  value?: Partial<CollegeAndDepartment>;
  onSelect: (collegeAndDepartment: CollegeAndDepartment | null) => void;
  defaultFilter?: Record<string, string>;
  required?: boolean;
  disabled?: boolean;
}

const CollegeDepartmentAutocomplete = ({
  value,
  onSelect,
  defaultFilter,
  required,
  disabled,
}: CollegeDepartmentAutocompleteProps) => {
  return (
    <GenericAutocomplete<CollegeAndDepartment>
      endpoint="/college_and_departments"
      label="College / Department"
      value={value}
      onSelect={onSelect}
      defaultFilter={defaultFilter}
      getOptionLabel={(option) => [option.college, option.department].filter(Boolean).join(", ")}
      searchFields={["college", "department"]}
      required={required}
      disabled={disabled}
    />
  );
};

export default CollegeDepartmentAutocomplete;
