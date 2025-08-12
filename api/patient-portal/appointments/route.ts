
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Find patient by email
    const patient = await prisma.patient.findFirst({
      where: {
        email: session.user.email,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // Get patient appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patient.id,
      },
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      date: apt.date.toISOString().split('T')[0],
      time: apt.startTime,
      doctor: `${apt.doctor.firstName} ${apt.doctor.lastName}`,
      treatment: apt.type,
      status: apt.status.toLowerCase(),
      notes: apt.notes,
    }));

    return NextResponse.json({ appointments: formattedAppointments });
  } catch (error) {
    console.error('Error al obtener citas del paciente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { date, time, treatment, notes } = await request.json();

    // Find patient by email
    const patient = await prisma.patient.findFirst({
      where: {
        email: session.user.email,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // Find a default doctor (first available)
    const doctor = await prisma.user.findFirst({
      where: {
        role: 'DOCTOR',
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'No hay doctores disponibles' }, { status: 400 });
    }

    // Calculate end time (add 30 minutes to start time)
    const [hour, minute] = time.split(':').map(Number);
    const startDate = new Date(date);
    startDate.setHours(hour, minute, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30);
    
    const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

    // Create appointment request
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        date: new Date(date),
        startTime: time,
        endTime: endTime,
        type: treatment,
        reason: notes || 'Solicitud desde portal del paciente',
        status: 'Programada',
        notes: `Cita solicitada desde portal del paciente el ${new Date().toLocaleString('es-ES')}`,
        duration: 30,
      },
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    const formattedAppointment = {
      id: appointment.id,
      date: appointment.date.toISOString().split('T')[0],
      time: appointment.startTime,
      doctor: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
      treatment: appointment.type,
      status: appointment.status.toLowerCase(),
      notes: appointment.notes,
    };

    return NextResponse.json({ 
      appointment: formattedAppointment,
      message: 'Cita solicitada exitosamente. Te contactaremos para confirmar la disponibilidad.' 
    });
  } catch (error) {
    console.error('Error al crear cita del paciente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
