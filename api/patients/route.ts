
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = limit ? parseInt(limit) : 20;

    let whereClause: any = {};
    
    if (search) {
      whereClause = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { numeroExpediente: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        numeroExpediente: true,
        birthDate: true,
        address: true,
        occupation: true,
        medicalHistory: true,
        createdAt: true
      }
    });

    const total = await prisma.patient.count({ where: whereClause });

    return NextResponse.json({
      patients,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Error al obtener los pacientes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const patient = await prisma.patient.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        address: data.address,
        occupation: data.occupation,
        medicalHistory: data.medicalHistory,
        numeroExpediente: data.numeroExpediente || `EXP-${Date.now()}`
      }
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Error al crear el paciente' },
      { status: 500 }
    );
  }
}
