
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el presupuesto existe y está aprobado
    const budget = await prisma.budget.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        items: true
      }
    });

    if (!budget) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado' },
        { status: 404 }
      );
    }

    if (budget.status !== 'Aprobado') {
      return NextResponse.json(
        { error: 'Solo se pueden convertir presupuestos aprobados' },
        { status: 400 }
      );
    }

    // Crear el plan de tratamiento
    const treatmentPlan = await prisma.treatmentPlan.create({
      data: {
        title: `Plan de Tratamiento - ${budget.title}`,
        description: budget.description || `Convertido desde presupuesto ${budget.budgetNumber}`,
        patientId: budget.patientId,
        doctorId: budget.doctorId,
        status: 'Planificado',
        priority: 'Media',
        estimatedDuration: 60, // 60 minutos por defecto
        estimatedSessions: Math.ceil(budget.items.length / 2), // Aproximación
        totalCost: Number(budget.total),
        notes: `Creado automáticamente desde presupuesto ${budget.budgetNumber}\n\n${budget.notes || ''}`,
        budgetId: budget.id,
        treatments: {
          create: budget.items.map((item, index) => ({
            title: item.name,
            description: item.description || '',
            tooth: null, // Se puede modificar luego
            surface: null,
            procedure: item.category || 'General',
            status: 'Pendiente',
            priority: item.priority,
            estimatedDuration: 30, // 30 minutos por tratamiento por defecto
            cost: Number(item.total),
            notes: item.notes || '',
            sessionNumber: Math.ceil((index + 1) / 2), // Agrupar tratamientos por sesión
          }))
        }
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            numeroExpediente: true
          }
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        treatments: true
      }
    });

    // Actualizar el estado del presupuesto
    await prisma.budget.update({
      where: { id: budget.id },
      data: { status: 'Convertido a Plan' }
    });

    return NextResponse.json({
      success: true,
      treatmentPlan: treatmentPlan,
      message: 'Presupuesto convertido a plan de tratamiento exitosamente'
    });

  } catch (error) {
    console.error('Error converting budget to treatment plan:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
