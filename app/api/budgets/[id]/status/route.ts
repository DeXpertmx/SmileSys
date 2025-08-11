

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Estado requerido' },
        { status: 400 }
      );
    }

    const validStatuses = ['Borrador', 'Enviado', 'Aprobado', 'Rechazado', 'Vencido'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Estado no válido' },
        { status: 400 }
      );
    }

    const budget = await prisma.budget.findUnique({
      where: { id: params.id }
    });

    if (!budget) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      );
    }

    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // Agregar fechas específicas según el estado
    if (status === 'Aprobado') {
      updateData.approvedDate = new Date();
    } else if (status === 'Rechazado') {
      updateData.rejectedDate = new Date();
    }

    const updatedBudget = await prisma.budget.update({
      where: { id: params.id },
      data: updateData,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            numeroExpediente: true,
          }
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    return NextResponse.json(updatedBudget);
  } catch (error) {
    console.error('Error updating budget status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

