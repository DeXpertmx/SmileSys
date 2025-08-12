
'use client';

import React, { useState, useEffect } from 'react';

import { Odontograma, type DienteData, type CaraDiente, type TratamientoDiente, TRATAMIENTOS_SUGERIDOS } from '@/components/odontograma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Smile, User, Save, RotateCcw, FileText, Calendar, Plus, Stethoscope, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate, toDateInputFormat } from '@/lib/date-utils';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate?: string;
}

interface NuevoTratamiento {
  patientId: string;
  name: string;
  category: string;
  description: string;
  diagnosis: string;
  procedure: string;
  cost: string;
  status: string;
  startDate: string;
  diente: number;
  cara: string;
}

export default function OdontogramaPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [datosOdontograma, setDatosOdontograma] = useState<DienteData[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados para el diálogo de tratamiento
  const [showTreatmentDialog, setShowTreatmentDialog] = useState(false);
  const [selectedTreatmentData, setSelectedTreatmentData] = useState<TratamientoDiente | null>(null);
  const [nuevoTratamiento, setNuevoTratamiento] = useState<NuevoTratamiento>({
    patientId: '',
    name: '',
    category: '',
    description: '',
    diagnosis: '',
    procedure: '',
    cost: '',
    status: 'Planificado',
    startDate: toDateInputFormat(new Date()),
    diente: 0,
    cara: ''
  });

  // Cargar pacientes al montar el componente
  useEffect(() => {
    loadPatients();
  }, []);

  // Cargar datos del odontograma cuando se selecciona un paciente
  useEffect(() => {
    if (selectedPatientId) {
      const patient = patients.find(p => p.id === selectedPatientId);
      setSelectedPatient(patient || null);
      loadOdontograma(selectedPatientId);
    } else {
      setSelectedPatient(null);
      setDatosOdontograma([]);
    }
  }, [selectedPatientId, patients]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/patients');
      if (response.ok) {
        const data = await response.json();
        // The API returns { patients: Patient[], total: number }
        setPatients(data.patients || []);
      } else {
        toast.error('Error al cargar pacientes');
      }
    } catch (error) {
      console.error('Error cargando pacientes:', error);
      setPatients([]); // Set empty array as fallback
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadOdontograma = async (patientId: string) => {
    setLoading(true);
    try {
      // Por ahora, inicializamos con datos vacíos
      // En el futuro se puede agregar una API para cargar datos existentes
      const datosVacios: DienteData[] = Array.from({ length: 32 }, (_, index) => ({
        numero: index + 1,
        caras: {
          vestibular: 'sano',
          lingual: 'sano',
          mesial: 'sano',
          distal: 'sano',
          oclusal: 'sano'
        }
      }));
      setDatosOdontograma(datosVacios);
      setHasChanges(false);
    } catch (error) {
      console.error('Error cargando odontograma:', error);
      toast.error('Error al cargar odontograma');
    } finally {
      setLoading(false);
    }
  };

  const handleDienteChange = (numero: number, caras: CaraDiente) => {
    setDatosOdontograma(prev => 
      prev.map(diente => 
        diente.numero === numero 
          ? { ...diente, caras }
          : diente
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedPatientId) {
      toast.error('Selecciona un paciente primero');
      return;
    }

    setLoading(true);
    try {
      // Simulamos guardado (se puede implementar la API más tarde)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      toast.success('Odontograma guardado correctamente');
    } catch (error) {
      console.error('Error guardando odontograma:', error);
      toast.error('Error al guardar odontograma');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (selectedPatientId) {
      loadOdontograma(selectedPatientId);
    }
  };

  const handleCrearTratamiento = (tratamientoData: TratamientoDiente) => {
    if (!selectedPatient) return;
    
    const caraTexto = tratamientoData.cara === 'vestibular' ? 'vestibular' :
                     tratamientoData.cara === 'lingual' ? 'lingual' :
                     tratamientoData.cara === 'mesial' ? 'mesial' :
                     tratamientoData.cara === 'distal' ? 'distal' : 'oclusal';
    
    const estadoTexto = tratamientoData.estadoActual === 'caries' ? 'caries' :
                       tratamientoData.estadoActual === 'amalgama' ? 'amalgama desgastada' :
                       tratamientoData.estadoActual === 'resina' ? 'resina desgastada' :
                       tratamientoData.estadoActual === 'corona' ? 'corona dañada' :
                       tratamientoData.estadoActual === 'endodoncia' ? 'necesita revisión endodóntica' : 
                       tratamientoData.estadoActual;
    
    setSelectedTreatmentData(tratamientoData);
    setNuevoTratamiento({
      patientId: selectedPatientId,
      name: tratamientoData.tratamientoSugerido || TRATAMIENTOS_SUGERIDOS[tratamientoData.estadoActual][0],
      category: getCategoryFromState(tratamientoData.estadoActual),
      description: `Tratamiento para diente #${tratamientoData.numero}, cara ${caraTexto}`,
      diagnosis: `Diente #${tratamientoData.numero} con ${estadoTexto} en cara ${caraTexto}`,
      procedure: getProcedureFromState(tratamientoData.estadoActual),
      cost: getCostFromState(tratamientoData.estadoActual),
      status: 'Planificado',
      startDate: toDateInputFormat(new Date()),
      diente: tratamientoData.numero,
      cara: caraTexto
    });
    setShowTreatmentDialog(true);
  };

  const getCategoryFromState = (estado: string): string => {
    switch (estado) {
      case 'caries': return 'Restaurativo';
      case 'amalgama': return 'Restaurativo';
      case 'resina': return 'Restaurativo';
      case 'corona': return 'Restaurativo';
      case 'endodoncia': return 'Endodoncia';
      case 'extraccion': return 'Cirugía';
      case 'implante': return 'Cirugía';
      default: return 'Preventivo';
    }
  };

  const getProcedureFromState = (estado: string): string => {
    switch (estado) {
      case 'caries': return 'Remoción de tejido cariado y obturación';
      case 'amalgama': return 'Remoción de amalgama antigua y nueva obturación';
      case 'resina': return 'Remoción de resina antigua y nueva restauración';
      case 'corona': return 'Evaluación y posible reemplazo de corona';
      case 'endodoncia': return 'Revisión del tratamiento de conducto';
      case 'extraccion': return 'Colocación de implante dental';
      case 'implante': return 'Revisión y mantenimiento del implante';
      default: return 'Procedimiento preventivo';
    }
  };

  const getCostFromState = (estado: string): string => {
    switch (estado) {
      case 'caries': return '80';
      case 'amalgama': return '90';
      case 'resina': return '75';
      case 'corona': return '350';
      case 'endodoncia': return '450';
      case 'extraccion': return '1200';
      case 'implante': return '150';
      default: return '50';
    }
  };

  const handleSubmitTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/treatments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoTratamiento,
          cost: parseFloat(nuevoTratamiento.cost),
          startDate: new Date(nuevoTratamiento.startDate).toISOString(),
          instructions: `Tratamiento para diente #${nuevoTratamiento.diente}, cara ${nuevoTratamiento.cara}. Seguir protocolo estándar.`
        }),
      });

      if (response.ok) {
        toast.success('Tratamiento creado exitosamente');
        setShowTreatmentDialog(false);
        // Reset form
        setNuevoTratamiento({
          patientId: '',
          name: '',
          category: '',
          description: '',
          diagnosis: '',
          procedure: '',
          cost: '',
          status: 'Planificado',
          startDate: toDateInputFormat(new Date()),
          diente: 0,
          cara: ''
        });
      } else {
        toast.error('Error al crear tratamiento');
      }
    } catch (error) {
      console.error('Error creando tratamiento:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Estadísticas del estado dental
  const getEstadisticas = () => {
    const total = datosOdontograma.length * 5; // 32 dientes * 5 caras
    let sanos = 0;
    let problemas = 0;
    let tratados = 0;

    datosOdontograma.forEach(diente => {
      Object.values(diente.caras).forEach(cara => {
        if (cara === 'sano') sanos++;
        else if (cara === 'caries') problemas++;
        else tratados++;
      });
    });

    return { total, sanos, problemas, tratados };
  };

  const estadisticas = getEstadisticas();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-600 flex items-center">
            <Smile className="w-8 h-8 mr-3" />
            Odontograma Digital
          </h1>
          <p className="text-gray-600">Gestión visual del estado dental de los pacientes</p>
        </div>
          <div className="flex space-x-2">
            {hasChanges && (
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={loading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Descartar Cambios
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!selectedPatientId || !hasChanges || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>

        {/* Selector de paciente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Seleccionar Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="patient">Paciente</Label>
                <Select 
                  value={selectedPatientId} 
                  onValueChange={setSelectedPatientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients && patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} - {patient.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedPatient && (
                <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-600">
                      {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">{selectedPatient.email}</p>
                    {selectedPatient.birthDate && (
                      <p className="text-sm text-gray-600">
                        Nacimiento: {formatDate(selectedPatient.birthDate)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        {selectedPatient && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">😊</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Caras Sanas</p>
                    <p className="text-2xl font-bold text-green-600">{estadisticas.sanos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🦷</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Con Problemas</p>
                    <p className="text-2xl font-bold text-red-600">{estadisticas.problemas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⚕️</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tratadas</p>
                    <p className="text-2xl font-bold text-blue-600">{estadisticas.tratados}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Salud Dental</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round((estadisticas.sanos / estadisticas.total) * 100)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Odontograma */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Smile className="w-5 h-5 mr-2" />
                Odontograma Interactivo
                {hasChanges && (
                  <Badge variant="secondary" className="ml-2">
                    Cambios sin guardar
                  </Badge>
                )}
              </CardTitle>
              {selectedPatient && (
                <div className="text-sm text-gray-600">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Última actualización: {new Date().toLocaleString()}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedPatient ? (
              <div className="text-center py-12">
                <Smile className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Selecciona un Paciente
                </h3>
                <p className="text-gray-500">
                  Selecciona un paciente de la lista superior para ver su odontograma
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    Odontograma de {selectedPatient.firstName} {selectedPatient.lastName}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Haga clic en las caras de los dientes para registrar el estado. 
                    Use el selector debajo de cada diente para cambiar el estado.
                  </p>
                </div>
                
                <Odontograma
                  pacienteId={selectedPatientId}
                  datos={datosOdontograma}
                  onDienteChange={handleDienteChange}
                  onCrearTratamiento={handleCrearTratamiento}
                  readonly={loading}
                />
                
                {hasChanges && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-yellow-600 mr-2">⚠️</span>
                        <span className="text-sm text-yellow-800">
                          Tienes cambios sin guardar en el odontograma
                        </span>
                      </div>
                      <Button size="sm" onClick={handleSave}>
                        Guardar Ahora
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instrucciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Instrucciones de Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Cómo usar el odontograma:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Selecciona un paciente de la lista</li>
                  <li>• Cada diente tiene 5 caras: vestibular, lingual, mesial, distal y oclusal</li>
                  <li>• Haz clic en cualquier cara para editarla</li>
                  <li>• <strong>Doble clic</strong> en caras con problemas para crear tratamientos</li>
                  <li>• Usa el selector debajo de cada diente para cambiar el estado</li>
                  <li>• Los cambios se marcan automáticamente</li>
                  <li>• No olvides guardar los cambios</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Estados disponibles:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-white border border-gray-300 rounded mr-2"></div>
                    <span>Sano</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-800 rounded mr-2"></div>
                    <span>Caries</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-600 rounded mr-2"></div>
                    <span>Amalgama</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-200 rounded mr-2"></div>
                    <span>Resina</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                    <span>Corona</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-pink-400 rounded mr-2"></div>
                    <span>Endodoncia</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                    <span>Extracción</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                    <span>Implante</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diálogo para crear tratamiento */}
        <Dialog open={showTreatmentDialog} onOpenChange={setShowTreatmentDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
                Crear Tratamiento desde Odontograma
              </DialogTitle>
            </DialogHeader>
            
            {selectedTreatmentData && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center text-blue-800">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">
                    Diente #{selectedTreatmentData.numero} - Cara {selectedTreatmentData.cara}
                  </span>
                </div>
                <p className="text-blue-600 text-sm mt-1">
                  Estado detectado: <span className="font-medium capitalize">{selectedTreatmentData.estadoActual}</span>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmitTreatment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre del Tratamiento *</Label>
                  <Select 
                    value={nuevoTratamiento.name} 
                    onValueChange={(value) => setNuevoTratamiento(prev => ({...prev, name: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTreatmentData && TRATAMIENTOS_SUGERIDOS[selectedTreatmentData.estadoActual].map((tratamiento) => (
                        <SelectItem key={tratamiento} value={tratamiento}>
                          {tratamiento}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Input
                    value={nuevoTratamiento.category}
                    onChange={(e) => setNuevoTratamiento(prev => ({...prev, category: e.target.value}))}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="diagnosis">Diagnóstico *</Label>
                <Textarea
                  value={nuevoTratamiento.diagnosis}
                  onChange={(e) => setNuevoTratamiento(prev => ({...prev, diagnosis: e.target.value}))}
                  rows={2}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  value={nuevoTratamiento.description}
                  onChange={(e) => setNuevoTratamiento(prev => ({...prev, description: e.target.value}))}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="procedure">Procedimiento</Label>
                <Textarea
                  value={nuevoTratamiento.procedure}
                  onChange={(e) => setNuevoTratamiento(prev => ({...prev, procedure: e.target.value}))}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cost">Costo Estimado (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={nuevoTratamiento.cost}
                    onChange={(e) => setNuevoTratamiento(prev => ({...prev, cost: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">Fecha Planificada *</Label>
                  <Input
                    type="date"
                    value={nuevoTratamiento.startDate}
                    onChange={(e) => setNuevoTratamiento(prev => ({...prev, startDate: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Estado</Label>
                  <Select 
                    value={nuevoTratamiento.status} 
                    onValueChange={(value) => setNuevoTratamiento(prev => ({...prev, status: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planificado">Planificado</SelectItem>
                      <SelectItem value="Urgente">Urgente</SelectItem>
                      <SelectItem value="Programado">Programado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowTreatmentDialog(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? 'Creando...' : 'Crear Tratamiento'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  );
}
