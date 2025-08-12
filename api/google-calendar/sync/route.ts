

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get Google Calendar access token
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'google'
      }
    });

    if (!account?.access_token) {
      return NextResponse.json(
        { error: 'Google Calendar no conectado' },
        { status: 400 }
      );
    }

    // Check if token needs refresh
    const now = Math.floor(Date.now() / 1000);
    let accessToken = account.access_token;

    if (account.expires_at && account.expires_at < now) {
      // Token expired, refresh it
      if (!account.refresh_token) {
        return NextResponse.json(
          { error: 'Token expirado y no se puede refrescar' },
          { status: 400 }
        );
      }

      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: account.refresh_token,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          grant_type: 'refresh_token',
        }),
      });

      if (refreshResponse.ok) {
        const newTokens = await refreshResponse.json();
        accessToken = newTokens.access_token;

        // Update tokens in database
        await prisma.account.update({
          where: { id: account.id },
          data: {
            access_token: newTokens.access_token,
            expires_at: Math.floor(Date.now() / 1000) + newTokens.expires_in,
            refresh_token: newTokens.refresh_token || account.refresh_token,
          },
        });
      } else {
        return NextResponse.json(
          { error: 'No se pudo refrescar el token' },
          { status: 400 }
        );
      }
    }

    // Get SmileSys appointments for the next 30 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        status: {
          not: 'Cancelada'
        }
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            especialidad: true
          }
        }
      }
    });

    // Sync each appointment to Google Calendar
    let syncedCount = 0;
    let errorCount = 0;

    for (const appointment of appointments) {
      try {
        const eventDateTime = new Date(appointment.date);
        const [startHours, startMinutes] = appointment.startTime.split(':').map(Number);
        const [endHours, endMinutes] = appointment.endTime.split(':').map(Number);

        eventDateTime.setHours(startHours, startMinutes, 0, 0);
        const endDateTime = new Date(appointment.date);
        endDateTime.setHours(endHours, endMinutes, 0, 0);

        const event = {
          summary: `${appointment.type} - ${appointment.patient.firstName} ${appointment.patient.lastName}`,
          description: [
            `Paciente: ${appointment.patient.firstName} ${appointment.patient.lastName}`,
            appointment.patient.phone ? `Teléfono: ${appointment.patient.phone}` : '',
            `Doctor: Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
            appointment.doctor.especialidad ? `Especialidad: ${appointment.doctor.especialidad}` : '',
            appointment.reason ? `Motivo: ${appointment.reason}` : '',
            appointment.notes ? `Notas: ${appointment.notes}` : '',
            `\nGenerado por SmileSys - ID: ${appointment.id}`
          ].filter(Boolean).join('\n'),
          start: {
            dateTime: eventDateTime.toISOString(),
            timeZone: 'America/Bogota',
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'America/Bogota',
          },
          attendees: [],
          reminders: {
            useDefault: true
          }
        };

        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });

        if (response.ok) {
          syncedCount++;
        } else {
          console.error('Error syncing appointment:', appointment.id, await response.text());
          errorCount++;
        }

      } catch (error) {
        console.error('Error processing appointment:', appointment.id, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      errorCount,
      totalAppointments: appointments.length,
      lastSync: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error syncing with Google Calendar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

