
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validación para crear/actualizar reclamo de seguro
const insuranceClaimSchema = z.object({
  patientInsuranceId: z.string().min(1, 'La póliza del paciente es requerida'),
  insuranceCompanyId: z.string().min(1, 'La aseguradora es requerida'),
  patientId: z.string().min(1, 'El paciente es requerido'),
  serviceDate: z.string().datetime(),
  treatmentId: z.string().optional(),
  procedureCode: z.string().min(1, 'El código de procedimiento es requerido'),
  procedureDescription: z.string().min(1, 'La descripción del procedimiento es requerida'),
  chargedAmount: z.number().min(0, 'La cantidad facturada debe ser mayor a 0'),
  allowedAmount: z.number().min(0).optional(),
  deductibleAmount: z.number().min(0).optional(),
  copayAmount: z.number().min(0).optional(),
  coinsuranceAmount: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional(),
  patientAmount: z.number().min(0).optional(),
  status: z.enum(['Enviado', 'En_Proceso', 'Aprobado', 'Rechazado', 'Pagado']).default('Enviado'),
  diagnosisCode: z.string().optional(),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
  hasAttachments: z.boolean().default(false),
  attachments: z.string().optional(),
});

// GET - Obtener todos los reclamos de seguro
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

    // Obtener reclamos con paginación
    const [claims, total] = await Promise.all([
      prisma.insuranceClaim.findMany({
        where,
        orderBy: { submissionDate: 'desc' },
        skip: offset,
        take: limit,
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
            },
          },
          patientInsurance: {
            select: {
              id: true,
              policyNumber: true,
              coverageType: true,
              priority: true,
            },
          },
          treatment: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      }),
      prisma.insuranceClaim.count({ where }),
    ]);

    return NextResponse.json({
      claims,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit,
      },
    });

  } catch (error) {
    console.error('Error al obtener reclamos de seguro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo reclamo de seguro
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = insuranceClaimSchema.parse(body);

    // Verificar que la póliza de paciente existe
    const patientInsurance = await prisma.patientInsurance.findUnique({
      where: { id: validatedData.patientInsuranceId },
      include: {
        patient: true,
        insuranceCompany: true,
      },
    });

    if (!patientInsurance) {
      return NextResponse.json(
        { error: 'Póliza de paciente no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el paciente coincida
    if (patientInsurance.patientId !== validatedData.patientId) {
      return NextResponse.json(
        { error: 'El paciente no coincide con la póliza' },
        { status: 400 }
      );
    }

    // Verificar que la aseguradora coincida
    if (patientInsurance.insuranceCompanyId !== validatedData.insuranceCompanyId) {
      return NextResponse.json(
        { error: 'La aseguradora no coincide con la póliza' },
        { status: 400 }
      );
    }

    // Si se especifica un tratamiento, verificar que existe
    if (validatedData.treatmentId) {
      const treatment = await prisma.treatment.findUnique({
        where: { id: validatedData.treatmentId },
      });

      if (!treatment) {
        return NextResponse.json(
          { error: 'Tratamiento no encontrado' },
          { status: 404 }
        );
      }

      if (treatment.patientId !== validatedData.patientId) {
        return NextResponse.json(
          { error: 'El tratamiento no pertenece al paciente especificado' },
          { status: 400 }
        );
      }
    }

    // Crear el reclamo
    const claim = await prisma.insuranceClaim.create({
      data: {
        ...validatedData,
        serviceDate: new Date(validatedData.serviceDate),
        submissionDate: new Date(),
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
          },
        },
        patientInsurance: {
          select: {
            id: true,
            policyNumber: true,
            coverageType: true,
            priority: true,
          },
        },
        treatment: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(claim, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al crear reclamo de seguro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
