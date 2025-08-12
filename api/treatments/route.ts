

import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const treatments = await prisma.treatment.findMany({
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            birthDate: true,
            gender: true,
            bloodType: true,
            allergies: true,
            medicalHistory: true
          }
        },
        doctor: {
          select: {
            name: true,
            especialidad: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return NextResponse.json(treatments);
  } catch (error) {
    console.error('Error obteniendo tratamientos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    // Obtener el usuario actual para asignar como doctor
    const doctor = await prisma.user.findUnique({
      where: { email: session.user?.email || '' }
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const treatment = await prisma.treatment.create({
      data: {
        patientId: data.patientId,
        doctorId: doctor.id,
        name: data.name,
        category: data.category,
        description: data.description,
        diagnosis: data.diagnosis,
        procedure: data.procedure,
        medications: data.medications,
        instructions: data.instructions,
        cost: data.cost,
        status: data.status,
        startDate: new Date(data.startDate),
        completedDate: data.status === 'Completado' ? new Date() : null,
        notes: data.notes
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            birthDate: true,
            gender: true,
            bloodType: true,
            allergies: true,
            medicalHistory: true
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

    return NextResponse.json(treatment, { status: 201 });
  } catch (error) {
    console.error('Error creando tratamiento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

