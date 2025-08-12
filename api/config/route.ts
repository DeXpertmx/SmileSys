

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let settings = await prisma.clinicSettings.findFirst();
    
    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.clinicSettings.create({
        data: {
          clinicName: 'SmileSys Dental Clinic',
          currency: 'USD',
          timezone: 'America/Bogota',
          language: 'es',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24',
          appointmentDuration: 30,
          appointmentBuffer: 15,
          maxAdvanceBooking: 90,
          taxRate: 0,
          invoicePrefix: 'INV',
          paymentTerms: 'Inmediato',
          emailNotifications: true,
          smsNotifications: false,
          whatsappNotifications: false,
          sessionTimeout: 60,
          passwordMinLength: 8,
          requireTwoFactor: false,
          defaultPatientStatus: 'Activo',
          autoBackup: true,
          backupFrequency: 'diario'
        }
      });
    }

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'Administrador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();

    let settings = await prisma.clinicSettings.findFirst();

    if (!settings) {
      // Create if doesn't exist
      settings = await prisma.clinicSettings.create({
        data
      });
    } else {
      // Update existing
      settings = await prisma.clinicSettings.update({
        where: { id: settings.id },
        data
      });
    }

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

