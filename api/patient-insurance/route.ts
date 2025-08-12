
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validación para crear/actualizar póliza de paciente
const patientInsuranceSchema = z.object({
  patientId: z.string().min(1, 'El paciente es requerido'),
  insuranceCompanyId: z.string().min(1, 'La aseguradora es requerida'),
  policyNumber: z.string().min(1, 'El número de póliza es requerido'),
  groupNumber: z.string().optional(),
  subscriberId: z.string().optional(),
  subscriberName: z.string().optional(),
  relationToPatient: z.enum(['Titular', 'Cónyuge', 'Hijo', 'Dependiente']).default('Titular'),
  coverageType: z.enum(['Preventivo', 'Básico', 'Mayor', 'Ortodóncia']),
  coveragePercent: z.number().min(0).max(100).optional(),
  annualMaximum: z.number().min(0).optional(),
  deductible: z.number().min(0).optional(),
  copay: z.number().min(0).optional(),
  effectiveDate: z.string().datetime(),
  expirationDate: z.string().datetime().optional(),
  priority: z.enum(['Primario', 'Secundario']).default('Primario'),
  status: z.enum(['Activa', 'Inactiva', 'Vencida']).default('Activa'),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

// GET - Obtener todas las pólizas de pacientes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const patientId = searchParams.get('patientId');
    const insuranceCompanyId = searchParams.get('insuranceCompanyId');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    
    if (patientId) {
      where.patientId = patientId;
    }

    if (insuranceCompanyId) {
      where.insuranceCompanyId = insuranceCompanyId;
    }

    if (status) {
      where.status = status;
    }

    // Obtener pólizas con paginación
    const [policies, total] = await Promise.all([
      prisma.patientInsurance.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          insuranceCompany: {
            select: {
              id: true,
              name: true,
              code: true,
              status: true,
            },
          },
          _count: {
            select: {
              claims: true,
              preAuthorizations: true,
            },
          },
        },
      }),
      prisma.patientInsurance.count({ where }),
    ]);

    return NextResponse.json({
      policies,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit,
      },
    });

  } catch (error) {
    console.error('Error al obtener pólizas de pacientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva póliza de paciente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = patientInsuranceSchema.parse(body);

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que la aseguradora existe
    const insuranceCompany = await prisma.insuranceCompany.findUnique({
      where: { id: validatedData.insuranceCompanyId },
    });

    if (!insuranceCompany) {
      return NextResponse.json(
        { error: 'Aseguradora no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que no exista una póliza duplicada
    const existingPolicy = await prisma.patientInsurance.findFirst({
      where: {
        patientId: validatedData.patientId,
        insuranceCompanyId: validatedData.insuranceCompanyId,
        policyNumber: validatedData.policyNumber,
      },
    });

    if (existingPolicy) {
      return NextResponse.json(
        { error: 'Ya existe una póliza con este número para este paciente y aseguradora' },
        { status: 400 }
      );
    }

    // Crear la póliza
    const policy = await prisma.patientInsurance.create({
      data: {
        ...validatedData,
        effectiveDate: new Date(validatedData.effectiveDate),
        expirationDate: validatedData.expirationDate ? new Date(validatedData.expirationDate) : null,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        insuranceCompany: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(policy, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al crear póliza de paciente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
