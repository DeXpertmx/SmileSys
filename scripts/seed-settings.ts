
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultWorkingHours = {
  monday: { enabled: true, start: '08:00', end: '17:00', break: { start: '12:00', end: '13:00' } },
  tuesday: { enabled: true, start: '08:00', end: '17:00', break: { start: '12:00', end: '13:00' } },
  wednesday: { enabled: true, start: '08:00', end: '17:00', break: { start: '12:00', end: '13:00' } },
  thursday: { enabled: true, start: '08:00', end: '17:00', break: { start: '12:00', end: '13:00' } },
  friday: { enabled: true, start: '08:00', end: '17:00', break: { start: '12:00', end: '13:00' } },
  saturday: { enabled: true, start: '08:00', end: '14:00', break: null },
  sunday: { enabled: false, start: '08:00', end: '17:00', break: null }
};

const defaultReminders = {
  email: {
    enabled: true,
    beforeDays: [1, 7], // 1 día y 1 semana antes
    template: 'default'
  },
  sms: {
    enabled: false,
    beforeDays: [1],
    template: 'default'
  },
  whatsapp: {
    enabled: false,
    beforeDays: [1],
    template: 'default'
  }
};

async function seedSettings() {
  try {
    // Verificar si ya existen configuraciones
    const existingSettings = await prisma.clinicSettings.findFirst();
    
    if (existingSettings) {
      console.log('✅ Las configuraciones ya existen, omitiendo seed...');
      return;
    }

    // Crear configuraciones por defecto
    const settings = await prisma.clinicSettings.create({
      data: {
        clinicName: "SmileSys Dental Clinic",
        address: "Calle Principal 123",
        city: "Ciudad Ejemplo",
        state: "Estado Ejemplo",
        zipCode: "12345",
        country: "País Ejemplo",
        phone: "+1 (555) 123-4567",
        email: "contacto@smilesys.com",
        website: "https://www.smilesys.com",
        
        // Configuración regional
        currency: "USD",
        timezone: "America/New_York",
        language: "es",
        dateFormat: "DD/MM/YYYY",
        timeFormat: "24",
        
        // Configuración de citas
        workingHours: JSON.stringify(defaultWorkingHours),
        appointmentDuration: 30,
        appointmentBuffer: 15,
        maxAdvanceBooking: 90,
        appointmentReminders: JSON.stringify(defaultReminders),
        
        // Configuración fiscal
        taxRate: 0.0,
        taxId: "RFC123456789",
        invoicePrefix: "INV",
        invoiceFooter: "Gracias por confiar en SmileSys para su salud dental. Para cualquier consulta, no dude en contactarnos.",
        paymentTerms: "Inmediato",
        
        // Configuración de notificaciones
        emailNotifications: true,
        smsNotifications: false,
        whatsappNotifications: false,
        smtpServer: "smtp.gmail.com",
        smtpPort: 587,
        smtpUsername: "",
        smtpPassword: "",
        
        // Configuración de seguridad
        sessionTimeout: 60,
        passwordMinLength: 8,
        requireTwoFactor: false,
        
        // Configuración del sistema
        defaultPatientStatus: "Activo",
        autoBackup: true,
        backupFrequency: "diario"
      }
    });

    console.log('✅ Configuraciones por defecto creadas exitosamente:');
    console.log(`   - Clínica: ${settings.clinicName}`);
    console.log(`   - Moneda: ${settings.currency}`);
    console.log(`   - Idioma: ${settings.language}`);
    console.log(`   - Zona horaria: ${settings.timezone}`);
    
  } catch (error) {
    console.error('❌ Error al crear configuraciones por defecto:', error);
    throw error;
  }
}

export default seedSettings;

// Si se ejecuta directamente
if (require.main === module) {
  seedSettings()
    .then(() => {
      console.log('🎉 Seed de configuraciones completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en el seed de configuraciones:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
