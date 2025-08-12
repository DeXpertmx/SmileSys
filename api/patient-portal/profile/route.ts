
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get patient profile
    const patient = await prisma.patient.findFirst({
      where: {
        email: session.user.email,
      },
      include: {
        appointments: {
          orderBy: {
            date: 'desc',
          },
          take: 5,
        },
        budgets: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 3,
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error('Error al obtener perfil del paciente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { firstName, lastName, phone, address } = await request.json();

    // Find patient first
    const patient = await prisma.patient.findFirst({
      where: {
        email: session.user.email,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // Update patient profile
    const updatedPatient = await prisma.patient.update({
      where: {
        id: patient.id,
      },
      data: {
        firstName,
        lastName,
        phone,
        address,
      },
    });

    return NextResponse.json({ patient: updatedPatient });
  } catch (error) {
    console.error('Error al actualizar perfil del paciente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
