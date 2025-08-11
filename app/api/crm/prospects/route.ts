
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, source, priority, notes } = body;

    // Crear nuevo paciente como prospecto
    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        notes: notes || '',
        status: 'Activo'
      }
    });

    // Crear la información del CRM
    await prisma.crmPatient.create({
      data: {
        patientId: patient.id,
        source,
        priority,
        status: 'prospecto',
        lastContact: new Date(),
        crmNotes: `Prospecto CRM - Fuente: ${source}, Prioridad: ${priority}. ${notes || ''}`.trim()
      }
    });

    // Mapear respuesta en formato CRM
    const crmProspect = {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email || '',
      phone: patient.phone,
      status: 'prospecto' as const,
      source,
      priority,
      lastContact: new Date().toISOString(),
      notes: notes || '',
      createdAt: patient.createdAt.toISOString(),
      updatedAt: patient.updatedAt.toISOString()
    };

    return NextResponse.json(crmProspect);

  } catch (error) {
    console.error('Error al crear prospecto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
