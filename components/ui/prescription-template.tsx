
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Badge } from './badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';

export interface PrescriptionTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  medications: MedicationItem[];
  instructions: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionTemplateProps {
  templates: PrescriptionTemplate[];
  onSelectTemplate: (template: PrescriptionTemplate) => void;
  onCreateTemplate?: (template: Partial<PrescriptionTemplate>) => void;
  onEditTemplate?: (id: string, template: Partial<PrescriptionTemplate>) => void;
  onDeleteTemplate?: (id: string) => void;
}

export function PrescriptionTemplateSelector({
  templates,
  onSelectTemplate,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate
}: PrescriptionTemplateProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PrescriptionTemplate | null>(null);
  
  const [newTemplate, setNewTemplate] = useState<Partial<PrescriptionTemplate>>({
    name: '',
    category: 'Odontología',
    description: '',
    medications: [],
    instructions: '',
    isActive: true,
    isDefault: false
  });

  const [newMedication, setNewMedication] = useState<MedicationItem>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  const handleAddMedication = () => {
    if (newMedication.name && newMedication.dosage) {
      const currentMeds = editingTemplate 
        ? JSON.parse(JSON.stringify(editingTemplate.medications))
        : [...(newTemplate.medications || [])];
      
      currentMeds.push({ ...newMedication });
      
      if (editingTemplate) {
        setEditingTemplate({
          ...editingTemplate,
          medications: currentMeds
        });
      } else {
        setNewTemplate(prev => ({
          ...prev,
          medications: currentMeds
        }));
      }
      
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
    if (editingTemplate) {
      const currentMeds = [...editingTemplate.medications];
      currentMeds.splice(index, 1);
      setEditingTemplate({
        ...editingTemplate,
        medications: currentMeds
      });
    } else {
      const currentMeds = [...(newTemplate.medications || [])];
      currentMeds.splice(index, 1);
      setNewTemplate(prev => ({
        ...prev,
        medications: currentMeds
      }));
    }
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      onEditTemplate?.(editingTemplate.id, editingTemplate);
      setEditingTemplate(null);
    } else {
      onCreateTemplate?.(newTemplate);
      setNewTemplate({
        name: '',
        category: 'Odontología',
        description: '',
        medications: [],
        instructions: '',
        isActive: true,
        isDefault: false
      });
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Plantillas de Recetas</h3>
        {onCreateTemplate && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingTemplate(null);
                  setNewTemplate({
                    name: '',
                    category: 'Odontología',
                    description: '',
                    medications: [],
                    instructions: '',
                    isActive: true,
                    isDefault: false
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Plantilla
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre de la Plantilla *</Label>
                    <Input
                      value={editingTemplate?.name || newTemplate.name || ''}
                      onChange={(e) => {
                        if (editingTemplate) {
                          setEditingTemplate({ ...editingTemplate, name: e.target.value });
                        } else {
                          setNewTemplate(prev => ({ ...prev, name: e.target.value }));
                        }
                      }}
                      placeholder="Ej: Extracción Simple"
                    />
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <Input
                      value={editingTemplate?.category || newTemplate.category || ''}
                      onChange={(e) => {
                        if (editingTemplate) {
                          setEditingTemplate({ ...editingTemplate, category: e.target.value });
                        } else {
                          setNewTemplate(prev => ({ ...prev, category: e.target.value }));
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={editingTemplate?.description || newTemplate.description || ''}
                    onChange={(e) => {
                      if (editingTemplate) {
                        setEditingTemplate({ ...editingTemplate, description: e.target.value });
                      } else {
                        setNewTemplate(prev => ({ ...prev, description: e.target.value }));
                      }
                    }}
                    rows={2}
                  />
                </div>

                {/* Medicamentos */}
                <div>
                  <Label className="text-base font-semibold">Medicamentos</Label>
                  
                  {/* Lista de medicamentos */}
                  <div className="space-y-2 mb-4">
                    {(editingTemplate?.medications || newTemplate.medications || []).map((med, index) => (
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

                <div>
                  <Label>Instrucciones Generales</Label>
                  <Textarea
                    value={editingTemplate?.instructions || newTemplate.instructions || ''}
                    onChange={(e) => {
                      if (editingTemplate) {
                        setEditingTemplate({ ...editingTemplate, instructions: e.target.value });
                      } else {
                        setNewTemplate(prev => ({ ...prev, instructions: e.target.value }));
                      }
                    }}
                    rows={3}
                    placeholder="Instrucciones post-operatorias, cuidados, etc."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingTemplate(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveTemplate}
                    disabled={!((editingTemplate?.name || newTemplate.name) && (editingTemplate?.medications?.length || newTemplate.medications?.length))}
                  >
                    {editingTemplate ? 'Actualizar' : 'Crear'} Plantilla
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Lista de plantillas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <div className="flex items-center gap-1">
                  {template.isDefault && (
                    <Badge variant="default" className="text-xs">
                      Por defecto
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {template.description}
              </p>
              
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Medicamentos ({template.medications.length})
                </p>
                <div className="space-y-1">
                  {template.medications.slice(0, 2).map((med, index) => (
                    <p key={index} className="text-xs text-gray-600">
                      • {med.name} - {med.dosage}
                    </p>
                  ))}
                  {template.medications.length > 2 && (
                    <p className="text-xs text-gray-500">
                      +{template.medications.length - 2} más...
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button
                  size="sm"
                  onClick={() => onSelectTemplate(template)}
                  className="flex-1 mr-2"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Usar
                </Button>
                
                {onEditTemplate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTemplate(template);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                
                {onDeleteTemplate && !template.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
                        onDeleteTemplate(template.id);
                      }
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
