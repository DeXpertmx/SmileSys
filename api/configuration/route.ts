
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const configurations = await prisma.configuration.findMany({
      orderBy: {
        key: 'asc'
      }
    });

    // Convert to key-value object
    const configObject = configurations.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(configObject);
  } catch (error) {
    console.error('Error fetching configuration:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();

    // Update or create configurations
    const updates = [];
    for (const [key, value] of Object.entries(data)) {
      updates.push(
        prisma.configuration.upsert({
          where: { key },
          update: { value: value as string },
          create: { 
            key, 
            value: value as string,
            description: getConfigDescription(key)
          }
        })
      );
    }

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating configuration:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function getConfigDescription(key: string): string {
  const descriptions: Record<string, string> = {
    currency: 'Moneda predeterminada del sistema',
    currencySymbol: 'Símbolo de la moneda',
    dateFormat: 'Formato de fecha predeterminado',
    timeFormat: 'Formato de hora predeterminado',
    clinicName: 'Nombre de la clínica',
    clinicAddress: 'Dirección de la clínica',
    clinicPhone: 'Teléfono de la clínica',
    clinicEmail: 'Email de la clínica',
    timezone: 'Zona horaria del sistema',
    language: 'Idioma predeterminado',
  };
  
  return descriptions[key] || `Configuración: ${key}`;
}
