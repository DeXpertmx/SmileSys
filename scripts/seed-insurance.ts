
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Sembrando datos de aseguradoras...');

  // Crear aseguradoras de ejemplo
  const insuranceCompanies = [
    {
      name: 'Seguros Universales S.A.',
      code: 'SU001',
      address: 'Av. Reforma 123',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '06600',
      country: 'México',
      phone: '+52 55 1234-5678',
      email: 'contacto@segurosuniversales.com',
      website: 'https://www.segurosuniversales.com',
      contactPerson: 'María García',
      contactPhone: '+52 55 1234-5679',
      contactEmail: 'maria.garcia@segurosuniversales.com',
      coverageTypes: JSON.stringify([
        'Preventivo',
        'Básico',
        'Mayor',
        'Ortodóncia'
      ]),
      copayAmount: 25.00,
      deductible: 50.00,
      maxCoverage: 2000.00,
      billingAddress: 'Av. Reforma 123, Col. Juárez, CDMX 06600',
      taxId: 'SU001234567890',
      paymentTerms: '30 días',
      status: 'Activa',
      notes: 'Aseguradora con amplia cobertura dental, especializada en tratamientos preventivos y básicos.'
    },
    {
      name: 'DentaSecure México',
      code: 'DS001',
      address: 'Calle Insurgentes 456',
      city: 'Guadalajara',
      state: 'Jalisco',
      zipCode: '44100',
      country: 'México',
      phone: '+52 33 9876-5432',
      email: 'info@dentasecure.mx',
      website: 'https://www.dentasecure.mx',
      contactPerson: 'Carlos Rodríguez',
      contactPhone: '+52 33 9876-5433',
      contactEmail: 'carlos.rodriguez@dentasecure.mx',
      coverageTypes: JSON.stringify([
        'Preventivo',
        'Básico',
        'Mayor',
        'Ortodóncia',
        'Cosmético'
      ]),
      copayAmount: 30.00,
      deductible: 75.00,
      maxCoverage: 2500.00,
      billingAddress: 'Calle Insurgentes 456, Col. Centro, Guadalajara, JAL 44100',
      taxId: 'DS001234567890',
      paymentTerms: '15 días',
      status: 'Activa',
      notes: 'Especializada en seguros dentales con cobertura extendida para tratamientos cosméticos.'
    },
    {
      name: 'Protección Oral Plus',
      code: 'POP001',
      address: 'Blvd. Kukulkan 789',
      city: 'Monterrey',
      state: 'Nuevo León',
      zipCode: '64000',
      country: 'México',
      phone: '+52 81 5555-1111',
      email: 'contacto@proteccionoral.com',
      website: 'https://www.proteccionoral.com',
      contactPerson: 'Ana López',
      contactPhone: '+52 81 5555-1112',
      contactEmail: 'ana.lopez@proteccionoral.com',
      coverageTypes: JSON.stringify([
        'Preventivo',
        'Básico',
        'Mayor'
      ]),
      copayAmount: 20.00,
      deductible: 100.00,
      maxCoverage: 1500.00,
      billingAddress: 'Blvd. Kukulkan 789, Col. San Pedro, Monterrey, NL 64000',
      taxId: 'POP001234567890',
      paymentTerms: '30 días',
      status: 'Activa',
      notes: 'Enfoque en tratamientos básicos y preventivos con excelentes tarifas.'
    },
    {
      name: 'SmileGuard Insurance',
      code: 'SG001',
      address: '5th Avenue 1234',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'Estados Unidos',
      phone: '+1 212 555-0100',
      email: 'support@smileguard.com',
      website: 'https://www.smileguard.com',
      contactPerson: 'John Smith',
      contactPhone: '+1 212 555-0101',
      contactEmail: 'john.smith@smileguard.com',
      coverageTypes: JSON.stringify([
        'Preventive',
        'Basic',
        'Major',
        'Orthodontics',
        'Cosmetic'
      ]),
      copayAmount: 35.00,
      deductible: 50.00,
      maxCoverage: 3000.00,
      billingAddress: '5th Avenue 1234, Suite 100, New York, NY 10001',
      taxId: 'SG001234567890',
      paymentTerms: '30 days',
      status: 'Activa',
      notes: 'International insurance company with comprehensive dental coverage for expatriates and locals.'
    },
    {
      name: 'Aseguradoras del Caribe',
      code: 'AC001',
      address: 'Av. Winston Churchill 567',
      city: 'Santo Domingo',
      state: 'Distrito Nacional',
      zipCode: '10108',
      country: 'República Dominicana',
      phone: '+1 809 123-4567',
      email: 'info@aseguradorascaribe.com',
      website: 'https://www.aseguradorascaribe.com',
      contactPerson: 'Roberto Fernández',
      contactPhone: '+1 809 123-4568',
      contactEmail: 'roberto.fernandez@aseguradorascaribe.com',
      coverageTypes: JSON.stringify([
        'Preventivo',
        'Básico',
        'Mayor'
      ]),
      copayAmount: 15.00,
      deductible: 25.00,
      maxCoverage: 1200.00,
      billingAddress: 'Av. Winston Churchill 567, Piantini, Santo Domingo',
      taxId: 'AC001234567890',
      paymentTerms: '45 días',
      status: 'Activa',
      notes: 'Líder en seguros dentales en el Caribe con tarifas competitivas.'
    }
  ];

  // Crear las aseguradoras
  for (const company of insuranceCompanies) {
    try {
      await prisma.insuranceCompany.upsert({
        where: { code: company.code },
        update: company,
        create: company,
      });
      console.log(`✅ Aseguradora creada: ${company.name}`);
    } catch (error) {
      console.error(`❌ Error creando aseguradora ${company.name}:`, error);
    }
  }

  console.log('🎉 Datos de aseguradoras sembrados exitosamente!');
}

main()
  .catch((e) => {
    console.error('Error sembrando datos de aseguradoras:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
