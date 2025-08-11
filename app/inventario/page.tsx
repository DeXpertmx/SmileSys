
'use client';

import { SessionProvider } from 'next-auth/react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { InventoryModule } from '@/components/inventory/InventoryModule';

export default function InventarioPage() {
  return (
    <SessionProvider>
      <DashboardLayout>
        <InventoryModule />
      </DashboardLayout>
    </SessionProvider>
  );
}
