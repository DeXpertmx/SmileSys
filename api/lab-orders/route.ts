
import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');

    const where = patientId ? { patientId } : {};

    const labOrders = await prisma.labOrder.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        doctor: {
          select: {
            name: true,
            especialidad: true
          }
        },
        treatment: {
          select: {
            id: true,
            name: true
          }
        },
        results: {
          orderBy: { uploadDate: 'desc' }
        }
      },
      orderBy: { orderDate: 'desc' }
    });

    return NextResponse.json(labOrders);
  } catch (error) {
    console.error('Error obteniendo órdenes de laboratorio:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();

    // Obtener información del doctor
    const doctor = await prisma.user.findUnique({
      where: { email: session.user?.email || '' },
      select: { id: true }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor no encontrado' }, { status: 404 });
    }

    const labOrder = await prisma.labOrder.create({
      data: {
        patientId: data.patientId,
        doctorId: doctor.id,
        treatmentId: data.treatmentId || null,
        type: data.type,
        tests: JSON.stringify(data.tests),
        instructions: data.instructions || null,
        diagnosis: data.diagnosis || null,
        priority: data.priority || 'Normal',
        status: 'Solicitada',
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        doctor: {
          select: {
            name: true,
            especialidad: true
          }
        },
        treatment: {
          select: {
            id: true,
            name: true
          }
        },
        results: true
      }
    });

    return NextResponse.json(labOrder, { status: 201 });
  } catch (error) {
    console.error('Error creando orden de laboratorio:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID de orden requerido' }, { status: 400 });
    }

    const updateData: any = {
      status: data.status,
      updatedAt: new Date()
    };

    // Si se marca como completada, agregar fecha de completado
    if (data.status === 'Completada' && !data.completedDate) {
      updateData.completedDate = new Date();
    }

    if (data.resultsNotes !== undefined) {
      updateData.resultsNotes = data.resultsNotes;
    }

    if (data.hasResults !== undefined) {
      updateData.hasResults = data.hasResults;
    }

    const labOrder = await prisma.labOrder.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        doctor: {
          select: {
            name: true,
            especialidad: true
          }
        },
        results: true
      }
    });

    return NextResponse.json(labOrder);
  } catch (error) {
    console.error('Error actualizando orden:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
