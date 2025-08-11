
'use client';

import React, { useState, useEffect } from 'react';
import { FileUpload, UploadedFile } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Image, FileX, Upload } from 'lucide-react';

interface MedicalDocumentsProps {
  patientId: string;
  patientName: string;
}

interface DocumentData {
  type: string;
  category: string;
  description: string;
}

export function MedicalDocuments({ patientId, patientName }: MedicalDocumentsProps) {
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentData, setDocumentData] = useState<DocumentData>({
    type: 'historia_clinica',
    category: '',
    description: ''
  });

  useEffect(() => {
    loadDocuments();
  }, [patientId]);

  const loadDocuments = async () => {
    try {
      const response = await fetch(`/api/documents?patientId=${patientId}`);
      if (response.ok) {
        const docs = await response.json();
        const formattedDocs: UploadedFile[] = docs.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          originalName: doc.originalName,
          size: doc.size,
          type: doc.mimeType,
          url: doc.url,
          uploadDate: doc.uploadDate
        }));
        setDocuments(formattedDocs);
      }
    } catch (error) {
      console.error('Error cargando documentos:', error);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('patientId', patientId);
      formData.append('type', documentData.type);
      formData.append('category', documentData.category);
      formData.append('description', documentData.description);
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        await loadDocuments();
        setIsDialogOpen(false);
        setDocumentData({
          type: 'historia_clinica',
          category: '',
          description: ''
        });
      } else {
        console.error('Error subiendo documentos');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDocument = async (index: number) => {
    const document = documents[index];
    try {
      const response = await fetch(`/api/documents?id=${document.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadDocuments();
      }
    } catch (error) {
      console.error('Error eliminando documento:', error);
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    if (type.includes('image')) return <Image className="w-5 h-5" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <FileX className="w-5 h-5" />;
  };

  const getDocumentTypeBadge = (type: string) => {
    const typeMapping: Record<string, string> = {
      'historia_clinica': 'Historia Clínica',
      'radiografia': 'Radiografía',
      'foto': 'Fotografía',
      'documento_legal': 'Documento Legal',
      'laboratorio': 'Laboratorio',
      'receta': 'Receta',
      'otro': 'Otro'
    };

    return typeMapping[type] || type;
  };

  const documentTypes = [
    { value: 'historia_clinica', label: 'Historia Clínica' },
    { value: 'radiografia', label: 'Radiografía' },
    { value: 'foto', label: 'Fotografía' },
    { value: 'laboratorio', label: 'Resultado de Laboratorio' },
    { value: 'receta', label: 'Receta Médica' },
    { value: 'documento_legal', label: 'Documento Legal' },
    { value: 'otro', label: 'Otro' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Documentos Médicos</h3>
          <p className="text-gray-600 text-sm">
            Historias clínicas digitalizadas, radiografías, fotografías y documentos del paciente {patientName}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Subir Documentos
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Subir Documentos Médicos</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Documento</Label>
                  <Select 
                    value={documentData.type} 
                    onValueChange={(value) => setDocumentData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Categoría</Label>
                  <Input
                    value={documentData.category}
                    onChange={(e) => setDocumentData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Ej: RX Periapical, Historia inicial..."
                  />
                </div>
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={documentData.description}
                  onChange={(e) => setDocumentData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Descripción del documento, observaciones, fecha original..."
                />
              </div>

              <FileUpload
                onFileUpload={handleFileUpload}
                acceptedTypes={['application/pdf', 'image/*']}
                maxSize={50} // 50MB para documentos médicos
                multiple={true}
                title="Seleccionar Archivos"
                description="Arrastra PDFs e imágenes aquí o haz clic para seleccionar"
              />

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Documentos Subidos ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay documentos subidos</p>
              <p className="text-sm">Sube historias clínicas, radiografías y otros documentos médicos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc, index) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {getDocumentTypeIcon(doc.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.originalName}</p>
                        <p className="text-xs text-gray-500">
                          {(doc.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {doc.type.includes('image') ? 'Imagen' : 'PDF'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="flex-1"
                      >
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          Ver
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a href={doc.url} download={doc.originalName}>
                          Descargar
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
