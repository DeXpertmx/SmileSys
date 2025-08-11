
'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

// Numeración dental universal (1-32)
const DIENTES_ADULTO = [
  // Maxilar superior (derecho a izquierdo)
  { numero: 1, posicion: 'superior-derecho', tipo: 'molar' },
  { numero: 2, posicion: 'superior-derecho', tipo: 'molar' },
  { numero: 3, posicion: 'superior-derecho', tipo: 'molar' },
  { numero: 4, posicion: 'superior-derecho', tipo: 'premolar' },
  { numero: 5, posicion: 'superior-derecho', tipo: 'premolar' },
  { numero: 6, posicion: 'superior-derecho', tipo: 'canino' },
  { numero: 7, posicion: 'superior-derecho', tipo: 'incisivo' },
  { numero: 8, posicion: 'superior-derecho', tipo: 'incisivo' },
  { numero: 9, posicion: 'superior-izquierdo', tipo: 'incisivo' },
  { numero: 10, posicion: 'superior-izquierdo', tipo: 'incisivo' },
  { numero: 11, posicion: 'superior-izquierdo', tipo: 'canino' },
  { numero: 12, posicion: 'superior-izquierdo', tipo: 'premolar' },
  { numero: 13, posicion: 'superior-izquierdo', tipo: 'premolar' },
  { numero: 14, posicion: 'superior-izquierdo', tipo: 'molar' },
  { numero: 15, posicion: 'superior-izquierdo', tipo: 'molar' },
  { numero: 16, posicion: 'superior-izquierdo', tipo: 'molar' },
  // Maxilar inferior (izquierdo a derecho)
  { numero: 17, posicion: 'inferior-izquierdo', tipo: 'molar' },
  { numero: 18, posicion: 'inferior-izquierdo', tipo: 'molar' },
  { numero: 19, posicion: 'inferior-izquierdo', tipo: 'molar' },
  { numero: 20, posicion: 'inferior-izquierdo', tipo: 'premolar' },
  { numero: 21, posicion: 'inferior-izquierdo', tipo: 'premolar' },
  { numero: 22, posicion: 'inferior-izquierdo', tipo: 'canino' },
  { numero: 23, posicion: 'inferior-izquierdo', tipo: 'incisivo' },
  { numero: 24, posicion: 'inferior-izquierdo', tipo: 'incisivo' },
  { numero: 25, posicion: 'inferior-derecho', tipo: 'incisivo' },
  { numero: 26, posicion: 'inferior-derecho', tipo: 'incisivo' },
  { numero: 27, posicion: 'inferior-derecho', tipo: 'canino' },
  { numero: 28, posicion: 'inferior-derecho', tipo: 'premolar' },
  { numero: 29, posicion: 'inferior-derecho', tipo: 'premolar' },
  { numero: 30, posicion: 'inferior-derecho', tipo: 'molar' },
  { numero: 31, posicion: 'inferior-derecho', tipo: 'molar' },
  { numero: 32, posicion: 'inferior-derecho', tipo: 'molar' },
];

// Estados posibles de cada cara del diente
type EstadoCara = 'sano' | 'caries' | 'amalgama' | 'resina' | 'corona' | 'endodoncia' | 'extraccion' | 'implante';

// Tipos de tratamiento sugeridos basados en el estado
const TRATAMIENTOS_SUGERIDOS: Record<EstadoCara, string[]> = {
  sano: ['Limpieza preventiva', 'Selladores de fosetas'],
  caries: ['Obturación simple', 'Obturación compuesta', 'Incrustación'],
  amalgama: ['Reemplazo de amalgama', 'Pulido de amalgama'],
  resina: ['Pulido de resina', 'Reemplazo de resina'],
  corona: ['Revisión de corona', 'Reemplazo de corona'],
  endodoncia: ['Revisión endodóntica', 'Retratamiento endodóntico'],
  extraccion: ['Implante dental', 'Prótesis parcial'],
  implante: ['Mantenimiento de implante', 'Revisión de implante']
};

// Colores para cada estado
const COLORES_ESTADOS: Record<EstadoCara, string> = {
  sano: '#ffffff',
  caries: '#8B0000',
  amalgama: '#708090', 
  resina: '#F5F5DC',
  corona: '#FFD700',
  endodoncia: '#FF69B4',
  extraccion: '#FF0000',
  implante: '#4169E1'
};

interface CaraDiente {
  vestibular: EstadoCara;
  lingual: EstadoCara;
  mesial: EstadoCara;
  distal: EstadoCara;
  oclusal: EstadoCara;
}

interface DienteData {
  numero: number;
  caras: CaraDiente;
  notas?: string;
}

interface TratamientoDiente {
  numero: number;
  cara: keyof CaraDiente;
  estadoActual: EstadoCara;
  tratamientoSugerido?: string;
}

interface OdontogramaProps {
  pacienteId?: string;
  datos?: DienteData[];
  onDienteChange?: (numero: number, caras: CaraDiente) => void;
  onCrearTratamiento?: (tratamiento: TratamientoDiente) => void;
  readonly?: boolean;
}

const CaraDienteComponent: React.FC<{
  cara: EstadoCara;
  posicion: 'vestibular' | 'lingual' | 'mesial' | 'distal' | 'oclusal';
  onClick?: () => void;
  onDoubleClick?: () => void;
  readonly?: boolean;
}> = ({ cara, posicion, onClick, onDoubleClick, readonly = false }) => {
  const getCaraStyles = () => {
    const baseStyles = "cursor-pointer border border-gray-300 transition-all hover:border-gray-500";
    
    switch (posicion) {
      case 'vestibular':
        return `${baseStyles} w-6 h-3 rounded-t-md`;
      case 'lingual':
        return `${baseStyles} w-6 h-3 rounded-b-md`;
      case 'mesial':
        return `${baseStyles} w-2 h-6 rounded-l-md`;
      case 'distal':
        return `${baseStyles} w-2 h-6 rounded-r-md`;
      case 'oclusal':
        return `${baseStyles} w-4 h-4 rounded-sm`;
      default:
        return baseStyles;
    }
  };

  return (
    <div
      className={cn(getCaraStyles(), readonly && "cursor-default hover:border-gray-300")}
      style={{ backgroundColor: COLORES_ESTADOS[cara] }}
      onClick={readonly ? undefined : onClick}
      onDoubleClick={readonly ? undefined : onDoubleClick}
      title={`${posicion}: ${cara}${cara !== 'sano' ? ' - Doble clic para crear tratamiento' : ''}`}
    />
  );
};

const DienteComponent: React.FC<{
  diente: { numero: number; posicion: string; tipo: string };
  data: DienteData;
  onCaraChange: (cara: keyof CaraDiente, nuevoEstado: EstadoCara) => void;
  onCrearTratamiento?: (tratamiento: TratamientoDiente) => void;
  readonly?: boolean;
}> = ({ diente, data, onCaraChange, onCrearTratamiento, readonly = false }) => {
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoCara>('sano');

  const handleCaraClick = (cara: keyof CaraDiente) => {
    if (readonly) return;
    onCaraChange(cara, estadoSeleccionado);
  };

  const handleCaraDoubleClick = (cara: keyof CaraDiente) => {
    if (readonly || !onCrearTratamiento) return;
    const estadoActual = data.caras[cara];
    if (estadoActual !== 'sano') {
      onCrearTratamiento({
        numero: diente.numero,
        cara,
        estadoActual,
        tratamientoSugerido: TRATAMIENTOS_SUGERIDOS[estadoActual][0]
      });
    }
  };

  return (
    <div className="flex flex-col items-center p-2 border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Número del diente */}
      <div className="text-xs font-bold mb-1 text-gray-700">{diente.numero}</div>
      
      {/* Representación del diente con 5 caras */}
      <div className="relative flex flex-col items-center">
        {/* Cara vestibular (superior) */}
        <CaraDienteComponent
          cara={data.caras.vestibular}
          posicion="vestibular"
          onClick={() => handleCaraClick('vestibular')}
          onDoubleClick={() => handleCaraDoubleClick('vestibular')}
          readonly={readonly}
        />
        
        <div className="flex items-center">
          {/* Cara mesial (izquierda) */}
          <CaraDienteComponent
            cara={data.caras.mesial}
            posicion="mesial"
            onClick={() => handleCaraClick('mesial')}
            onDoubleClick={() => handleCaraDoubleClick('mesial')}
            readonly={readonly}
          />
          
          {/* Cara oclusal (centro) */}
          <CaraDienteComponent
            cara={data.caras.oclusal}
            posicion="oclusal"
            onClick={() => handleCaraClick('oclusal')}
            onDoubleClick={() => handleCaraDoubleClick('oclusal')}
            readonly={readonly}
          />
          
          {/* Cara distal (derecha) */}
          <CaraDienteComponent
            cara={data.caras.distal}
            posicion="distal"
            onClick={() => handleCaraClick('distal')}
            onDoubleClick={() => handleCaraDoubleClick('distal')}
            readonly={readonly}
          />
        </div>
        
        {/* Cara lingual (inferior) */}
        <CaraDienteComponent
          cara={data.caras.lingual}
          posicion="lingual"
          onClick={() => handleCaraClick('lingual')}
          onDoubleClick={() => handleCaraDoubleClick('lingual')}
          readonly={readonly}
        />
      </div>

      {/* Selector de estado (solo en modo edición) */}
      {!readonly && (
        <select
          className="mt-2 text-xs border border-gray-300 rounded px-1 py-0.5"
          value={estadoSeleccionado}
          onChange={(e) => setEstadoSeleccionado(e.target.value as EstadoCara)}
        >
          <option value="sano">Sano</option>
          <option value="caries">Caries</option>
          <option value="amalgama">Amalgama</option>
          <option value="resina">Resina</option>
          <option value="corona">Corona</option>
          <option value="endodoncia">Endodoncia</option>
          <option value="extraccion">Extracción</option>
          <option value="implante">Implante</option>
        </select>
      )}
    </div>
  );
};

export const Odontograma: React.FC<OdontogramaProps> = ({
  pacienteId,
  datos = [],
  onDienteChange,
  onCrearTratamiento,
  readonly = false
}) => {
  // Inicializar datos de dientes si no se proporcionan
  const [datosOdontograma, setDatosOdontograma] = useState<DienteData[]>(() => {
    const datosIniciales: DienteData[] = [];
    DIENTES_ADULTO.forEach(diente => {
      const datoExistente = datos.find(d => d.numero === diente.numero);
      datosIniciales.push(datoExistente || {
        numero: diente.numero,
        caras: {
          vestibular: 'sano',
          lingual: 'sano',
          mesial: 'sano',
          distal: 'sano',
          oclusal: 'sano'
        }
      });
    });
    return datosIniciales;
  });

  const handleCaraChange = (numeroDiente: number, cara: keyof CaraDiente, nuevoEstado: EstadoCara) => {
    const nuevaData = datosOdontograma.map(diente => {
      if (diente.numero === numeroDiente) {
        const nuevasCaras = { ...diente.caras, [cara]: nuevoEstado };
        onDienteChange?.(numeroDiente, nuevasCaras);
        return { ...diente, caras: nuevasCaras };
      }
      return diente;
    });
    setDatosOdontograma(nuevaData);
  };

  const getDatosDiente = (numero: number): DienteData => {
    return datosOdontograma.find(d => d.numero === numero) || {
      numero,
      caras: {
        vestibular: 'sano',
        lingual: 'sano',
        mesial: 'sano',
        distal: 'sano',
        oclusal: 'sano'
      }
    };
  };

  // Dividir dientes en cuadrantes
  const maxilarSuperior = DIENTES_ADULTO.slice(0, 16);
  const maxilarInferior = DIENTES_ADULTO.slice(16, 32);

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="space-y-8">
        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 justify-center mb-6 p-4 bg-gray-50 rounded-lg">
          {Object.entries(COLORES_ESTADOS).map(([estado, color]) => (
            <div key={estado} className="flex items-center gap-2">
              <div
                className="w-4 h-4 border border-gray-300 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm capitalize">{estado}</span>
            </div>
          ))}
        </div>

        {/* Maxilar Superior */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-center text-gray-700">Maxilar Superior</h3>
          <div className="grid grid-cols-8 gap-2 justify-items-center">
            {maxilarSuperior.map(diente => (
              <DienteComponent
                key={diente.numero}
                diente={diente}
                data={getDatosDiente(diente.numero)}
                onCaraChange={(cara, estado) => handleCaraChange(diente.numero, cara, estado)}
                onCrearTratamiento={onCrearTratamiento}
                readonly={readonly}
              />
            ))}
          </div>
        </div>

        {/* Maxilar Inferior */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-center text-gray-700">Maxilar Inferior</h3>
          <div className="grid grid-cols-8 gap-2 justify-items-center">
            {maxilarInferior.reverse().map(diente => (
              <DienteComponent
                key={diente.numero}
                diente={diente}
                data={getDatosDiente(diente.numero)}
                onCaraChange={(cara, estado) => handleCaraChange(diente.numero, cara, estado)}
                onCrearTratamiento={onCrearTratamiento}
                readonly={readonly}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export type { EstadoCara, CaraDiente, DienteData, TratamientoDiente };
export { TRATAMIENTOS_SUGERIDOS };
