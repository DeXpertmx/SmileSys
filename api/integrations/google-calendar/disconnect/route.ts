
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // En una implementación real, aquí revocarías los tokens de Google
    // y actualizarías el estado en la base de datos
    
    console.log('Google Calendar disconnected');

    return NextResponse.json({ 
      message: 'Desconectado exitosamente',
      connected: false,
      enabled: false
    });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json(
      { error: 'Error al desconectar' },
      { status: 500 }
    );
  }
}
