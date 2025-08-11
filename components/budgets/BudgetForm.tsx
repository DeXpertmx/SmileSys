

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Save, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  numeroExpediente: string;
}

interface BudgetItem {
  id?: string;
  type: string;
  name: string;
  description?: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  priority: string;
  estimated: boolean;
  notes?: string;
}

interface BudgetFormProps {
  budget?: any;
  onSave: () => void;
  onCancel: () => void;
}

export function BudgetForm({ budget, onSave, onCancel }: BudgetFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    patientId: "",
    validUntil: null as Date | null,
    notes: "",
    termsConditions: "",
    tax: 0,
  });

  const [items, setItems] = useState<BudgetItem[]>([]);

  useEffect(() => {
    fetchPatients();
    
    if (budget) {
      // Cargar datos del presupuesto existente
      setFormData({
        title: budget.title || "",
        description: budget.description || "",
        patientId: budget.patientId || "",
        validUntil: budget.validUntil ? new Date(budget.validUntil) : null,
        notes: budget.notes || "",
        termsConditions: budget.termsConditions || "",
        tax: budget.tax || 0,
      });
      
      if (budget.items) {
        setItems(budget.items);
      }
    }
  }, [budget]);

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const response = await fetch('/api/patients?limit=100');
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const addItem = () => {
    const newItem: BudgetItem = {
      type: "tratamiento",
      name: "",
      description: "",
      category: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      total: 0,
      priority: "Normal",
      estimated: false,
      notes: "",
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalcular total del item
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      const item = newItems[index];
      const subtotal = item.quantity * item.unitPrice;
      const discountAmount = (subtotal * item.discount) / 100;
      newItems[index].total = subtotal - discountAmount;
    }
    
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateDiscount = () => {
    return items.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      return sum + ((subtotal * item.discount) / 100);
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return (subtotal * formData.tax) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId) {
      toast.error('Selecciona un paciente');
      return;
    }
    
    if (!formData.title.trim()) {
      toast.error('Ingresa un título para el presupuesto');
      return;
    }
    
    if (items.length === 0) {
      toast.error('Agrega al menos un elemento al presupuesto');
      return;
    }

    setLoading(true);
    
    try {
      const budgetData = {
        ...formData,
        doctorId: session?.user?.id,
        subtotal: calculateSubtotal(),
        discount: calculateDiscount(),
        total: calculateTotal(),
        items,
        status: budget?.status || 'Borrador',
      };

      const url = budget ? `/api/budgets/${budget.id}` : '/api/budgets';
      const method = budget ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetData),
      });

      if (response.ok) {
        onSave();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al guardar el presupuesto');
      }
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Presupuesto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Plan de tratamiento ortodóncico"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="patient">Paciente *</Label>
              <Select
                value={formData.patientId}
                onValueChange={(value) => setFormData({ ...formData, patientId: value })}
                disabled={loadingPatients}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} ({patient.numeroExpediente})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción general del presupuesto"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Válido hasta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.validUntil ? (
                      format(formData.validUntil, "PPP", { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.validUntil}
                    onSelect={(date) => setFormData({ ...formData, validUntil: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="tax">IVA (%)</Label>
              <Input
                id="tax"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Elementos del Presupuesto</CardTitle>
            <Button
              type="button"
              onClick={addItem}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar elemento
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">Elemento {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={item.type}
                    onValueChange={(value) => updateItem(index, 'type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tratamiento">Tratamiento</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="servicio">Servicio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    placeholder="Nombre del elemento"
                    required
                  />
                </div>

                <div>
                  <Label>Categoría</Label>
                  <Input
                    value={item.category || ""}
                    onChange={(e) => updateItem(index, 'category', e.target.value)}
                    placeholder="Ej: Endodoncia, Preventivo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                </div>

                <div>
                  <Label>Precio unitario (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label>Descuento (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={item.discount}
                    onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label>Total</Label>
                  <Input
                    value={`€${item.total.toFixed(2)}`}
                    readOnly
                    className="font-medium bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={item.description || ""}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="Descripción detallada del elemento"
                  rows={2}
                />
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay elementos en el presupuesto. Haz clic en "Agregar elemento" para comenzar.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen Financiero</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>€{calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Descuento:</span>
              <span>-€{calculateDiscount().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA ({formData.tax}%):</span>
              <span>€{calculateTax().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>€{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas internas del presupuesto"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="terms">Términos y condiciones</Label>
            <Textarea
              id="terms"
              value={formData.termsConditions}
              onChange={(e) => setFormData({ ...formData, termsConditions: e.target.value })}
              placeholder="Términos y condiciones del presupuesto"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        
        <Button
          type="submit"
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Guardando...' : 'Guardar presupuesto'}
        </Button>
      </div>
    </form>
  );
}

