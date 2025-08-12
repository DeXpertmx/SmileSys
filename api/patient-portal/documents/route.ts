
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get patient documents (budgets, prescriptions, etc.)
    const budgets = await prisma.budget.findMany({
      where: {
        patient: {
          email: session.user.email,
        },
      },
      include: {
        patient: true,
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform budgets to documents format
    const documents = budgets.map(budget => ({
      id: budget.id,
      name: `Presupuesto #${budget.id}`,
      type: 'budget',
      date: budget.createdAt.toISOString(),
      downloadUrl: `/api/budgets/${budget.id}/download`,
      status: budget.status,
      total: budget.total,
    }));

    // Add mock documents if no real ones exist
    if (documents.length === 0) {
      const mockDocuments = [
        {
          id: '999901',
          name: 'Presupuesto Demo - Limpieza',
          type: 'budget' as const,
          date: new Date().toISOString(),
          downloadUrl: `/api/budgets/999901/download`,
          status: 'Pendiente',
          total: new Decimal(150000),
        },
        {
          id: '999902',
          name: 'Presupuesto Demo - Ortodoncia',
          type: 'budget' as const,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          downloadUrl: `/api/budgets/999902/download`,
          status: 'Aprobado',
          total: new Decimal(2500000),
        }
      ];
      documents.push(...mockDocuments);
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error al obtener documentos del paciente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
