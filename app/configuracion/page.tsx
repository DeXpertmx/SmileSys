
import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";

export default async function ConfiguracionPage() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold dental-text-primary">Configuración</h1>
          <p className="text-gray-600">Configuración del sistema y preferencias</p>
        </div>
        
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Módulo en Desarrollo
          </h2>
          <p className="text-gray-600">
            La configuración estará disponible próximamente
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
