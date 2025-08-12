

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
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

    const { estado } = await request.json();

    if (!['ACTIVO', 'INACTIVO', 'SUSPENDIDO'].includes(estado)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      );
    }

    // Check if user exists and is not the current user
    const staffMember = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: 'Personal no encontrado' },
        { status: 404 }
      );
    }

    if (staffMember.id === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes cambiar tu propio estado' },
        { status: 400 }
      );
    }

    const updatedStaffMember = await prisma.user.update({
      where: { id: params.id },
      data: { estado },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        estado: true
      }
    });

    return NextResponse.json({ 
      staffMember: updatedStaffMember,
      message: `Estado actualizado a ${estado}`
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
