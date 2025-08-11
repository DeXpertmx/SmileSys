
'use client';

import { SessionProvider } from 'next-auth/react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { CrmModule } from '@/components/crm/CrmModule';

export default function CrmPage() {
  return (
    <SessionProvider>
      <DashboardLayout>
        <CrmModule />
      </DashboardLayout>
    </SessionProvider>
  );
}
