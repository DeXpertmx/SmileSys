
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener pacientes con información de CRM
    const patients = await prisma.patient.findMany({
      include: {
        treatments: {
          where: { status: { in: ['En Progreso', 'Completado'] } }
        },
        appointments: {
          orderBy: { date: 'desc' },
          take: 1
        },
        crmInfo: true
      }
    });

    // Mapear a formato CRM
    const crmPatients = patients.map(patient => {
      const completedTreatments = patient.treatments.filter(t => t.status === 'Completado').length;
      const totalTreatments = patient.treatments.length;
      
      // Usar información del CRM si existe, sino determinar por reglas de negocio
      let status = patient.crmInfo?.status || 'prospecto';
      let source = patient.crmInfo?.source || 'walk_in';
      let priority = patient.crmInfo?.priority || 'media';
      
      if (!patient.crmInfo) {
        // Determinar estado del paciente en el pipeline
        if (patient.appointments.length > 0) {
          status = 'consultado';
        }
        
        if (patient.treatments.some(t => t.status === 'En Progreso')) {
          status = 'en_tratamiento';
        }
        
        if (totalTreatments > 0 && completedTreatments === totalTreatments) {
          status = 'completado';
        }
      }

      const treatmentProgress = totalTreatments > 0 ? (completedTreatments / totalTreatments) * 100 : 0;

      return {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email || '',
        phone: patient.phone,
        status,
        source,
        priority: priority as 'alta' | 'media' | 'baja',
        lastContact: patient.crmInfo?.lastContact.toISOString() || patient.updatedAt.toISOString(),
        notes: patient.crmInfo?.crmNotes || patient.notes || '',
        treatmentProgress,
        createdAt: patient.createdAt.toISOString(),
        updatedAt: patient.updatedAt.toISOString()
      };
    });

    return NextResponse.json(crmPatients);

  } catch (error) {
    console.error('Error al obtener pacientes CRM:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
