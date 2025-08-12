
'use client';

import React from 'react';
import { ExpensesModule } from '@/components/modules/expenses/ExpensesModule';

export default function ExpensesPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Control de Gastos</h1>
        <p className="text-gray-600 mt-2">
          Gestiona y controla todos los gastos y egresos de la clínica
        </p>
      </div>
      
      <ExpensesModule />
    </div>
  );
}
