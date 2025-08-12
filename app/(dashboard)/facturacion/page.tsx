
import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";

export default async function FacturacionPage() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold dental-text-primary">Facturación</h1>
          <p className="text-gray-600">Gestiona facturas, pagos y reportes financieros</p>
        </div>
        
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Módulo en Desarrollo
          </h2>
          <p className="text-gray-600">
            La facturación estará disponible próximamente
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
