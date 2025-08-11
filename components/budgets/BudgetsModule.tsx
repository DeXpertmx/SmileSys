

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Edit, FileText, Check, X, Calculator, User } from "lucide-react";
import { toast } from "react-hot-toast";
import { BudgetForm } from "./BudgetForm";
import { BudgetDetail } from "./BudgetDetail";

interface Budget {
  id: string;
  budgetNumber: string;
  title: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    numeroExpediente: string;
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  'Borrador': 'bg-gray-100 text-gray-800',
  'Enviado': 'bg-blue-100 text-blue-800',
  'Aprobado': 'bg-green-100 text-green-800',
  'Rechazado': 'bg-red-100 text-red-800',
  'Vencido': 'bg-orange-100 text-orange-800',
};

const statusIcons = {
  'Borrador': Edit,
  'Enviado': FileText,
  'Aprobado': Check,
  'Rechazado': X,
  'Vencido': FileText,
};

export function BudgetsModule() {
  const { data: session } = useSession();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("list");

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const response = await fetch('/api/budgets');
      if (response.ok) {
        const data = await response.json();
        setBudgets(data);
      } else {
        toast.error('Error al cargar los presupuestos');
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = () => {
    setSelectedBudget(null);
    setShowForm(true);
    setActiveTab("form");
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setShowForm(true);
    setActiveTab("form");
  };

  const handleViewBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setActiveTab("detail");
  };

  const handleBudgetSaved = () => {
    fetchBudgets();
    setShowForm(false);
    setActiveTab("list");
    toast.success('Presupuesto guardado correctamente');
  };

  const handleUpdateStatus = async (budgetId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/budgets/${budgetId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchBudgets();
        toast.success('Estado actualizado correctamente');
      } else {
        toast.error('Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error de conexión');
    }
  };

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = 
      budget.budgetNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${budget.patient.firstName} ${budget.patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || budget.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Lista de Presupuestos</TabsTrigger>
          <TabsTrigger value="form">{selectedBudget ? "Editar" : "Nuevo"} Presupuesto</TabsTrigger>
          <TabsTrigger value="detail" disabled={!selectedBudget}>Detalles</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Barra de búsqueda y filtros */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por número, paciente o título..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="Borrador">Borrador</SelectItem>
                    <SelectItem value="Enviado">Enviado</SelectItem>
                    <SelectItem value="Aprobado">Aprobado</SelectItem>
                    <SelectItem value="Rechazado">Rechazado</SelectItem>
                    <SelectItem value="Vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={handleCreateBudget}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Presupuesto
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de presupuestos */}
          <div className="grid gap-4">
            {filteredBudgets.map((budget) => {
              const StatusIcon = statusIcons[budget.status];
              return (
                <Card key={budget.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {budget.budgetNumber}
                          </h3>
                          <Badge className={statusColors[budget.status]}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {budget.status}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-900 font-medium mb-1">{budget.title}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {budget.patient.firstName} {budget.patient.lastName}
                          </span>
                          <span>Expediente: {budget.patient.numeroExpediente}</span>
                          <span>Doctor: {budget.doctor.firstName} {budget.doctor.lastName}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            Creado: {new Date(budget.createdAt).toLocaleDateString('es-ES')}
                            {budget.validUntil && (
                              <span className="ml-3">
                                Válido hasta: {new Date(budget.validUntil).toLocaleDateString('es-ES')}
                              </span>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-teal-600">
                              €{budget.total.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewBudget(budget)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditBudget(budget)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {budget.status === 'Enviado' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleUpdateStatus(budget.id, 'Aprobado')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => handleUpdateStatus(budget.id, 'Rechazado')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredBudgets.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontraron presupuestos
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== "all" 
                      ? "No hay presupuestos que coincidan con los filtros aplicados"
                      : "Aún no has creado ningún presupuesto"
                    }
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <Button 
                      onClick={handleCreateBudget}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Crear primer presupuesto
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="form">
          <BudgetForm 
            budget={selectedBudget}
            onSave={handleBudgetSaved}
            onCancel={() => {
              setShowForm(false);
              setActiveTab("list");
            }}
          />
        </TabsContent>

        <TabsContent value="detail">
          {selectedBudget && (
            <BudgetDetail 
              budget={selectedBudget}
              onEdit={() => {
                setActiveTab("form");
                setShowForm(true);
              }}
              onStatusUpdate={handleUpdateStatus}
              onBack={() => setActiveTab("list")}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

