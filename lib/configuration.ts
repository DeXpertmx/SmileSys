
// Configuration management utilities

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

let cachedConfig: Configuration | null = null;

export async function getConfiguration(): Promise<Configuration> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch('/api/configuration');
    if (response.ok) {
      const config = await response.json();
      const mergedConfig = { ...DEFAULT_CONFIG, ...config };
      cachedConfig = mergedConfig;
      return mergedConfig;
    }
  } catch (error) {
    console.error('Error fetching configuration:', error);
  }

  cachedConfig = DEFAULT_CONFIG;
  return DEFAULT_CONFIG;
}

export function clearConfigurationCache() {
  cachedConfig = null;
}

export async function updateConfiguration(updates: Partial<Configuration>): Promise<boolean> {
  try {
    const response = await fetch('/api/configuration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (response.ok) {
      clearConfigurationCache();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating configuration:', error);
    return false;
  }
}

export function formatCurrency(amount: number, config?: Configuration): string {
  const cfg = config || DEFAULT_CONFIG;
  return `${cfg.currencySymbol}${amount.toFixed(2)}`;
}

export function formatDate(date: string | Date, config?: Configuration): string {
  const cfg = config || DEFAULT_CONFIG;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (cfg.dateFormat === 'dd/MM/yyyy') {
    return dateObj.toLocaleDateString('es-ES');
  }
  
  return dateObj.toLocaleDateString();
}
