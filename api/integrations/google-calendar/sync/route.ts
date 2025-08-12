
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // En una implementación real, aquí sincronizarías con Google Calendar
    // Por ahora, simulamos la sincronización
    
    // Obtener citas recientes para simular la sincronización
    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
        }
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      take: 10
    });

    // Simular sincronización con Google Calendar
    console.log('Syncing appointments to Google Calendar:', appointments.length);
    
    // En una implementación real, aquí crearías/actualizarías eventos en Google Calendar
    for (const appointment of appointments) {
      console.log(`Syncing appointment: ${appointment.patient.firstName} ${appointment.patient.lastName} - ${appointment.date}`);
      // Aquí iría la lógica real de Google Calendar API
    }

    return NextResponse.json({ 
      message: 'Sincronización completada',
      synced: appointments.length
    });
  } catch (error) {
    console.error('Error syncing with Google Calendar:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar' },
      { status: 500 }
    );
  }
}
