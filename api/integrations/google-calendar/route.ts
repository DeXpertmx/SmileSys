
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // En una implementación real, obtendrías esto de la base de datos
    // Por ahora, devolvemos una configuración por defecto
    const config = {
      config: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/integrations/google-calendar/callback`
      },
      enabled: false,
      connected: false,
      calendarId: 'primary'
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error getting Google Calendar config:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { config, enabled, calendarId } = await request.json();

    // En una implementación real, guardarías esto en la base de datos
    // Por ahora, solo devolvemos éxito
    console.log('Google Calendar config saved:', { config, enabled, calendarId });

    return NextResponse.json({ 
      message: 'Configuración guardada exitosamente',
      config,
      enabled,
      calendarId
    });
  } catch (error) {
    console.error('Error saving Google Calendar config:', error);
    return NextResponse.json(
      { error: 'Error al guardar configuración' },
      { status: 500 }
    );
  }
}
