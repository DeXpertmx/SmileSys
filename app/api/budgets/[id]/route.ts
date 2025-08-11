

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const budget = await prisma.budget.findUnique({
      where: {
        id: params.id
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            numeroExpediente: true,
            email: true,
            phone: true,
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                code: true,
              }
            }
          }
        }
      }
    });

    if (!budget) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Error fetching budget:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    
    const {
      title,
      description,
      validUntil,
      notes,
      termsConditions,
      subtotal,
      discount,
      tax,
      total,
      items
    } = data;

    // Verificar que el presupuesto existe
    const existingBudget = await prisma.budget.findUnique({
      where: { id: params.id }
    });

    if (!existingBudget) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar elementos existentes y crear los nuevos
    await prisma.budgetItem.deleteMany({
      where: { budgetId: params.id }
    });

    const budget = await prisma.budget.update({
      where: { id: params.id },
      data: {
        title,
        description,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes,
        termsConditions,
        subtotal: parseFloat(subtotal.toString()) || 0,
        discount: parseFloat(discount.toString()) || 0,
        tax: parseFloat(tax.toString()) || 0,
        total: parseFloat(total.toString()) || 0,
        updatedAt: new Date(),
        items: {
          create: items.map((item: any) => ({
            type: item.type,
            name: item.name,
            description: item.description,
            category: item.category,
            quantity: parseInt(item.quantity.toString()) || 1,
            unitPrice: parseFloat(item.unitPrice.toString()) || 0,
            discount: parseFloat(item.discount.toString()) || 0,
            total: parseFloat(item.total.toString()) || 0,
            priority: item.priority || 'Normal',
            estimated: item.estimated || false,
            notes: item.notes,
            productId: item.productId || null,
          }))
        }
      },
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
        },
        items: true
      }
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
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

    // Solo permitir eliminar presupuestos en borrador
    if (budget.status !== 'Borrador') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar presupuestos en borrador' },
        { status: 400 }
      );
    }

    await prisma.budget.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Presupuesto eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

