
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // En una implementación real, aquí generarías la URL de autorización de Google OAuth
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/google-calendar/callback`;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Google Client ID no configurado' },
        { status: 400 }
      );
    }

    const scope = 'https://www.googleapis.com/auth/calendar';
    const responseType = 'code';
    const accessType = 'offline';
    const prompt = 'consent';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=${encodeURIComponent(responseType)}&` +
      `access_type=${encodeURIComponent(accessType)}&` +
      `prompt=${encodeURIComponent(prompt)}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error creating Google auth URL:', error);
    return NextResponse.json(
      { error: 'Error al crear URL de autorización' },
      { status: 500 }
    );
  }
}
