
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');

    // Construir filtros
    const where: any = {};
    
    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }
    
    if (doctorId) {
      where.doctorId = doctorId;
    }
    
    if (status) {
      where.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            especialidad: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Formatear respuesta
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
      doctorName: apt.doctor.name || 'Doctor sin nombre',
      date: apt.date.toISOString().split('T')[0],
      startTime: apt.startTime,
      endTime: apt.endTime,
      type: apt.type,
      reason: apt.reason,
      status: apt.status,
      notes: apt.notes,
      duration: apt.duration,
      patient: apt.patient,
      doctor: apt.doctor,
      createdAt: apt.createdAt,
      updatedAt: apt.updatedAt
    }));

    return NextResponse.json(formattedAppointments);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      patientId,
      doctorId,
      date,
      startTime,
      endTime,
      type,
      reason,
      status = 'Programada',
      notes,
      duration = 30
    } = body;

    // Validaciones
    if (!patientId || !doctorId || !date || !startTime || !endTime || !type) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una cita en el mismo horario para el mismo doctor
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: new Date(date),
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'Ya existe una cita en este horario para el doctor seleccionado' },
        { status: 400 }
      );
    }

    // Crear la cita
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        date: new Date(date),
        startTime,
        endTime,
        type,
        reason,
        status,
        notes,
        duration
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            especialidad: true
          }
        }
      }
    });

    // Formatear respuesta
    const formattedAppointment = {
      id: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      doctorName: appointment.doctor.name || 'Doctor sin nombre',
      date: appointment.date.toISOString().split('T')[0],
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      type: appointment.type,
      reason: appointment.reason,
      status: appointment.status,
      notes: appointment.notes,
      duration: appointment.duration,
      patient: appointment.patient,
      doctor: appointment.doctor,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt
    };

    return NextResponse.json(formattedAppointment, { status: 201 });
  } catch (error) {
    console.error('Error al crear cita:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
