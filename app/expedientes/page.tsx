

import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ExpedientesModule } from "@/components/modules/expedientes/expedientes-module";

export default async function ExpedientesPage() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <DashboardLayout>
      <ExpedientesModule />
    </DashboardLayout>
  );
}

