
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar configuraciones existentes
    let settings = await prisma.clinicSettings.findFirst();
    
    // Si no existen configuraciones, crear una por defecto
    if (!settings) {
      settings = await prisma.clinicSettings.create({
        data: {
          clinicName: "SmileSys Dental Clinic",
          currency: "USD",
          language: "es",
          timezone: "America/New_York",
          appointmentDuration: 30,
          appointmentBuffer: 15,
          taxRate: 0,
          emailNotifications: true,
          smsNotifications: false,
          whatsappNotifications: false,
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error al obtener configuraciones:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo administradores pueden cambiar configuraciones
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    });

    if (user?.role !== 'Administrador') {
      return NextResponse.json({ error: 'No tienes permisos para cambiar configuraciones' }, { status: 403 });
    }

    const data = await request.json();

    // Buscar configuraciones existentes
    let settings = await prisma.clinicSettings.findFirst();
    
    if (settings) {
      // Actualizar configuraciones existentes
      settings = await prisma.clinicSettings.update({
        where: { id: settings.id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
    } else {
      // Crear nuevas configuraciones
      settings = await prisma.clinicSettings.create({
        data: data
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error al actualizar configuraciones:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
