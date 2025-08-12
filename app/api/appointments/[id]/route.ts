

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const {
      patientId,
      doctorId,
      date,
      startTime,
      endTime,
      type,
      reason,
      notes,
      duration,
      status
    } = await request.json();

    // Check for conflicts with other appointments (excluding current one)
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
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

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
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
        status: status || 'Programada'
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

    return NextResponse.json(updatedAppointment);

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

    const { id } = params;

    await prisma.appointment.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Cita eliminada' });

  } catch (error) {
    console.error('Error al eliminar cita:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

