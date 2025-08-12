

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

    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
    const toDate = to ? new Date(to) : new Date();

    // Obtener datos para gráficos del dashboard
    
    // Ingresos mensuales de los últimos 6 meses
    const monthlyRevenueData = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      
      const monthRevenue = await prisma.invoiceItem.aggregate({
        _sum: { total: true },
        where: {
          invoice: {
            issueDate: {
              gte: monthStart,
              lte: monthEnd
            },
            status: 'Pagada'
          }
        }
      });

      const monthPatients = await prisma.patient.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });

      monthlyRevenueData.push({
        mes: monthStart.toLocaleDateString('es', { month: 'short' }),
        ingresos: Math.round(Number(monthRevenue._sum.total) || 0),
        gastos: Math.round((Number(monthRevenue._sum.total) || 0) * 0.65), // Estimado
        pacientes: monthPatients
      });
    }

    // Tipos de tratamientos más comunes
    const treatmentTypes = await prisma.treatment.groupBy({
      by: ['category'],
      _count: { category: true },
      where: {
        completedDate: {
          gte: fromDate,
          lte: toDate
        }
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      },
      take: 5
    });

    const treatmentTypesData = treatmentTypes.map((type, index) => {
      const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
      return {
        name: type.category || 'Sin categoría',
        value: type._count.category,
        color: colors[index % colors.length]
      };
    });

    // Citas por día de la semana
    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: fromDate,
          lte: toDate
        }
      },
      select: {
        date: true,
        status: true
      }
    });

    const weeklyAppointments: Record<string, { citas: number; completadas: number; canceladas: number }> = {
      'Lun': { citas: 0, completadas: 0, canceladas: 0 },
      'Mar': { citas: 0, completadas: 0, canceladas: 0 },
      'Mié': { citas: 0, completadas: 0, canceladas: 0 },
      'Jue': { citas: 0, completadas: 0, canceladas: 0 },
      'Vie': { citas: 0, completadas: 0, canceladas: 0 },
      'Sáb': { citas: 0, completadas: 0, canceladas: 0 }
    };

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    appointments.forEach(apt => {
      const dayName = dayNames[apt.date.getDay()];
      if (weeklyAppointments[dayName]) {
        weeklyAppointments[dayName].citas++;
        if (apt.status === 'Completada') {
          weeklyAppointments[dayName].completadas++;
        } else if (apt.status === 'Cancelada') {
          weeklyAppointments[dayName].canceladas++;
        }
      }
    });

    const weeklyAppointmentsData = Object.entries(weeklyAppointments)
      .filter(([day]) => day !== 'Dom')
      .map(([day, data]) => ({
        dia: day,
        ...data
      }));

    // Crecimiento de pacientes
    const patientGrowthData = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      
      const newPatients = await prisma.patient.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });

      const totalPatients = await prisma.patient.count({
        where: {
          createdAt: {
            lte: monthEnd
          }
        }
      });

      patientGrowthData.push({
        mes: monthStart.toLocaleDateString('es', { month: 'short' }),
        nuevos: newPatients,
        total: totalPatients
      });
    }

    const dashboardData = {
      monthlyRevenue: monthlyRevenueData,
      treatmentTypes: treatmentTypesData,
      weeklyAppointments: weeklyAppointmentsData,
      patientGrowth: patientGrowthData
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

