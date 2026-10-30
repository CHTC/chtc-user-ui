import { TableCell } from '@mui/material';
import { ReactNode } from 'react';
import { CellComponentProps, TableData } from '@/src/components/Table/types';

const DefaultCell = <R extends TableData>({
  value,
}: CellComponentProps<R, keyof R>) => {
  return <TableCell>{value as ReactNode}</TableCell>;
};

export default DefaultCell;
