
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validación para actualizar reclamo
const updateClaimSchema = z.object({
  status: z.enum(['Enviado', 'En_Proceso', 'Aprobado', 'Rechazado', 'Pagado']).optional(),
  allowedAmount: z.number().min(0).optional(),
  deductibleAmount: z.number().min(0).optional(),
  copayAmount: z.number().min(0).optional(),
  coinsuranceAmount: z.number().min(0).optional(),
  paidAmount: z.number().min(0).optional(),
  patientAmount: z.number().min(0).optional(),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
});

// GET - Obtener reclamo específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const claim = await prisma.insuranceClaim.findUnique({
      where: { id: params.id },
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
            phone: true,
            email: true,
          },
        },
        patientInsurance: {
          select: {
            id: true,
            policyNumber: true,
            coverageType: true,
            priority: true,
            copay: true,
            deductible: true,
          },
        },
        treatment: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true,
          },
        },
      },
    });

    if (!claim) {
      return NextResponse.json(
        { error: 'Reclamo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(claim);

  } catch (error) {
    console.error('Error al obtener reclamo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar reclamo
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateClaimSchema.parse(body);

    // Verificar que el reclamo existe
    const existingClaim = await prisma.insuranceClaim.findUnique({
      where: { id: params.id },
    });

    if (!existingClaim) {
      return NextResponse.json(
        { error: 'Reclamo no encontrado' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = { ...validatedData };

    // Si se está marcando como procesado, pagado o rechazado, actualizar las fechas correspondientes
    if (validatedData.status) {
      if (validatedData.status === 'En_Proceso' && !existingClaim.processedDate) {
        updateData.processedDate = new Date();
      }
      if (validatedData.status === 'Pagado' && !existingClaim.paymentDate) {
        updateData.paymentDate = new Date();
      }
    }

    // Actualizar el reclamo
    const updatedClaim = await prisma.insuranceClaim.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedClaim);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al actualizar reclamo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar reclamo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el reclamo existe
    const existingClaim = await prisma.insuranceClaim.findUnique({
      where: { id: params.id },
    });

    if (!existingClaim) {
      return NextResponse.json(
        { error: 'Reclamo no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si se puede eliminar (no debe estar pagado o aprobado)
    if (existingClaim.status === 'Pagado' || existingClaim.status === 'Aprobado') {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar un reclamo que ha sido pagado o aprobado',
          status: existingClaim.status 
        },
        { status: 400 }
      );
    }

    // Eliminar el reclamo
    await prisma.insuranceClaim.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ 
      message: 'Reclamo eliminado exitosamente',
      id: params.id 
    });

  } catch (error) {
    console.error('Error al eliminar reclamo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
