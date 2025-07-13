
"use client";

import { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { UserProvider } from '@/context/user-context';

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <UserProvider>
        {children}
      </UserProvider>
    </I18nextProvider>
  );
}
