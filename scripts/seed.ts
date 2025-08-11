
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes (opcional - solo para development)
  console.log('🧹 Limpiando datos existentes...');
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinicSettings.deleteMany();

  // 1. Crear usuarios del sistema
  console.log('👥 Creando usuarios...');
  
  const hashedPassword = await bcrypt.hash('johndoe123', 12);
  const adminPassword = await bcrypt.hash('admin123', 12);
  const recepPassword = await bcrypt.hash('recep123', 12);

  const testUser = await prisma.user.create({
    data: {
      email: 'john@doe.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      role: 'Administrador',
      phone: '555-0123',
    }
  });

  const doctorUser = await prisma.user.create({
    data: {
      email: 'dra.martinez@smilesys.com',
      password: adminPassword,
      firstName: 'Ana',
      lastName: 'Martínez',
      name: 'Dra. Ana Martínez',
      role: 'Dentista',
      phone: '555-0456',
      specialization: 'Odontología General'
    }
  });

  const recepUser = await prisma.user.create({
    data: {
      email: 'recepcion@smilesys.com',
      password: recepPassword,
      firstName: 'María',
      lastName: 'González',
      name: 'María González',
      role: 'Recepcionista',
      phone: '555-0789'
    }
  });

  // 2. Crear pacientes
  console.log('🦷 Creando pacientes...');
  
  const patients = await prisma.$transaction([
    prisma.patient.create({
      data: {
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        email: 'carlos.rodriguez@email.com',
        phone: '555-1001',
        address: 'Calle Principal 123',
        city: 'Madrid',
        birthDate: new Date('1985-03-15'),
        gender: 'Masculino',
        occupation: 'Ingeniero',
        emergencyContact: 'Laura Rodríguez',
        emergencyPhone: '555-1002',
        bloodType: 'O+',
        allergies: 'Penicilina',
        medicalHistory: 'Hipertensión controlada',
        insuranceInfo: 'Seguro Dental Plus',
        status: 'Activo'
      }
    }),
    prisma.patient.create({
      data: {
        firstName: 'Elena',
        lastName: 'Jiménez',
        email: 'elena.jimenez@email.com',
        phone: '555-1003',
        address: 'Avenida del Sol 456',
        city: 'Barcelona',
        birthDate: new Date('1990-07-22'),
        gender: 'Femenino',
        occupation: 'Profesora',
        emergencyContact: 'Miguel Jiménez',
        emergencyPhone: '555-1004',
        bloodType: 'A+',
        allergies: 'Latex',
        medicalHistory: 'Sin antecedentes relevantes',
        insuranceInfo: 'Seguro Nacional',
        status: 'Activo'
      }
    }),
    prisma.patient.create({
      data: {
        firstName: 'Roberto',
        lastName: 'Fernández',
        email: 'roberto.fernandez@email.com',
        phone: '555-1005',
        address: 'Plaza Mayor 789',
        city: 'Valencia',
        birthDate: new Date('1978-12-03'),
        gender: 'Masculino',
        occupation: 'Contador',
        emergencyContact: 'Carmen Fernández',
        emergencyPhone: '555-1006',
        bloodType: 'B-',
        allergies: 'Ninguna conocida',
        medicalHistory: 'Diabetes tipo 2',
        insuranceInfo: 'Seguros Unidos',
        status: 'Activo'
      }
    }),
    prisma.patient.create({
      data: {
        firstName: 'Isabel',
        lastName: 'García',
        email: 'isabel.garcia@email.com',
        phone: '555-1007',
        address: 'Calle de la Rosa 321',
        city: 'Sevilla',
        birthDate: new Date('1995-05-18'),
        gender: 'Femenino',
        occupation: 'Diseñadora',
        emergencyContact: 'José García',
        emergencyPhone: '555-1008',
        bloodType: 'AB+',
        allergies: 'Polen, ácaros',
        medicalHistory: 'Asma leve',
        insuranceInfo: 'Seguro Premium',
        status: 'Activo'
      }
    }),
    prisma.patient.create({
      data: {
        firstName: 'Fernando',
        lastName: 'López',
        email: 'fernando.lopez@email.com',
        phone: '555-1009',
        address: 'Paseo del Río 654',
        city: 'Bilbao',
        birthDate: new Date('1982-09-10'),
        gender: 'Masculino',
        occupation: 'Médico',
        emergencyContact: 'Ana López',
        emergencyPhone: '555-1010',
        bloodType: 'O-',
        allergies: 'Ninguna conocida',
        medicalHistory: 'Sin antecedentes relevantes',
        insuranceInfo: 'Colegio Médico',
        status: 'Activo'
      }
    })
  ]);

  // 3. Crear citas
  console.log('📅 Creando citas...');
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const appointments = await prisma.$transaction([
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        doctorId: doctorUser.id,
        date: today,
        startTime: '09:00',
        endTime: '09:30',
        type: 'Consulta General',
        reason: 'Revisión rutinaria',
        status: 'Completada',
        notes: 'Paciente en buen estado general',
        duration: 30
      }
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        doctorId: doctorUser.id,
        date: today,
        startTime: '10:00',
        endTime: '10:45',
        type: 'Limpieza Dental',
        reason: 'Limpieza preventiva',
        status: 'Programada',
        notes: 'Primera visita del paciente',
        duration: 45
      }
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        doctorId: doctorUser.id,
        date: tomorrow,
        startTime: '14:00',
        endTime: '15:00',
        type: 'Tratamiento',
        reason: 'Empaste dental',
        status: 'Programada',
        notes: 'Caries en molar superior derecho',
        duration: 60
      }
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[3].id,
        doctorId: doctorUser.id,
        date: nextWeek,
        startTime: '11:00',
        endTime: '11:30',
        type: 'Revisión',
        reason: 'Seguimiento post-tratamiento',
        status: 'Programada',
        notes: 'Control de evolución',
        duration: 30
      }
    })
  ]);

  // 4. Crear tratamientos
  console.log('🦷 Creando tratamientos...');
  
  const treatments = await prisma.$transaction([
    prisma.treatment.create({
      data: {
        patientId: patients[0].id,
        appointmentId: appointments[0].id,
        doctorId: doctorUser.id,
        name: 'Limpieza Dental Profesional',
        category: 'Preventivo',
        description: 'Limpieza completa con ultrasonido',
        diagnosis: 'Gingivitis leve',
        procedure: 'Scaling y pulido dental',
        medications: 'Enjuague bucal antiséptico',
        instructions: 'Cepillado 3 veces al día, uso de hilo dental',
        cost: 80.00,
        status: 'Completado',
        startDate: today,
        completedDate: today,
        notes: 'Tratamiento completado satisfactoriamente'
      }
    }),
    prisma.treatment.create({
      data: {
        patientId: patients[2].id,
        appointmentId: appointments[2].id,
        doctorId: doctorUser.id,
        name: 'Empaste Composite',
        category: 'Restaurativo',
        description: 'Restauración con composite en molar',
        diagnosis: 'Caries profunda en pieza 16',
        procedure: 'Remoción de caries y colocación de composite',
        medications: 'Anestesia local',
        instructions: 'Evitar alimentos duros por 24 horas',
        cost: 120.00,
        status: 'Planificado',
        startDate: tomorrow,
        notes: 'Paciente sin alergias a anestesia'
      }
    }),
    prisma.treatment.create({
      data: {
        patientId: patients[1].id,
        doctorId: doctorUser.id,
        name: 'Blanqueamiento Dental',
        category: 'Estético',
        description: 'Blanqueamiento profesional en consulta',
        diagnosis: 'Dientes manchados por café',
        procedure: 'Aplicación de gel blanqueador con luz LED',
        instructions: 'Evitar alimentos que manchen por 48 horas',
        cost: 200.00,
        status: 'En Progreso',
        startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // hace una semana
        notes: 'Segunda sesión programada'
      }
    })
  ]);

  // 5. Crear facturas
  console.log('💰 Creando facturas...');
  
  const invoice1 = await prisma.invoice.create({
    data: {
      patientId: patients[0].id,
      userId: recepUser.id,
      subtotal: 80.00,
      tax: 16.80,
      discount: 0,
      total: 96.80,
      status: 'Pagada',
      issueDate: today,
      paidDate: today,
      notes: 'Pago en efectivo'
    }
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      patientId: patients[1].id,
      userId: recepUser.id,
      subtotal: 200.00,
      tax: 42.00,
      discount: 20.00,
      total: 222.00,
      status: 'Pendiente',
      issueDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
      notes: 'Descuento por fidelidad aplicado'
    }
  });

  // 6. Crear items de factura
  console.log('📋 Creando items de factura...');
  
  await prisma.$transaction([
    prisma.invoiceItem.create({
      data: {
        invoiceId: invoice1.id,
        treatmentId: treatments[0].id,
        description: 'Limpieza Dental Profesional',
        quantity: 1,
        unitPrice: 80.00,
        total: 80.00
      }
    }),
    prisma.invoiceItem.create({
      data: {
        invoiceId: invoice2.id,
        treatmentId: treatments[2].id,
        description: 'Blanqueamiento Dental',
        quantity: 1,
        unitPrice: 200.00,
        total: 200.00
      }
    })
  ]);

  // 7. Crear pagos
  console.log('💳 Creando pagos...');
  
  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      amount: 96.80,
      method: 'Efectivo',
      notes: 'Pago completo en efectivo',
      paymentDate: today
    }
  });

  // 8. Crear configuración de la clínica
  console.log('⚙️ Creando configuración de la clínica...');
  
  await prisma.clinicSettings.create({
    data: {
      clinicName: 'SmileSys Dental Clinic',
      address: 'Avenida de la Salud 123, Madrid',
      phone: '91 123 4567',
      email: 'info@smilesys.com',
      website: 'www.smilesys.com',
      workingHours: JSON.stringify({
        monday: { start: '09:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' },
        wednesday: { start: '09:00', end: '18:00' },
        thursday: { start: '09:00', end: '18:00' },
        friday: { start: '09:00', end: '16:00' },
        saturday: { start: '10:00', end: '14:00' },
        sunday: { closed: true }
      }),
      appointmentDuration: 30,
      taxRate: 21.00,
      currency: 'EUR'
    }
  });

  // Crear plantillas de recetas por defecto
  const prescriptionTemplates = [
    {
      name: "Extracción Simple",
      category: "Cirugía Oral",
      description: "Plantilla estándar para extracciones simples",
      medications: JSON.stringify([
        {
          name: "Ibuprofeno",
          dosage: "400mg",
          frequency: "Cada 8 horas",
          duration: "5 días",
          instructions: "Tomar con alimentos"
        },
        {
          name: "Paracetamol",
          dosage: "500mg",
          frequency: "Cada 6 horas",
          duration: "3 días",
          instructions: "Si persiste el dolor"
        }
      ]),
      instructions: "Aplicar hielo por 20 minutos cada 2 horas las primeras 24 horas. No enjuagarse vigorosamente. Dieta blanda los primeros días.",
      isActive: true,
      isDefault: true
    },
    {
      name: "Endodoncia",
      category: "Endodoncia", 
      description: "Tratamiento post-endodoncia",
      medications: JSON.stringify([
        {
          name: "Amoxicilina",
          dosage: "500mg",
          frequency: "Cada 8 horas",
          duration: "7 días",
          instructions: "Completar todo el tratamiento"
        },
        {
          name: "Ibuprofeno",
          dosage: "600mg",
          frequency: "Cada 8 horas",
          duration: "3 días",
          instructions: "Con alimentos"
        }
      ]),
      instructions: "Evitar masticar del lado tratado hasta la cita de control. Mantener higiene oral adecuada.",
      isActive: true,
      isDefault: true
    },
    {
      name: "Limpieza Dental",
      category: "Preventivo",
      description: "Post-profilaxis dental",
      medications: JSON.stringify([
        {
          name: "Enjuague bucal con flúor",
          dosage: "15ml",
          frequency: "2 veces al día",
          duration: "30 días",
          instructions: "Después del cepillado, no enjuagar con agua"
        }
      ]),
      instructions: "Cepillar dientes 3 veces al día con pasta dental con flúor. Usar hilo dental diariamente. Control en 6 meses.",
      isActive: true,
      isDefault: false
    }
  ];

  // Crear plantillas solo si no existen
  const existingTemplatesCount = await prisma.prescriptionTemplate.count();
  if (existingTemplatesCount === 0) {
    await prisma.prescriptionTemplate.createMany({
      data: prescriptionTemplates
    });
  }

  console.log('✅ Seed completado exitosamente!');
  console.log('📊 Datos creados:');
  console.log(`   👥 Usuarios: ${await prisma.user.count()}`);
  console.log(`   🦷 Pacientes: ${await prisma.patient.count()}`);
  console.log(`   📅 Citas: ${await prisma.appointment.count()}`);
  console.log(`   💊 Tratamientos: ${await prisma.treatment.count()}`);
  console.log(`   💰 Facturas: ${await prisma.invoice.count()}`);
  console.log(`   💳 Pagos: ${await prisma.payment.count()}`);
  console.log(`   📋 Plantillas de recetas: ${await prisma.prescriptionTemplate.count()}`);
  
  console.log('\n🔐 Credenciales de prueba:');
  console.log('   Admin: john@doe.com / johndoe123');
  console.log('   Doctora: dra.martinez@smilesys.com / admin123');
  console.log('   Recepcionista: recepcion@smilesys.com / recep123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
