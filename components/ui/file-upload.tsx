
'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Eye, Download } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Badge } from './badge';

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  onFileRemove?: (index: number) => void;
  acceptedTypes?: string[];
  maxSize?: number; // en MB
  multiple?: boolean;
  uploadedFiles?: UploadedFile[];
  title?: string;
  description?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  uploadDate: string;
}

export function FileUpload({
  onFileUpload,
  onFileRemove,
  acceptedTypes = ['application/pdf', 'image/*'],
  maxSize = 10,
  multiple = true,
  uploadedFiles = [],
  title = "Subir Archivos",
  description = "Arrastra archivos aquí o haz clic para seleccionar"
}: FileUploadProps) {
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      // Verificar tamaño
      if (file.size > maxSize * 1024 * 1024) {
        alert(`El archivo ${file.name} es demasiado grande. Tamaño máximo: ${maxSize}MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      onFileUpload(validFiles);
    }
  }, [maxSize, onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    multiple
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    return '📁';
  };

  const canPreview = (file: UploadedFile) => {
    return file.type.includes('image') || file.type.includes('pdf');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600 mb-2">
              {isDragActive ? "Suelta los archivos aquí..." : description}
            </p>
            <p className="text-sm text-gray-500">
              Tipos permitidos: {acceptedTypes.join(', ')} • Tamaño máximo: {maxSize}MB
            </p>
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Archivos Subidos ({uploadedFiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {file.originalName}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
                        <Badge variant="outline" className="ml-2">
                          {file.type.split('/')[0]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {canPreview(file) && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewFile(file)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>{file.originalName}</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4">
                            {file.type.includes('image') ? (
                              <img
                                src={file.url}
                                alt={file.originalName}
                                className="max-w-full h-auto rounded-lg"
                              />
                            ) : file.type.includes('pdf') ? (
                              <iframe
                                src={file.url}
                                className="w-full h-96 border rounded-lg"
                                title={file.originalName}
                              />
                            ) : null}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a href={file.url} download={file.originalName}>
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                    
                    {onFileRemove && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFileRemove(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
