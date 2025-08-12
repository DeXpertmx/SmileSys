
'use client';

import { SessionProvider } from 'next-auth/react';

import { CrmModule } from '@/components/crm/CrmModule';

export default function CrmPage() {
  return (
    <SessionProvider>
      
        <CrmModule />
      
    </SessionProvider>
  );
}
