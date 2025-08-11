

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Edit, 
  Check, 
  X, 
  ArrowLeft, 
  User, 
  Calendar,
  FileText,
  Calculator,
  Send,
  Download 
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BudgetDetailProps {
  budget: any;
  onEdit: () => void;
  onStatusUpdate: (budgetId: string, status: string) => void;
  onBack: () => void;
}

const statusColors = {
  'Borrador': 'bg-gray-100 text-gray-800',
  'Enviado': 'bg-blue-100 text-blue-800',
  'Aprobado': 'bg-green-100 text-green-800',
  'Rechazado': 'bg-red-100 text-red-800',
  'Vencido': 'bg-orange-100 text-orange-800',
};

export function BudgetDetail({ budget, onEdit, onStatusUpdate, onBack }: BudgetDetailProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true);
    try {
      await onStatusUpdate(budget.id, newStatus);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBudget = () => {
    handleStatusUpdate('Enviado');
  };

  const canEdit = ['Borrador', 'Rechazado'].includes(budget.status);
  const canApprove = budget.status === 'Enviado';
  const canSend = budget.status === 'Borrador';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Button
            variant="outline"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{budget.budgetNumber}</h1>
            <Badge className={statusColors[budget.status]}>
              {budget.status}
            </Badge>
          </div>
          <h2 className="text-xl text-gray-700 mb-1">{budget.title}</h2>
        </div>
        
        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="outline"
              onClick={onEdit}
              disabled={loading}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          
          {canSend && (
            <Button
              onClick={handleSendBudget}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar al paciente
            </Button>
          )}
          
          {canApprove && (
            <>
              <Button
                onClick={() => handleStatusUpdate('Aprobado')}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Aprobar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate('Rechazado')}
                disabled={loading}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Rechazar
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            onClick={() => window.print()}
          >
            <Download className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Información del paciente y doctor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Paciente</h4>
              <p className="text-sm text-gray-600">
                {budget.patient.firstName} {budget.patient.lastName}<br />
                Expediente: {budget.patient.numeroExpediente}<br />
                {budget.patient.email && `Email: ${budget.patient.email}`}<br />
                {budget.patient.phone && `Teléfono: ${budget.patient.phone}`}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Doctor</h4>
              <p className="text-sm text-gray-600">
                {budget.doctor.firstName} {budget.doctor.lastName}<br />
                {budget.doctor.specialization && `Especialización: ${budget.doctor.specialization}`}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Fecha de creación:</span><br />
              <span className="font-medium">
                {format(new Date(budget.createdAt), "PPP 'a las' p", { locale: es })}
              </span>
            </div>
            
            {budget.validUntil && (
              <div>
                <span className="text-gray-500">Válido hasta:</span><br />
                <span className="font-medium">
                  {format(new Date(budget.validUntil), "PPP", { locale: es })}
                </span>
              </div>
            )}
            
            <div>
              <span className="text-gray-500">Última actualización:</span><br />
              <span className="font-medium">
                {format(new Date(budget.updatedAt), "PPP 'a las' p", { locale: es })}
              </span>
            </div>
          </div>

          {budget.description && (
            <>
              <Separator className="my-4" />
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Descripción</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {budget.description}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Elementos del presupuesto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Elementos del Presupuesto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budget.items?.map((item: any, index: number) => (
              <div key={item.id || index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600">
                      {item.type} {item.category && `• ${item.category}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {item.priority}
                  </Badge>
                </div>
                
                {item.description && (
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                )}
                
                <div className="flex justify-between items-end">
                  <div className="text-sm text-gray-500">
                    Cantidad: {item.quantity} • 
                    Precio unitario: €{item.unitPrice?.toFixed(2)}
                    {item.discount > 0 && ` • Descuento: ${item.discount}%`}
                    {item.estimated && " • Estimado"}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-teal-600">
                      €{item.total?.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                {item.notes && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-gray-500">Notas: {item.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumen financiero */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Resumen Financiero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span>€{budget.subtotal?.toFixed(2)}</span>
            </div>
            
            {budget.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Descuento:</span>
                <span className="text-red-600">-€{budget.discount.toFixed(2)}</span>
              </div>
            )}
            
            {budget.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IVA:</span>
                <span>€{budget.tax.toFixed(2)}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-teal-600">€{budget.total?.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notas y términos */}
      {(budget.notes || budget.termsConditions) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budget.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {budget.notes}
                </p>
              </CardContent>
            </Card>
          )}
          
          {budget.termsConditions && (
            <Card>
              <CardHeader>
                <CardTitle>Términos y Condiciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {budget.termsConditions}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

