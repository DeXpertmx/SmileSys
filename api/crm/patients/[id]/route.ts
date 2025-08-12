
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    // Actualizar o crear la información del CRM
    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: { crmInfo: true }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    if (patient.crmInfo) {
      // Actualizar CRM existente
      await prisma.crmPatient.update({
        where: { patientId: params.id },
        data: {
          status,
          lastContact: new Date(),
          crmNotes: body.notes || patient.crmInfo.crmNotes,
          updatedAt: new Date()
        }
      });
    } else {
      // Crear nueva entrada CRM
      await prisma.crmPatient.create({
        data: {
          patientId: params.id,
          status,
          source: 'manual', // Por defecto
          priority: 'media',
          lastContact: new Date(),
          crmNotes: body.notes || ''
        }
      });
    }

    // Actualizar paciente
    const updatedPatient = await prisma.patient.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
      include: { crmInfo: true }
    });

    // Mapear respuesta en formato CRM
    const crmPatient = {
      id: updatedPatient.id,
      firstName: updatedPatient.firstName,
      lastName: updatedPatient.lastName,
      email: updatedPatient.email || '',
      phone: updatedPatient.phone,
      status: updatedPatient.crmInfo?.status || status,
      source: updatedPatient.crmInfo?.source || 'manual',
      priority: updatedPatient.crmInfo?.priority || 'media' as const,
      lastContact: updatedPatient.crmInfo?.lastContact.toISOString() || updatedPatient.updatedAt.toISOString(),
      notes: updatedPatient.crmInfo?.crmNotes || updatedPatient.notes || '',
      createdAt: updatedPatient.createdAt.toISOString(),
      updatedAt: updatedPatient.updatedAt.toISOString()
    };

    return NextResponse.json(crmPatient);

  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
