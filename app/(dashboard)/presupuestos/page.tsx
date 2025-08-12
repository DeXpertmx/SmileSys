
'use client';

import { SessionProvider } from 'next-auth/react';

import { BudgetsModule } from '@/components/budgets/BudgetsModule';

export default function PresupuestosPage() {
  return (
    <SessionProvider>
      
        <BudgetsModule />
      
    </SessionProvider>
  );
}
