

import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = to ? new Date(to) : new Date();

    // Estadísticas generales
    const [
      totalPatients,
      totalRevenue,
      appointmentsThisMonth,
      completedTreatments,
      pendingInvoices,
      newPatientsThisMonth
    ] = await Promise.all([
      // Total de pacientes
      prisma.patient.count({
        where: { status: 'Activo' }
      }),

      // Ingresos totales del período
      prisma.invoiceItem.aggregate({
        _sum: { total: true },
        where: {
          invoice: {
            issueDate: {
              gte: fromDate,
              lte: toDate
            },
            status: 'Pagada'
          }
        }
      }),

      // Citas este mes
      prisma.appointment.count({
        where: {
          date: {
            gte: fromDate,
            lte: toDate
          }
        }
      }),

      // Tratamientos completados
      prisma.treatment.count({
        where: {
          status: 'Completado',
          completedDate: {
            gte: fromDate,
            lte: toDate
          }
        }
      }),

      // Facturas pendientes
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: {
          status: { in: ['Pendiente', 'Parcialmente Pagada'] }
        }
      }),

      // Nuevos pacientes este mes
      prisma.patient.count({
        where: {
          createdAt: {
            gte: fromDate,
            lte: toDate
          }
        }
      })
    ]);

    // Calcular crecimiento mensual (comparar con el mes anterior)
    const previousMonthStart = new Date(fromDate);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    const previousMonthEnd = new Date(fromDate);
    previousMonthEnd.setDate(previousMonthEnd.getDate() - 1);

    const [prevMonthPatients, prevMonthRevenue, prevMonthAppointments] = await Promise.all([
      prisma.patient.count({
        where: {
          createdAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd
          }
        }
      }),

      prisma.invoiceItem.aggregate({
        _sum: { total: true },
        where: {
          invoice: {
            issueDate: {
              gte: previousMonthStart,
              lte: previousMonthEnd
            },
            status: 'Pagada'
          }
        }
      }),

      prisma.appointment.count({
        where: {
          date: {
            gte: previousMonthStart,
            lte: previousMonthEnd
          }
        }
      })
    ]);

    // Calcular porcentajes de crecimiento
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const overview = {
      totalPatients: totalPatients || 0,
      totalRevenue: Math.round(Number(totalRevenue._sum.total) || 0),
      appointmentsThisMonth: appointmentsThisMonth || 0,
      completedTreatments: completedTreatments || 0,
      pendingPayments: Math.round(Number(pendingInvoices._sum.total) || 0),
      newPatientsThisMonth: newPatientsThisMonth || 0
    };

    const monthlyGrowth = {
      patients: calculateGrowth(newPatientsThisMonth || 0, prevMonthPatients || 0),
      revenue: calculateGrowth(
        Math.round(Number(totalRevenue._sum.total) || 0),
        Math.round(Number(prevMonthRevenue._sum.total) || 0)
      ),
      appointments: calculateGrowth(appointmentsThisMonth || 0, prevMonthAppointments || 0)
    };

    return NextResponse.json({
      overview,
      monthlyGrowth
    });

  } catch (error) {
    console.error('Error fetching overview data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

