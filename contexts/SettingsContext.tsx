
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ClinicSettings {
  id?: string;
  clinicName: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  currency: string;
  timezone: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  workingHours?: string;
  appointmentDuration: number;
  appointmentBuffer: number;
  maxAdvanceBooking: number;
  appointmentReminders?: string;
  taxRate: number;
  taxId?: string;
  invoicePrefix: string;
  invoiceFooter?: string;
  paymentTerms: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  smtpServer?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  sessionTimeout: number;
  passwordMinLength: number;
  requireTwoFactor: boolean;
  defaultPatientStatus: string;
  autoBackup: boolean;
  backupFrequency: string;
}

interface SettingsContextType {
  settings: ClinicSettings;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<ClinicSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: ClinicSettings = {
  clinicName: "SmileSys Dental Clinic",
  currency: "USD",
  timezone: "America/New_York",
  language: "es",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24",
  appointmentDuration: 30,
  appointmentBuffer: 15,
  maxAdvanceBooking: 90,
  taxRate: 0,
  invoicePrefix: "INV",
  paymentTerms: "Inmediato",
  emailNotifications: true,
  smsNotifications: false,
  whatsappNotifications: false,
  sessionTimeout: 60,
  passwordMinLength: 8,
  requireTwoFactor: false,
  defaultPatientStatus: "Activo",
  autoBackup: true,
  backupFrequency: "diario"
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ClinicSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/settings');
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        throw new Error('Error al cargar configuraciones');
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      // Usar configuraciones por defecto si hay error
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<ClinicSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        throw new Error('Error al actualizar configuraciones');
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      error,
      updateSettings,
      refreshSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Hook para obtener configuración de moneda
export function useCurrencySettings() {
  const { settings } = useSettings();
  return {
    currency: settings.currency,
    formatCurrency: (amount: number) => {
      const locales: { [key: string]: string } = {
        'USD': 'en-US',
        'EUR': 'de-DE',
        'MXN': 'es-MX',
        'COP': 'es-CO',
        'ARS': 'es-AR',
        'CLP': 'es-CL',
        'PEN': 'es-PE',
        'BRL': 'pt-BR'
      };
      
      const locale = locales[settings.currency] || 'en-US';
      
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: settings.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount);
    }
  };
}

// Hook para obtener configuración de fecha/hora
export function useDateTimeSettings() {
  const { settings } = useSettings();
  
  return {
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    timezone: settings.timezone,
    formatDate: (date: Date | string) => {
      const d = new Date(date);
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: settings.timezone
      };
      
      const locale = settings.language === 'es' ? 'es-ES' : 'en-US';
      return new Intl.DateTimeFormat(locale, options).format(d);
    },
    formatTime: (time: string | Date) => {
      if (typeof time === 'string') {
        return time.slice(0, 5); // HH:MM
      }
      
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: settings.timeFormat === '12',
        timeZone: settings.timezone
      };
      
      const locale = settings.language === 'es' ? 'es-ES' : 'en-US';
      return new Intl.DateTimeFormat(locale, options).format(time);
    }
  };
}
