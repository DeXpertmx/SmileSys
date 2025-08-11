
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrescriptionTemplateSelector, PrescriptionTemplate, MedicationItem } from '@/components/ui/prescription-template';
import { Plus, Pill, FileText, Printer, Edit, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface PrescriptionManagerProps {
  patientId: string;
  patientName: string;
  treatmentId?: string;
}

interface Prescription {
  id: string;
  prescriptionNumber: string;
  doctorName: string;
  professionalLicense: string;
  specialization?: string;
  diagnosis: string;
  instructions: string;
  medications: MedicationItem[];
  template?: string;
  notes?: string;
  prescriptionDate: string;
  validUntil?: string;
  status: string;
  patient: {
    firstName: string;
    lastName: string;
  };
  treatment?: {
    name: string;
  };
}

interface NewPrescription {
  professionalLicense: string;
  specialization: string;
  diagnosis: string;
  instructions: string;
  medications: MedicationItem[];
  notes: string;
  validUntil: string;
  template?: string;
}

export function PrescriptionManager({ patientId, patientName, treatmentId }: PrescriptionManagerProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  const [newPrescription, setNewPrescription] = useState<NewPrescription>({
    professionalLicense: '',
    specialization: 'Odontología',
    diagnosis: '',
    instructions: '',
    medications: [],
    notes: '',
    validUntil: '',
    template: undefined
  });

  const [newMedication, setNewMedication] = useState<MedicationItem>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  useEffect(() => {
    loadPrescriptions();
    loadTemplates();
  }, [patientId]);

  const loadPrescriptions = async () => {
    try {
      const response = await fetch(`/api/prescriptions?patientId=${patientId}`);
      if (response.ok) {
        const data = await response.json();
        const formattedPrescriptions = data.map((p: any) => ({
          ...p,
          medications: JSON.parse(p.medications || '[]')
        }));
        setPrescriptions(formattedPrescriptions);
      }
    } catch (error) {
      console.error('Error cargando recetas:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/prescription-templates');
      if (response.ok) {
        const data = await response.json();
        const formattedTemplates = data.map((t: any) => ({
          ...t,
          medications: JSON.parse(t.medications || '[]')
        }));
        setTemplates(formattedTemplates);
      }
    } catch (error) {
      console.error('Error cargando plantillas:', error);
    }
  };

  const handleAddMedication = () => {
    if (newMedication.name && newMedication.dosage) {
      setNewPrescription(prev => ({
        ...prev,
        medications: [...prev.medications, { ...newMedication }]
      }));
      setNewMedication({
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
    }
  };

  const handleRemoveMedication = (index: number) => {
    setNewPrescription(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleSelectTemplate = (template: PrescriptionTemplate) => {
    setNewPrescription(prev => ({
      ...prev,
      medications: [...template.medications],
      instructions: template.instructions,
      template: template.name
    }));
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          treatmentId,
          professionalLicense: newPrescription.professionalLicense,
          specialization: newPrescription.specialization,
          diagnosis: newPrescription.diagnosis,
          instructions: newPrescription.instructions,
          medications: newPrescription.medications,
          notes: newPrescription.notes,
          validUntil: newPrescription.validUntil ? new Date(newPrescription.validUntil).toISOString() : null,
          template: newPrescription.template
        }),
      });

      if (response.ok) {
        await loadPrescriptions();
        setIsDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creando receta:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewPrescription({
      professionalLicense: '',
      specialization: 'Odontología',
      diagnosis: '',
      instructions: '',
      medications: [],
      notes: '',
      validUntil: '',
      template: undefined
    });
    setNewMedication({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activa':
        return 'bg-green-100 text-green-800';
      case 'Vencida':
        return 'bg-red-100 text-red-800';
      case 'Cancelada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Recetas Médicas</h3>
          <p className="text-gray-600 text-sm">
            Gestión de recetas médicas para {patientName}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Receta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Receta Médica</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreatePrescription} className="space-y-6">
              {/* Información del profesional */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cédula Profesional / Licencia *</Label>
                  <Input
                    value={newPrescription.professionalLicense}
                    onChange={(e) => setNewPrescription(prev => ({ ...prev, professionalLicense: e.target.value }))}
                    required
                    placeholder="Ej: 1234567"
                  />
                </div>
                <div>
                  <Label>Especialidad</Label>
                  <Input
                    value={newPrescription.specialization}
                    onChange={(e) => setNewPrescription(prev => ({ ...prev, specialization: e.target.value }))}
                    placeholder="Ej: Odontología General"
                  />
                </div>
              </div>

              {/* Plantillas */}
              <div>
                <PrescriptionTemplateSelector
                  templates={templates}
                  onSelectTemplate={handleSelectTemplate}
                  onCreateTemplate={async (template) => {
                    try {
                      const response = await fetch('/api/prescription-templates', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(template)
                      });
                      if (response.ok) {
                        await loadTemplates();
                      }
                    } catch (error) {
                      console.error('Error creando plantilla:', error);
                    }
                  }}
                  onEditTemplate={async (id, template) => {
                    try {
                      const response = await fetch(`/api/prescription-templates?id=${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(template)
                      });
                      if (response.ok) {
                        await loadTemplates();
                      }
                    } catch (error) {
                      console.error('Error editando plantilla:', error);
                    }
                  }}
                  onDeleteTemplate={async (id) => {
                    try {
                      const response = await fetch(`/api/prescription-templates?id=${id}`, {
                        method: 'DELETE'
                      });
                      if (response.ok) {
                        await loadTemplates();
                      }
                    } catch (error) {
                      console.error('Error eliminando plantilla:', error);
                    }
                  }}
                />
              </div>

              {/* Diagnóstico */}
              <div>
                <Label>Diagnóstico *</Label>
                <Textarea
                  value={newPrescription.diagnosis}
                  onChange={(e) => setNewPrescription(prev => ({ ...prev, diagnosis: e.target.value }))}
                  required
                  rows={2}
                />
              </div>

              {/* Medicamentos */}
              <div>
                <Label className="text-base font-semibold">Medicamentos Recetados</Label>
                
                {/* Lista de medicamentos */}
                <div className="space-y-2 mb-4">
                  {newPrescription.medications.map((med, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{med.name}</p>
                          <p className="text-sm text-gray-600">
                            {med.dosage} • {med.frequency} • {med.duration}
                          </p>
                          {med.instructions && (
                            <p className="text-xs text-gray-500 mt-1">{med.instructions}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMedication(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Agregar medicamento */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-medium mb-3">Agregar Medicamento</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Input
                      placeholder="Nombre del medicamento"
                      value={newMedication.name}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Dosis (ej: 500mg)"
                      value={newMedication.dosage}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Input
                      placeholder="Frecuencia (ej: Cada 8 horas)"
                      value={newMedication.frequency}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                    />
                    <Input
                      placeholder="Duración (ej: 7 días)"
                      value={newMedication.duration}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, duration: e.target.value }))}
                    />
                  </div>
                  <Input
                    placeholder="Instrucciones especiales"
                    value={newMedication.instructions}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, instructions: e.target.value }))}
                    className="mb-3"
                  />
                  <Button
                    type="button"
                    onClick={handleAddMedication}
                    disabled={!newMedication.name || !newMedication.dosage}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Medicamento
                  </Button>
                </div>
              </div>

              {/* Instrucciones */}
              <div>
                <Label>Instrucciones Generales *</Label>
                <Textarea
                  value={newPrescription.instructions}
                  onChange={(e) => setNewPrescription(prev => ({ ...prev, instructions: e.target.value }))}
                  required
                  rows={3}
                  placeholder="Instrucciones post-operatorias, cuidados, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de Vigencia</Label>
                  <Input
                    type="date"
                    value={newPrescription.validUntil}
                    onChange={(e) => setNewPrescription(prev => ({ ...prev, validUntil: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Notas Adicionales</Label>
                  <Textarea
                    value={newPrescription.notes}
                    onChange={(e) => setNewPrescription(prev => ({ ...prev, notes: e.target.value }))}
                    rows={1}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !newPrescription.professionalLicense || !newPrescription.diagnosis || newPrescription.medications.length === 0}
                >
                  {loading ? 'Creando...' : 'Crear Receta'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de recetas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5" />
            Recetas Emitidas ({prescriptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Pill className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay recetas emitidas</p>
              <p className="text-sm">Crea recetas médicas con medicamentos y plantillas prediseñadas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          Receta #{prescription.prescriptionNumber.slice(-8)}
                        </h4>
                        <Badge className={getStatusColor(prescription.status)}>
                          {prescription.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {prescription.doctorName} - Cédula: {prescription.professionalLicense}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(prescription.prescriptionDate)}
                        {prescription.validUntil && ` • Válida hasta: ${formatDate(prescription.validUntil)}`}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Diagnóstico:</p>
                    <p className="text-sm text-gray-600">{prescription.diagnosis}</p>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Medicamentos ({prescription.medications.length})
                    </p>
                    <div className="space-y-1">
                      {prescription.medications.map((med, index) => (
                        <div key={index} className="text-sm bg-blue-50 p-2 rounded">
                          <p className="font-medium">{med.name} - {med.dosage}</p>
                          <p className="text-gray-600">{med.frequency} • {med.duration}</p>
                          {med.instructions && (
                            <p className="text-xs text-gray-500">{med.instructions}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Instrucciones:</p>
                    <p className="text-sm text-gray-600">{prescription.instructions}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Printer className="w-4 h-4 mr-1" />
                      Imprimir
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
