
'use client';

import { SessionProvider } from 'next-auth/react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { BudgetsModule } from '@/components/budgets/BudgetsModule';

export default function PresupuestosPage() {
  return (
    <SessionProvider>
      <DashboardLayout>
        <BudgetsModule />
      </DashboardLayout>
    </SessionProvider>
  );
}
