

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

    const { permisos } = await request.json();

    if (!Array.isArray(permisos)) {
      return NextResponse.json(
        { error: 'Los permisos deben ser un array' },
        { status: 400 }
      );
    }

    // Validate permissions
    const validPermissions = [
      'patients_view', 'patients_create', 'patients_edit', 'patients_delete',
      'appointments_view', 'appointments_create', 'appointments_edit', 'appointments_delete',
      'budgets_view', 'budgets_create', 'budgets_edit', 'budgets_approve',
      'reports_view', 'reports_export',
      'inventory_view', 'inventory_manage',
      'settings_view', 'settings_edit',
      'staff_view', 'staff_manage',
      'finances_view', 'finances_manage'
    ];

    const invalidPermissions = permisos.filter((p: string) => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        { error: `Permisos inválidos: ${invalidPermissions.join(', ')}` },
        { status: 400 }
      );
    }

    const staffMember = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: 'Personal no encontrado' },
        { status: 404 }
      );
    }

    const updatedStaffMember = await prisma.user.update({
      where: { id: params.id },
      data: { permisos },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        permisos: true
      }
    });

    return NextResponse.json({ 
      staffMember: updatedStaffMember,
      message: 'Permisos actualizados exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar permisos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
