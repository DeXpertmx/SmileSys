

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

    // Get Google Calendar settings from database or return defaults
    const settings = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        accounts: {
          where: { provider: 'google' },
          select: {
            access_token: true,
            refresh_token: true,
            expires_at: true
          }
        }
      }
    });

    // For now, return basic settings structure
    // In a real implementation, you'd store these in a separate table
    const googleCalendarSettings = {
      isConnected: settings?.accounts && settings.accounts.length > 0,
      syncEnabled: false,
      autoSync: false,
      syncInterval: 15,
      lastSync: null
    };

    return NextResponse.json(googleCalendarSettings);

  } catch (error) {
    console.error('Error getting Google Calendar settings:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const settings = await request.json();

    // In a real implementation, you'd save these settings to the database
    // For now, we'll just return the settings back as confirmation
    
    return NextResponse.json(settings);

  } catch (error) {
    console.error('Error updating Google Calendar settings:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

