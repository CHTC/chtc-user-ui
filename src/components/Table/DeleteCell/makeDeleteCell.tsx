import ActionButton from "@/src/components/ActionButton/ActionButton";
import type { CellComponentProps, TableData } from "@chtc/web-components";
import { Delete } from "@mui/icons-material";
import { TableCell } from "@mui/material";

interface MakeDeleteCellProps<R extends TableData> {
  mutate: () => void;
  deleteUrl: (row: R) => string;
  ariaLabel: string;
}

/** A trash can that asks for confirmation, sends a DELETE to the row's URL, and refreshes the table */
function makeDeleteCell<R extends TableData>({ mutate, deleteUrl, ariaLabel }: MakeDeleteCellProps<R>) {
  const DeleteCell = ({ row }: CellComponentProps<R, keyof R>) => {
    const url = deleteUrl(row);
    return (
      <TableCell>
        {/* Table keys rows by index, so without a per-row key the next row would inherit an open Confirm after a delete */}
        <ActionButton
          key={url}
          url={url}
          method="DELETE"
          icon={<Delete />}
          color="error"
          ariaLabel={ariaLabel}
          onSuccess={mutate}
        />
      </TableCell>
    );
  };

  DeleteCell.displayName = "DeleteCell";

  return DeleteCell;
}

export default makeDeleteCell;
