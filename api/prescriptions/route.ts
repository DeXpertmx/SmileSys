
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

    const prescriptions = await prisma.prescription.findMany({
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
        }
      },
      orderBy: { prescriptionDate: 'desc' }
    });

    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error('Error obteniendo recetas:', error);
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
      select: { id: true, name: true, especialidad: true }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor no encontrado' }, { status: 404 });
    }

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    const prescription = await prisma.prescription.create({
      data: {
        patientId: data.patientId,
        doctorId: doctor.id,
        treatmentId: data.treatmentId || null,
        doctorName: doctor.name || 'Dr. Sin nombre',
        professionalLicense: data.professionalLicense,
        specialization: doctor.especialidad || data.especialidad,
        diagnosis: data.diagnosis,
        instructions: data.instructions,
        medications: JSON.stringify(data.medications),
        template: data.template || null,
        notes: data.notes || null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        status: data.status || 'Activa'
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
        }
      }
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    console.error('Error creando receta:', error);
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
      return NextResponse.json({ error: 'ID de receta requerido' }, { status: 400 });
    }

    const prescription = await prisma.prescription.update({
      where: { id },
      data: {
        diagnosis: data.diagnosis,
        instructions: data.instructions,
        medications: JSON.stringify(data.medications),
        notes: data.notes,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        status: data.status,
        updatedAt: new Date()
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
        }
      }
    });

    return NextResponse.json(prescription);
  } catch (error) {
    console.error('Error actualizando receta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
