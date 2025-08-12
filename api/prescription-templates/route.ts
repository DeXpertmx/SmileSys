
import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const templates = await prisma.prescriptionTemplate.findMany({
      where: { isActive: true },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error obteniendo plantillas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();

    const template = await prisma.prescriptionTemplate.create({
      data: {
        name: data.name,
        category: data.category,
        description: data.description || null,
        medications: JSON.stringify(data.medications),
        instructions: data.instructions,
        isActive: data.isActive !== false,
        isDefault: data.isDefault === true
      }
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creando plantilla:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID de plantilla requerido' }, { status: 400 });
    }

    const template = await prisma.prescriptionTemplate.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        description: data.description,
        medications: JSON.stringify(data.medications),
        instructions: data.instructions,
        isActive: data.isActive,
        isDefault: data.isDefault,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error actualizando plantilla:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de plantilla requerido' }, { status: 400 });
    }

    // Verificar si es una plantilla por defecto
    const template = await prisma.prescriptionTemplate.findUnique({
      where: { id },
      select: { isDefault: true }
    });

    if (template?.isDefault) {
      return NextResponse.json({ error: 'No se puede eliminar una plantilla por defecto' }, { status: 400 });
    }

    await prisma.prescriptionTemplate.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando plantilla:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
