

import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerAuthSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const patients = await prisma.patient.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
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

    // Verificar si ya existe un paciente con el mismo email
    if (data.email) {
      const existingPatient = await prisma.patient.findFirst({
        where: { email: data.email }
      });

      if (existingPatient) {
        return NextResponse.json(
          { error: 'Ya existe un paciente con este email' },
          { status: 400 }
        );
      }
    }

    const patient = await prisma.patient.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        gender: data.gender,
        occupation: data.occupation,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        bloodType: data.bloodType,
        allergies: data.allergies,
        medicalHistory: data.medicalHistory,
        insuranceInfo: data.insuranceInfo,
        status: data.status || 'Activo'
      }
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error('Error creando paciente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

