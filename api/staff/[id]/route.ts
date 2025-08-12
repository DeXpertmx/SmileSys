

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
    
    if (!session || session.user.role !== 'Administrador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const {
      firstName,
      lastName,
      email,
      role,
      especialidad,
      phone,
      permissions,
      active
    } = await request.json();

    // Check if another user has this email
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: id }
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      );
    }

    const updatedStaff = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        role,
        especialidad: especialidad || null,
        phone: phone || null,
        permisos: permissions || [],
        active: active !== undefined ? active : true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        especialidad: true,
        phone: true,
        active: true,
        permisos: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      ...updatedStaff,
      permissions: updatedStaff.permisos || []
    });

  } catch (error) {
    console.error('Error al actualizar staff:', error);
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
    
    if (!session || session.user.role !== 'Administrador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    // Don't allow deleting the current user
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propio usuario' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Usuario eliminado' });

  } catch (error) {
    console.error('Error al eliminar staff:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

