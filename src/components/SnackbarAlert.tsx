'use client';

import { Alert, Snackbar } from '@mui/material';
import { useAlert } from './AlertProvider';

export function SnackbarAlert() {
  const { state, hide } = useAlert();

  return (
    <Snackbar
      open={state.open}
      autoHideDuration={3000}
      onClose={hide}
    >
      <Alert
        onClose={hide}
        severity={state.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {state.message}
      </Alert>
    </Snackbar>
  );
}