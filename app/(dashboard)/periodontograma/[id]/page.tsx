
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Save,
  Download,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import PeriodontogramChart from '@/components/periodontogram/PeriodontogramChart';
import PeriodontogramEditor from '@/components/periodontogram/PeriodontogramEditor';
import PeriodontogramSummary from '@/components/periodontogram/PeriodontogramSummary';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  numeroExpediente: string;
  birthDate?: string;
  phone?: string;
  email?: string;
}

interface Doctor {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  especialidad?: string;
}

interface PeriodontalMeasurement {
  id: string;
  toothNumber: number;
  position: string;
  pocketDepthMesial: number;
  pocketDepthCentral: number;
  pocketDepthDistal: number;
  attachmentLevelMesial: number;
  attachmentLevelCentral: number;
  attachmentLevelDistal: number;
  recessionMesial: number;
  recessionCentral: number;
  recessionDistal: number;
  bleedingMesial: boolean;
  bleedingCentral: boolean;
  bleedingDistal: boolean;
  suppurationMesial: boolean;
  suppurationCentral: boolean;
  suppurationDistal: boolean;
  plaqueMesial: boolean;
  plaqueCentral: boolean;
  plaqueDistal: boolean;
  calculusMesial: boolean;
  calculusCentral: boolean;
  calculusDistal: boolean;
}

interface ToothStatus {
  id: string;
  toothNumber: number;
  status: string;
  condition?: string;
  mobility: number;
  furcationMesial: number;
  furcationDistal: number;
  furcationVestibular: number;
  furcationLingual: number;
  hasImplant: boolean;
  implantBrand?: string;
  implantSize?: string;
  hasRestoration: boolean;
  restorationType?: string;
  restorationCondition?: string;
  notes?: string;
}

interface Periodontogram {
  id: string;
  title: string;
  examinationDate: string;
  status: string;
  riskLevel?: string;
  notes?: string;
  diagnosis?: string;
  recommendations?: string;
  treatmentPlan?: string;
  followUpDate?: string;
  patient: Patient;
  doctor: Doctor;
  measurements: PeriodontalMeasurement[];
  toothStatuses: ToothStatus[];
}

export default function PeriodontogramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [periodontogram, setPeriodontogram] = useState<Periodontogram | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('visual');

  useEffect(() => {
    if (params.id) {
      fetchPeriodontogram(params.id as string);
    }
  }, [params.id]);

  const fetchPeriodontogram = async (id: string) => {
    try {
      const response = await fetch(`/api/periodontograms/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPeriodontogram(data);
      } else {
        toast.error('Error al cargar el periodontograma');
        router.push('/periodontograma');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar el periodontograma');
      router.push('/periodontograma');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedData: Partial<Periodontogram>) => {
    try {
      const response = await fetch(`/api/periodontograms/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        const updatedPeriodontogram = await response.json();
        setPeriodontogram(updatedPeriodontogram);
        setIsEditing(false);
        toast.success('Periodontograma guardado correctamente');
      } else {
        toast.error('Error al guardar el periodontograma');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar el periodontograma');
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
        return <Badge variant="outline" className="text-green-600 border-green-600">Riesgo Bajo</Badge>;
      case 'Moderado':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Riesgo Moderado</Badge>;
      case 'Alto':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Riesgo Alto</Badge>;
      case 'Muy_Alto':
        return <Badge variant="destructive">Riesgo Muy Alto</Badge>;
      default:
        return <Badge variant="outline">{riskLevel}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!periodontogram) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Periodontograma no encontrado
            </h3>
            <Button onClick={() => router.push('/periodontograma')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/periodontograma')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {periodontogram.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {periodontogram.patient.firstName} {periodontogram.patient.lastName}
                <span className="ml-2 text-gray-400">({periodontogram.patient.numeroExpediente})</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(periodontogram.examinationDate).toLocaleDateString('es-ES')}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          {getStatusBadge(periodontogram.status)}
          {getRiskBadge(periodontogram.riskLevel)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 mb-6">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </Button>
            <Button onClick={() => handleSave(periodontogram)}>
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="visual">Visualización</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="info">Información</TabsTrigger>
        </TabsList>

        <TabsContent value="visual">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Periodontograma Visual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PeriodontogramChart 
                measurements={periodontogram.measurements}
                toothStatuses={periodontogram.toothStatuses}
                isEditable={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit className="w-5 h-5 mr-2" />
                Editor de Periodontograma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PeriodontogramEditor 
                periodontogram={periodontogram}
                onSave={handleSave}
                isEditable={isEditing}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <PeriodontogramSummary 
            periodontogram={periodontogram}
          />
        </TabsContent>

        <TabsContent value="info">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Información del Paciente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Información del Paciente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre</label>
                  <p>{periodontogram.patient.firstName} {periodontogram.patient.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Número de Expediente</label>
                  <p>{periodontogram.patient.numeroExpediente}</p>
                </div>
                {periodontogram.patient.birthDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Nacimiento</label>
                    <p>{new Date(periodontogram.patient.birthDate).toLocaleDateString('es-ES')}</p>
                  </div>
                )}
                {periodontogram.patient.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Teléfono</label>
                    <p>{periodontogram.patient.phone}</p>
                  </div>
                )}
                {periodontogram.patient.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p>{periodontogram.patient.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información del Doctor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Información del Doctor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre</label>
                  <p>Dr. {periodontogram.doctor.firstName} {periodontogram.doctor.lastName}</p>
                </div>
                {periodontogram.doctor.especialidad && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Especialización</label>
                    <p>{periodontogram.doctor.especialidad}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Fecha de Examen</label>
                  <p>{new Date(periodontogram.examinationDate).toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <div className="mt-1">{getStatusBadge(periodontogram.status)}</div>
                </div>
                {periodontogram.riskLevel && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nivel de Riesgo</label>
                    <div className="mt-1">{getRiskBadge(periodontogram.riskLevel)}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notas y Diagnóstico */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Notas y Diagnóstico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {periodontogram.diagnosis && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Diagnóstico</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {periodontogram.diagnosis}
                    </p>
                  </div>
                )}
                {periodontogram.recommendations && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Recomendaciones</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {periodontogram.recommendations}
                    </p>
                  </div>
                )}
                {periodontogram.treatmentPlan && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plan de Tratamiento</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {periodontogram.treatmentPlan}
                    </p>
                  </div>
                )}
                {periodontogram.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notas</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {periodontogram.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
