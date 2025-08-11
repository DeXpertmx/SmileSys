
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
import { FileUpload, UploadedFile } from '@/components/ui/file-upload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, TestTube, Upload, FileText, Image, Download, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

interface LaboratoryManagerProps {
  patientId: string;
  patientName: string;
  treatmentId?: string;
}

interface LabOrder {
  id: string;
  orderNumber: string;
  type: string;
  tests: TestItem[];
  instructions?: string;
  diagnosis?: string;
  priority: string;
  status: string;
  orderDate: string;
  expectedDate?: string;
  completedDate?: string;
  hasResults: boolean;
  resultsNotes?: string;
  patient: {
    firstName: string;
    lastName: string;
  };
  doctor: {
    name: string;
    specialization?: string;
  };
  treatment?: {
    name: string;
  };
  results: LabResult[];
}

interface TestItem {
  name: string;
  description: string;
  instructions?: string;
}

interface LabResult {
  id: string;
  type: string;
  name: string;
  filename?: string;
  url?: string;
  content?: string;
  mimeType?: string;
  size?: number;
  description?: string;
  uploadDate: string;
}

interface NewLabOrder {
  type: string;
  tests: TestItem[];
  instructions: string;
  diagnosis: string;
  priority: string;
  expectedDate: string;
}

export function LaboratoryManager({ patientId, patientName, treatmentId }: LaboratoryManagerProps) {
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [loading, setLoading] = useState(false);

  const [newOrder, setNewOrder] = useState<NewLabOrder>({
    type: 'analisis_sangre',
    tests: [],
    instructions: '',
    diagnosis: '',
    priority: 'Normal',
    expectedDate: ''
  });

  const [newTest, setNewTest] = useState<TestItem>({
    name: '',
    description: '',
    instructions: ''
  });

  const [resultFiles, setResultFiles] = useState<File[]>([]);
  const [resultContent, setResultContent] = useState('');
  const [resultDescription, setResultDescription] = useState('');

  useEffect(() => {
    loadLabOrders();
  }, [patientId]);

  const loadLabOrders = async () => {
    try {
      const response = await fetch(`/api/lab-orders?patientId=${patientId}`);
      if (response.ok) {
        const data = await response.json();
        const formattedOrders = data.map((order: any) => ({
          ...order,
          tests: JSON.parse(order.tests || '[]')
        }));
        setLabOrders(formattedOrders);
      }
    } catch (error) {
      console.error('Error cargando órdenes:', error);
    }
  };

  const handleAddTest = () => {
    if (newTest.name) {
      setNewOrder(prev => ({
        ...prev,
        tests: [...prev.tests, { ...newTest }]
      }));
      setNewTest({ name: '', description: '', instructions: '' });
    }
  };

  const handleRemoveTest = (index: number) => {
    setNewOrder(prev => ({
      ...prev,
      tests: prev.tests.filter((_, i) => i !== index)
    }));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/lab-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          treatmentId,
          type: newOrder.type,
          tests: newOrder.tests,
          instructions: newOrder.instructions,
          diagnosis: newOrder.diagnosis,
          priority: newOrder.priority,
          expectedDate: newOrder.expectedDate ? new Date(newOrder.expectedDate).toISOString() : null
        })
      });

      if (response.ok) {
        await loadLabOrders();
        setIsOrderDialogOpen(false);
        resetOrderForm();
      }
    } catch (error) {
      console.error('Error creando orden:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadResults = async () => {
    if (!selectedOrder || (resultFiles.length === 0 && !resultContent.trim())) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('labOrderId', selectedOrder.id);
      formData.append('type', resultFiles.length > 0 ? 'archivo' : 'texto');
      formData.append('description', resultDescription);
      formData.append('content', resultContent);

      resultFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/lab-results', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        await loadLabOrders();
        setIsResultsDialogOpen(false);
        setResultFiles([]);
        setResultContent('');
        setResultDescription('');
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error subiendo resultados:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetOrderForm = () => {
    setNewOrder({
      type: 'analisis_sangre',
      tests: [],
      instructions: '',
      diagnosis: '',
      priority: 'Normal',
      expectedDate: ''
    });
    setNewTest({ name: '', description: '', instructions: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completada':
        return 'bg-green-100 text-green-800';
      case 'En_Proceso':
        return 'bg-blue-100 text-blue-800';
      case 'Solicitada':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completada':
        return <CheckCircle className="w-4 h-4" />;
      case 'En_Proceso':
        return <Clock className="w-4 h-4" />;
      case 'Solicitada':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Baja':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const orderTypes = [
    { value: 'analisis_sangre', label: 'Análisis de Sangre' },
    { value: 'radiografia', label: 'Radiografía' },
    { value: 'biopsia', label: 'Biopsia' },
    { value: 'cultivo', label: 'Cultivo' },
    { value: 'tomografia', label: 'Tomografía' },
    { value: 'resonancia', label: 'Resonancia Magnética' },
    { value: 'otros', label: 'Otros Estudios' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Laboratorio</h3>
          <p className="text-gray-600 text-sm">
            Órdenes de laboratorio, resultados y estudios para {patientName}
          </p>
        </div>
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Orden
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Orden de Laboratorio</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateOrder} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Estudio *</Label>
                  <Select 
                    value={newOrder.type} 
                    onValueChange={(value) => setNewOrder(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {orderTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Prioridad</Label>
                  <Select 
                    value={newOrder.priority} 
                    onValueChange={(value) => setNewOrder(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Diagnóstico Clínico</Label>
                <Textarea
                  value={newOrder.diagnosis}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, diagnosis: e.target.value }))}
                  rows={2}
                  placeholder="Diagnóstico que motiva la orden..."
                />
              </div>

              {/* Estudios solicitados */}
              <div>
                <Label className="text-base font-semibold">Estudios Solicitados</Label>
                
                <div className="space-y-2 mb-4">
                  {newOrder.tests.map((test, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{test.name}</p>
                          {test.description && (
                            <p className="text-sm text-gray-600">{test.description}</p>
                          )}
                          {test.instructions && (
                            <p className="text-xs text-gray-500 mt-1">{test.instructions}</p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTest(index)}
                          className="text-red-600"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-medium mb-3">Agregar Estudio</h4>
                  <Input
                    placeholder="Nombre del estudio"
                    value={newTest.name}
                    onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                    className="mb-3"
                  />
                  <Textarea
                    placeholder="Descripción del estudio"
                    value={newTest.description}
                    onChange={(e) => setNewTest(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="mb-3"
                  />
                  <Input
                    placeholder="Instrucciones especiales"
                    value={newTest.instructions}
                    onChange={(e) => setNewTest(prev => ({ ...prev, instructions: e.target.value }))}
                    className="mb-3"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTest}
                    disabled={!newTest.name}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Estudio
                  </Button>
                </div>
              </div>

              <div>
                <Label>Instrucciones para el Laboratorio</Label>
                <Textarea
                  value={newOrder.instructions}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, instructions: e.target.value }))}
                  rows={2}
                  placeholder="Instrucciones especiales, preparación del paciente, etc."
                />
              </div>

              <div>
                <Label>Fecha Esperada de Resultados</Label>
                <Input
                  type="date"
                  value={newOrder.expectedDate}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, expectedDate: e.target.value }))}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOrderDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || newOrder.tests.length === 0}
                >
                  {loading ? 'Creando...' : 'Crear Orden'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Órdenes de laboratorio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Órdenes de Laboratorio ({labOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {labOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <TestTube className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay órdenes de laboratorio</p>
              <p className="text-sm">Crea órdenes para análisis, radiografías y otros estudios</p>
            </div>
          ) : (
            <div className="space-y-4">
              {labOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">
                          Orden #{order.orderNumber.slice(-8)}
                        </h4>
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                          {getStatusIcon(order.status)}
                          {order.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(order.priority)}>
                          {order.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {orderTypes.find(t => t.value === order.type)?.label || order.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        Solicitada: {formatDate(order.orderDate)}
                        {order.expectedDate && ` • Esperada: ${formatDate(order.expectedDate)}`}
                        {order.completedDate && ` • Completada: ${formatDate(order.completedDate)}`}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Estudios Solicitados ({order.tests.length})
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {order.tests.map((test, index) => (
                        <div key={index} className="text-sm bg-blue-50 p-2 rounded">
                          <p className="font-medium">{test.name}</p>
                          {test.description && (
                            <p className="text-gray-600">{test.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.diagnosis && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Diagnóstico:</p>
                      <p className="text-sm text-gray-600">{order.diagnosis}</p>
                    </div>
                  )}

                  {order.hasResults && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Resultados ({order.results.length})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {order.results.map((result, index) => (
                          <div key={result.id} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                            {result.type === 'archivo' ? (
                              result.mimeType?.includes('image') ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                            <span className="text-sm truncate flex-1">{result.name}</span>
                            {result.url && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={result.url} target="_blank" rel="noopener noreferrer">
                                    <Eye className="w-3 h-3" />
                                  </a>
                                </Button>
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={result.url} download={result.name}>
                                    <Download className="w-3 h-3" />
                                  </a>
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!order.hasResults && (
                      <Dialog open={isResultsDialogOpen && selectedOrder?.id === order.id} onOpenChange={(open) => {
                        setIsResultsDialogOpen(open);
                        if (!open) setSelectedOrder(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Subir Resultados
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Subir Resultados de Laboratorio</DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div>
                              <Label>Descripción</Label>
                              <Input
                                value={resultDescription}
                                onChange={(e) => setResultDescription(e.target.value)}
                                placeholder="Descripción de los resultados..."
                              />
                            </div>

                            <Tabs defaultValue="files" className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="files">Archivos</TabsTrigger>
                                <TabsTrigger value="text">Texto</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="files" className="space-y-4">
                                <FileUpload
                                  onFileUpload={(files) => setResultFiles(files)}
                                  acceptedTypes={['application/pdf', 'image/*']}
                                  maxSize={100}
                                  multiple={true}
                                  title="Subir Archivos de Resultados"
                                  description="Sube PDFs de resultados, imágenes de radiografías, etc."
                                />
                              </TabsContent>
                              
                              <TabsContent value="text" className="space-y-4">
                                <div>
                                  <Label>Resultados en Texto</Label>
                                  <Textarea
                                    value={resultContent}
                                    onChange={(e) => setResultContent(e.target.value)}
                                    rows={8}
                                    placeholder="Escribe aquí los resultados del laboratorio..."
                                  />
                                </div>
                              </TabsContent>
                            </Tabs>

                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => setIsResultsDialogOpen(false)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={handleUploadResults}
                                disabled={loading || (resultFiles.length === 0 && !resultContent.trim())}
                              >
                                {loading ? 'Subiendo...' : 'Subir Resultados'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    <Button size="sm" variant="outline">
                      <FileText className="w-4 h-4 mr-1" />
                      Imprimir
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
