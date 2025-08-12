
'use client';

import { useState, useEffect } from 'react';

interface Configuration {
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  timeFormat: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  timezone: string;
  language: string;
}

const DEFAULT_CONFIG: Configuration = {
  currency: 'EUR',
  currencySymbol: '€',
  dateFormat: 'dd/MM/yyyy',
  timeFormat: '24h',
  clinicName: 'SmileSys Dental Clinic',
  clinicAddress: '',
  clinicPhone: '',
  clinicEmail: '',
  timezone: 'Europe/Madrid',
  language: 'es',
};

export function useConfiguration() {
  const [config, setConfig] = useState<Configuration>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    try {
      const response = await fetch('/api/configuration');
      if (response.ok) {
        const data = await response.json();
        setConfig(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Error fetching configuration:', err);
      setError('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | string | null | undefined): string => {
    // Convertir a número y manejar valores nulos o indefinidos
    const numValue = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    
    // Verificar que es un número válido
    const validNumber = !isNaN(numValue) ? numValue : 0;
    
    return `${config.currencySymbol}${validNumber.toFixed(2)}`;
  };

  const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (config.dateFormat === 'dd/MM/yyyy') {
      return dateObj.toLocaleDateString('es-ES');
    } else if (config.dateFormat === 'MM/dd/yyyy') {
      return dateObj.toLocaleDateString('en-US');
    } else {
      return dateObj.toISOString().split('T')[0];
    }
  };

  const formatTime = (time: string): string => {
    if (config.timeFormat === '12h') {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    return time;
  };

  return {
    config,
    loading,
    error,
    formatCurrency,
    formatDate,
    formatTime,
    refresh: fetchConfiguration,
  };
}
