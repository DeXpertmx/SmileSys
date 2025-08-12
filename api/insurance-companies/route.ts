
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validación para crear/actualizar aseguradora
const insuranceCompanySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().min(1, 'El código es requerido'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  coverageTypes: z.string().optional(),
  copayAmount: z.number().optional(),
  deductible: z.number().optional(),
  maxCoverage: z.number().optional(),
  billingAddress: z.string().optional(),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  status: z.enum(['Activa', 'Inactiva', 'Suspendida']).default('Activa'),
  notes: z.string().optional(),
});

// GET - Obtener todas las aseguradoras
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Obtener aseguradoras con paginación
    const [companies, total] = await Promise.all([
      prisma.insuranceCompany.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit,
        include: {
          _count: {
            select: {
              patientPolicies: true,
              claims: true,
            },
          },
        },
      }),
      prisma.insuranceCompany.count({ where }),
    ]);

    return NextResponse.json({
      companies,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit,
      },
    });

  } catch (error) {
    console.error('Error al obtener aseguradoras:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva aseguradora
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = insuranceCompanySchema.parse(body);

    // Verificar que el código no exista
    const existingCompany = await prisma.insuranceCompany.findUnique({
      where: { code: validatedData.code },
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: 'Ya existe una aseguradora con este código' },
        { status: 400 }
      );
    }

    // Crear la aseguradora
    const company = await prisma.insuranceCompany.create({
      data: {
        ...validatedData,
        copayAmount: validatedData.copayAmount || undefined,
        deductible: validatedData.deductible || undefined,
        maxCoverage: validatedData.maxCoverage || undefined,
      },
      include: {
        _count: {
          select: {
            patientPolicies: true,
            claims: true,
          },
        },
      },
    });

    return NextResponse.json(company, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al crear aseguradora:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
