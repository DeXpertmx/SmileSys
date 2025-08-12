
import { Suspense } from 'react';
import { InsuranceModule } from '@/components/insurance/insurance-module';

export default function AseguradorasPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aseguradoras</h1>
          <p className="text-gray-600 mt-1">
            Gestión completa de compañías de seguros y pólizas de pacientes
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Cargando...</div>}>
        <InsuranceModule />
      </Suspense>
    </div>
  );
}
