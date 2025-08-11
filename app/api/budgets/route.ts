

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    let where: any = {};
    
    if (patientId) {
      where.patientId = patientId;
    }
    
    if (status) {
      where.status = status;
    }

    const budgets = await prisma.budget.findMany({
      where,
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
        },
        _count: {
          select: {
            items: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    
    const {
      title,
      description,
      patientId,
      doctorId,
      validUntil,
      notes,
      termsConditions,
      subtotal,
      discount,
      tax,
      total,
      items,
      status = 'Borrador'
    } = data;

    // Validaciones básicas
    if (!title || !patientId) {
      return NextResponse.json(
        { error: 'Título y paciente son requeridos' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'El presupuesto debe tener al menos un elemento' },
        { status: 400 }
      );
    }

    // Crear el presupuesto con sus elementos
    const budget = await prisma.budget.create({
      data: {
        title,
        description,
        patientId,
        doctorId: doctorId || session.user.id,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes,
        termsConditions,
        subtotal: parseFloat(subtotal.toString()) || 0,
        discount: parseFloat(discount.toString()) || 0,
        tax: parseFloat(tax.toString()) || 0,
        total: parseFloat(total.toString()) || 0,
        status,
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

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

