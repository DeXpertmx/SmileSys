
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Obtener tratamientos periodontales
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const periodontogramId = searchParams.get('periodontogramId');

    let where = {};
    if (patientId) {
      where = { ...where, patientId };
    }
    if (periodontogramId) {
      where = { ...where, periodontogramId };
    }

    const treatments = await prisma.periodontalTreatment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            numeroExpediente: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(treatments);
  } catch (error) {
    console.error('Error al obtener tratamientos periodontales:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear tratamiento periodontal
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      periodontogramId,
      patientId,
      treatmentType,
      description,
      teethInvolved,
      plannedDate,
      estimatedDuration,
      sessions,
      estimatedCost,
      preInstructions,
      postInstructions,
      notes
    } = body;

    const treatment = await prisma.periodontalTreatment.create({
      data: {
        periodontogramId,
        patientId,
        doctorId: session.user.id,
        treatmentType,
        description,
        teethInvolved: JSON.stringify(teethInvolved),
        plannedDate: plannedDate ? new Date(plannedDate) : null,
        estimatedDuration,
        sessions: sessions || 1,
        estimatedCost,
        preInstructions,
        postInstructions,
        notes
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            numeroExpediente: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json(treatment, { status: 201 });
  } catch (error) {
    console.error('Error al crear tratamiento periodontal:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
