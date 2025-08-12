

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const doctorId = searchParams.get('doctorId');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let whereClause: any = {};
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      whereClause.date = {
        gte: startDate,
        lt: endDate
      };
    }
    
    if (doctorId) {
      whereClause.doctorId = doctorId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      take: limit,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            numeroExpediente: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            especialidad: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Transformar los datos para que coincidan con la interfaz del frontend
    const transformedAppointments = appointments.map(apt => ({
      id: apt.id,
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
      doctorName: `${apt.doctor.firstName} ${apt.doctor.lastName}`,
      date: apt.date.toISOString().split('T')[0], // YYYY-MM-DD format
      startTime: apt.startTime,
      endTime: apt.endTime,
      type: apt.type,
      status: apt.status,
      reason: apt.reason,
      notes: apt.notes,
      duration: apt.duration,
      patient: {
        firstName: apt.patient.firstName,
        lastName: apt.patient.lastName,
        phone: apt.patient.phone
      },
      doctor: {
        name: `${apt.doctor.firstName} ${apt.doctor.lastName}`,
        especialidad: apt.doctor.especialidad
      }
    }));

    return NextResponse.json(transformedAppointments);

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

    const {
      patientId,
      doctorId,
      date,
      startTime,
      endTime,
      type,
      reason,
      notes,
      duration
    } = await request.json();

    // Check for conflicts
    const conflictingAppointment = await prisma.appointment.findFirst({
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

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'Ya existe una cita en este horario para el doctor' },
        { status: 400 }
      );
    }

    const newAppointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        date: new Date(date),
        startTime,
        endTime,
        type,
        reason: reason || null,
        notes: notes || null,
        duration: duration || 30,
        status: 'Programada'
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            numeroExpediente: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            especialidad: true
          }
        }
      }
    });

    return NextResponse.json(newAppointment, { status: 201 });

  } catch (error) {
    console.error('Error al crear cita:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

