

import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PacientesModule } from "@/components/modules/pacientes/pacientes-module";

export default async function PacientesPage() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <DashboardLayout>
      <PacientesModule />
    </DashboardLayout>
  );
}

