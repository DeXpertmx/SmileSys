
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
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

    if (!appointment) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

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

    return NextResponse.json(formattedAppointment);
  } catch (error) {
    console.error('Error al obtener cita:', error);
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
      status,
      notes,
      duration
    } = body;

    // Verificar si la cita existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: params.id }
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    // Verificar conflictos de horario (excluyendo la cita actual)
    if (doctorId && date && startTime && endTime) {
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          id: { not: params.id },
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
          { error: 'Ya existe una cita en este horario para el doctor seleccionado' },
          { status: 400 }
        );
      }
    }

    // Actualizar la cita
    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        ...(patientId && { patientId }),
        ...(doctorId && { doctorId }),
        ...(date && { date: new Date(date) }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(type && { type }),
        ...(reason !== undefined && { reason }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(duration && { duration })
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

    return NextResponse.json(formattedAppointment);
  } catch (error) {
    console.error('Error al actualizar cita:', error);
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
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si la cita existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: params.id }
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar la cita
    await prisma.appointment.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'Cita eliminada exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
