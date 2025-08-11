
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  UserPlus, 
  Phone, 
  Mail, 
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

// Tipos de datos para CRM
interface CrmPatient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'prospecto' | 'consultado' | 'presupuestado' | 'aprobado' | 'en_tratamiento' | 'completado' | 'perdido';
  source: string; // De dónde vino el paciente
  assignedTo?: string; // Usuario asignado
  priority: 'alta' | 'media' | 'baja';
  lastContact: string;
  nextFollowUp?: string;
  notes: string;
  budgetTotal?: number;
  budgetStatus?: string;
  treatmentProgress?: number;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  prospecto: { color: 'blue', label: 'Prospecto', progress: 0 },
  consultado: { color: 'yellow', label: 'Consultado', progress: 20 },
  presupuestado: { color: 'orange', label: 'Presupuestado', progress: 40 },
  aprobado: { color: 'green', label: 'Aprobado', progress: 60 },
  en_tratamiento: { color: 'purple', label: 'En Tratamiento', progress: 80 },
  completado: { color: 'emerald', label: 'Completado', progress: 100 },
  perdido: { color: 'red', label: 'Perdido', progress: 0 }
};

const priorityConfig = {
  alta: { color: 'red', label: 'Alta' },
  media: { color: 'yellow', label: 'Media' },
  baja: { color: 'green', label: 'Baja' }
};

export function CrmModule() {
  const [patients, setPatients] = useState<CrmPatient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<CrmPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPatient, setSelectedPatient] = useState<CrmPatient | null>(null);
  const [showNewProspectDialog, setShowNewProspectDialog] = useState(false);
  const { toast } = useToast();

  // Estados para nuevo prospecto
  const [newProspect, setNewProspect] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    source: string;
    priority: 'alta' | 'media' | 'baja';
    notes: string;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: '',
    priority: 'media',
    notes: ''
  });

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, statusFilter]);

  const loadPatients = async () => {
    try {
      const response = await fetch('/api/crm/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        throw new Error('Error al cargar pacientes');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los pacientes del CRM",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)
      );
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(patient => patient.status === statusFilter);
    }

    setFilteredPatients(filtered);
  };

  const createProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/crm/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProspect,
          status: 'prospecto',
          lastContact: new Date().toISOString()
        })
      });

      if (response.ok) {
        const prospect = await response.json();
        setPatients([prospect, ...patients]);
        setShowNewProspectDialog(false);
        setNewProspect({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          source: '',
          priority: 'media' as 'alta' | 'media' | 'baja',
          notes: ''
        });
        toast({
          title: "Éxito",
          description: "Prospecto creado exitosamente"
        });
      } else {
        throw new Error('Error al crear prospecto');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el prospecto",
        variant: "destructive"
      });
    }
  };

  const updatePatientStatus = async (patientId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/crm/patients/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const updatedPatient = await response.json();
        setPatients(patients.map(p => p.id === patientId ? updatedPatient : p));
        toast({
          title: "Estado actualizado",
          description: `Estado cambiado a ${statusConfig[newStatus as keyof typeof statusConfig].label}`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  // Métricas del CRM
  const metrics = {
    totalProspects: patients.filter(p => p.status === 'prospecto').length,
    totalActive: patients.filter(p => !['completado', 'perdido'].includes(p.status)).length,
    conversionRate: patients.length > 0 ? Math.round((patients.filter(p => p.status === 'completado').length / patients.length) * 100) : 0,
    avgBudget: patients.reduce((sum, p) => sum + (p.budgetTotal || 0), 0) / (patients.filter(p => p.budgetTotal).length || 1)
  };

  const PipelineView = () => (
    <div className="space-y-6">
      {/* Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const statusPatients = filteredPatients.filter(p => p.status === status);
          return (
            <Card key={status} className="min-h-[400px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className={`text-${config.color}-600`}>{config.label}</span>
                  <Badge variant="secondary" className="ml-2">
                    {statusPatients.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusPatients.map(patient => (
                  <Card key={patient.id} className="p-3 hover:shadow-md cursor-pointer transition-shadow"
                        onClick={() => setSelectedPatient(patient)}>
                    <div className="space-y-2">
                      <div className="font-medium text-sm">
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {patient.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {patient.phone}
                        </div>
                      </div>
                      {patient.budgetTotal && (
                        <div className="text-xs font-semibold text-green-600">
                          {formatCurrency(patient.budgetTotal)}
                        </div>
                      )}
                      <Badge 
                        variant="outline" 
                        className={`text-xs text-${priorityConfig[patient.priority].color}-600`}
                      >
                        {priorityConfig[patient.priority].label}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const ListView = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Lista de Pacientes CRM</CardTitle>
            <CardDescription>
              Gestión completa de pacientes y seguimiento
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={() => loadPatients()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar pacientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(statusConfig).map(([status, config]) => (
                <SelectItem key={status} value={status}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Paciente</th>
                <th className="text-left p-2">Contacto</th>
                <th className="text-left p-2">Estado</th>
                <th className="text-left p-2">Prioridad</th>
                <th className="text-left p-2">Presupuesto</th>
                <th className="text-left p-2">Progreso</th>
                <th className="text-left p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map(patient => (
                <tr key={patient.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <div>
                      <div className="font-medium">
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        Fuente: {patient.source}
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="text-sm">
                      <div>{patient.email}</div>
                      <div>{patient.phone}</div>
                    </div>
                  </td>
                  <td className="p-2">
                    <Badge className={`bg-${statusConfig[patient.status].color}-100 text-${statusConfig[patient.status].color}-800`}>
                      {statusConfig[patient.status].label}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <Badge variant="outline" className={`text-${priorityConfig[patient.priority].color}-600`}>
                      {priorityConfig[patient.priority].label}
                    </Badge>
                  </td>
                  <td className="p-2">
                    {patient.budgetTotal ? (
                      <div className="font-semibold text-green-600">
                        {formatCurrency(patient.budgetTotal)}
                      </div>
                    ) : (
                      <span className="text-gray-400">Sin presupuesto</span>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="w-20">
                      <Progress 
                        value={statusConfig[patient.status].progress} 
                        className="h-2"
                      />
                    </div>
                  </td>
                  <td className="p-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setSelectedPatient(patient)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {Object.entries(statusConfig).map(([status, config]) => (
                          <DropdownMenuItem 
                            key={status}
                            onClick={() => updatePatientStatus(patient.id, status)}
                          >
                            Cambiar a {config.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Cargando CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CRM - SmileSys</h1>
          <p className="text-gray-500 mt-1">
            Gestión de pacientes desde prospecto hasta finalización
          </p>
        </div>
        <Dialog open={showNewProspectDialog} onOpenChange={setShowNewProspectDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Nuevo Prospecto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Prospecto</DialogTitle>
              <DialogDescription>
                Ingresa la información del nuevo prospecto para comenzar el seguimiento
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createProspect}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={newProspect.firstName}
                      onChange={(e) => setNewProspect({...newProspect, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={newProspect.lastName}
                      onChange={(e) => setNewProspect({...newProspect, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newProspect.email}
                      onChange={(e) => setNewProspect({...newProspect, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={newProspect.phone}
                      onChange={(e) => setNewProspect({...newProspect, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="source">Fuente</Label>
                    <Select value={newProspect.source} onValueChange={(value) => setNewProspect({...newProspect, source: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar fuente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="redes_sociales">Redes Sociales</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="referencia">Referencia</SelectItem>
                        <SelectItem value="walk_in">Llegó directamente</SelectItem>
                        <SelectItem value="llamada">Llamada telefónica</SelectItem>
                        <SelectItem value="otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select value={newProspect.priority} onValueChange={(value) => setNewProspect({...newProspect, priority: value as 'alta' | 'media' | 'baja'})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="baja">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={newProspect.notes}
                    onChange={(e) => setNewProspect({...newProspect, notes: e.target.value})}
                    placeholder="Información adicional sobre el prospecto..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowNewProspectDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Crear Prospecto
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prospectos Activos</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProspects}</div>
            <p className="text-xs text-muted-foreground">
              +2 desde la semana pasada
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalActive}</div>
            <p className="text-xs text-muted-foreground">
              Pacientes activos en el pipeline
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Prospectos que completaron tratamiento
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Promedio</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.avgBudget)}</div>
            <p className="text-xs text-muted-foreground">
              Valor promedio de tratamientos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes vistas */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <PipelineView />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <ListView />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(statusConfig).map(([status, config]) => {
                    const count = patients.filter(p => p.status === status).length;
                    const percentage = patients.length > 0 ? (count / patients.length) * 100 : 0;
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-sm">{config.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20">
                            <Progress value={percentage} className="h-2" />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fuentes de Pacientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">Gráfico en desarrollo</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de detalles del paciente */}
      {selectedPatient && (
        <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>
                {selectedPatient.firstName} {selectedPatient.lastName}
              </DialogTitle>
              <DialogDescription>
                Detalles completos del paciente y seguimiento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Estado Actual</Label>
                  <Badge className={`bg-${statusConfig[selectedPatient.status].color}-100 text-${statusConfig[selectedPatient.status].color}-800`}>
                    {statusConfig[selectedPatient.status].label}
                  </Badge>
                </div>
                <div>
                  <Label>Progreso</Label>
                  <Progress value={statusConfig[selectedPatient.status].progress} className="mt-1" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">{selectedPatient.email}</p>
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <p className="text-sm">{selectedPatient.phone}</p>
                </div>
              </div>

              {selectedPatient.budgetTotal && (
                <div>
                  <Label>Presupuesto Total</Label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(selectedPatient.budgetTotal)}
                  </p>
                </div>
              )}

              <div>
                <Label>Notas</Label>
                <p className="text-sm bg-gray-50 p-3 rounded">
                  {selectedPatient.notes || 'Sin notas'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPatient(null)}>
                Cerrar
              </Button>
              <Button>
                Editar Paciente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
