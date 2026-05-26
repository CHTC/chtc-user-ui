'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';

export type AlertMessageKey = keyof typeof AlertMessages;
export type AlertSeverity = 'success' | 'error' | 'warning' | 'info';
export type AlertPreset = { message: string; severity: AlertSeverity }

export const AlertMessages = {
  TEST: { message: 'Hello, World!', severity: 'success' }
} as const satisfies Record<string, AlertPreset>

interface AlertState {
  open: boolean;
  message: string;
  severity: AlertSeverity;
}

type AlertAction =
  | { type: 'SHOW'; message: string; severity: AlertSeverity }
  | { type: 'HIDE' };

const initialState: AlertState = {
  open: false,
  message: '',
  severity: 'info',
};

function alertReducer(state: AlertState, action: AlertAction): AlertState {
  switch (action.type) {
    case 'SHOW':
      return { open: true, message: action.message, severity: action.severity };
    case 'HIDE':
      return { ...state, open: false };
    default:
      return state;
  }
}

interface AlertContextValue {
  showAlert: (key: AlertMessageKey) => void;
  hide: () => void;
  state: AlertState;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(alertReducer, initialState);

  const showAlert = (key: AlertMessageKey) => {
    const { message, severity } = AlertMessages[key];
    dispatch({ type: 'SHOW', message, severity });
  };

  const hide = () => dispatch({ type: 'HIDE' });

  return (
    <AlertContext.Provider value={{ showAlert, hide, state }}>
      {children}
    </AlertContext.Provider>
  );
}

// --- Hook ---
export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within a AlertProvider');
  return ctx;
}