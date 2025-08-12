
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  numeroExpediente: string;
}

interface Doctor {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
}

interface Periodontogram {
  id: string;
  title: string;
  examinationDate: string;
  status: string;
  riskLevel?: string;
  patient: Patient;
  doctor: Doctor;
  _count: {
    measurements: number;
    toothStatuses: number;
  };
}

export default function PeriodontogramPage() {
  const [periodontograms, setPeriodontograms] = useState<Periodontogram[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPeriodontogram, setNewPeriodontogram] = useState({
    patientId: '',
    title: '',
    notes: '',
    riskLevel: ''
  });

  useEffect(() => {
    fetchPeriodontograms();
    fetchPatients();
  }, []);

  const fetchPeriodontograms = async () => {
    try {
      const response = await fetch('/api/periodontograms');
      if (response.ok) {
        const data = await response.json();
        setPeriodontograms(data);
      } else {
        toast.error('Error al cargar periodontogramas');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar periodontogramas');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      if (response.ok) {
        const data = await response.json();
        // The API returns { patients: Patient[], total: number }
        setPatients(data.patients || []);
      }
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
      setPatients([]); // Set empty array as fallback
    }
  };

  const createPeriodontogram = async () => {
    if (!newPeriodontogram.patientId) {
      toast.error('Selecciona un paciente');
      return;
    }

    try {
      const response = await fetch('/api/periodontograms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPeriodontogram),
      });

      if (response.ok) {
        const createdPeriodontogram = await response.json();
        setPeriodontograms(prev => [createdPeriodontogram, ...prev]);
        setShowCreateDialog(false);
        setNewPeriodontogram({
          patientId: '',
          title: '',
          notes: '',
          riskLevel: ''
        });
        toast.success('Periodontograma creado correctamente');
        
        // Redirigir al editor del periodontograma
        window.location.href = `/periodontograma/${createdPeriodontogram.id}`;
      } else {
        toast.error('Error al crear periodontograma');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear periodontograma');
    }
  };

  const deletePeriodontogram = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este periodontograma?')) {
      return;
    }

    try {
      const response = await fetch(`/api/periodontograms/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPeriodontograms(prev => prev.filter(p => p.id !== id));
        toast.success('Periodontograma eliminado correctamente');
      } else {
        toast.error('Error al eliminar periodontograma');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar periodontograma');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'En_Proceso':
        return <Badge variant="secondary">En Proceso</Badge>;
      case 'Completado':
        return <Badge variant="default" className="bg-green-500">Completado</Badge>;
      case 'Revisión':
        return <Badge variant="outline">En Revisión</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRiskBadge = (riskLevel?: string) => {
    if (!riskLevel) return null;
    
    switch (riskLevel) {
      case 'Bajo':
        return <Badge variant="outline" className="text-green-600 border-green-600">Bajo</Badge>;
      case 'Moderado':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Moderado</Badge>;
      case 'Alto':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Alto</Badge>;
      case 'Muy_Alto':
        return <Badge variant="destructive">Muy Alto</Badge>;
      default:
        return <Badge variant="outline">{riskLevel}</Badge>;
    }
  };

  const filteredPeriodontograms = periodontograms.filter(periodontogram => {
    const matchesSearch = 
      periodontogram.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      periodontogram.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      periodontogram.patient.numeroExpediente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      periodontogram.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || periodontogram.status === statusFilter;
    const matchesPatient = !selectedPatientId || periodontogram.patient.id === selectedPatientId;
    
    return matchesSearch && matchesStatus && matchesPatient;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Periodontogramas</h1>
          <p className="text-gray-600">Gestión de diagnósticos periodontales</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Periodontograma
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Periodontograma</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Paciente *</label>
                <Select 
                  value={newPeriodontogram.patientId}
                  onValueChange={(value) => setNewPeriodontogram(prev => ({ ...prev, patientId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients && patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} - {patient.numeroExpediente}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Título</label>
                <Input
                  placeholder="Periodontograma - Fecha"
                  value={newPeriodontogram.title}
                  onChange={(e) => setNewPeriodontogram(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Nivel de Riesgo</label>
                <Select
                  value={newPeriodontogram.riskLevel}
                  onValueChange={(value) => setNewPeriodontogram(prev => ({ ...prev, riskLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel de riesgo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bajo">Bajo</SelectItem>
                    <SelectItem value="Moderado">Moderado</SelectItem>
                    <SelectItem value="Alto">Alto</SelectItem>
                    <SelectItem value="Muy_Alto">Muy Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={createPeriodontogram}>
                  Crear Periodontograma
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por paciente, expediente o título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="md:w-48">
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los pacientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los pacientes</SelectItem>
                  {patients && patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="En_Proceso">En Proceso</SelectItem>
                  <SelectItem value="Completado">Completado</SelectItem>
                  <SelectItem value="Revisión">En Revisión</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Periodontogramas */}
      <div className="grid gap-6">
        {filteredPeriodontograms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay periodontogramas
              </h3>
              <p className="text-gray-500 text-center mb-4">
                {searchTerm || statusFilter !== 'all' || selectedPatientId
                  ? 'No se encontraron resultados con los filtros aplicados.'
                  : 'Comienza creando tu primer periodontograma.'}
              </p>
              {!searchTerm && statusFilter === 'all' && !selectedPatientId && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Periodontograma
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredPeriodontograms.map((periodontogram) => (
            <Card key={periodontogram.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg mb-1">
                      {periodontogram.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Paciente: {periodontogram.patient.firstName} {periodontogram.patient.lastName}
                      <span className="ml-2 text-gray-400">({periodontogram.patient.numeroExpediente})</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Dr. {periodontogram.doctor.firstName} {periodontogram.doctor.lastName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {getStatusBadge(periodontogram.status)}
                    {getRiskBadge(periodontogram.riskLevel)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="flex items-center space-x-6 mb-4 md:mb-0">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(periodontogram.examinationDate).toLocaleDateString('es-ES')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {periodontogram._count.measurements} mediciones
                    </div>
                    <div className="text-sm text-gray-500">
                      {periodontogram._count.toothStatuses} dientes evaluados
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/periodontograma/${periodontogram.id}`}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/periodontograma/${periodontogram.id}/editar`}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePeriodontogram(periodontogram.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
