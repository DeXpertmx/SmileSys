
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    
    let whereClause = {};
    
    if (search) {
      whereClause = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { numeroExpediente: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        numeroExpediente: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        birthDate: true,
        gender: true,
        occupation: true,
        emergencyContact: true,
        emergencyPhone: true,
        bloodType: true,
        allergies: true,
        medicalHistory: true,
        insuranceInfo: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    return NextResponse.json({ patients, total: patients.length });

  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      birthDate,
      gender,
      occupation,
      emergencyContact,
      emergencyPhone,
      bloodType,
      allergies,
      medicalHistory,
      insuranceInfo,
      status
    } = await request.json();

    // Check if patient already exists by email if provided
    if (email) {
      const existingPatient = await prisma.patient.findFirst({
        where: { email }
      });

      if (existingPatient) {
        return NextResponse.json(
          { error: 'Ya existe un paciente con este email' },
          { status: 400 }
        );
      }
    }

    // Generate patient number
    const patientsCount = await prisma.patient.count();
    const numeroExpediente = `P${String(patientsCount + 1).padStart(6, '0')}`;

    const newPatient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        numeroExpediente,
        address: address || null,
        city: city || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender: gender || null,
        occupation: occupation || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        bloodType: bloodType || null,
        allergies: allergies || null,
        medicalHistory: medicalHistory || null,
        insuranceInfo: insuranceInfo || null,
        status: status || 'Activo'
      }
    });

    return NextResponse.json(newPatient, { status: 201 });

  } catch (error) {
    console.error('Error al crear paciente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
