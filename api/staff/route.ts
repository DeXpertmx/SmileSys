

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let whereClause = {};
    
    if (role) {
      whereClause = { role };
    }

    const staff = await prisma.user.findMany({
      where: whereClause,
      take: limit,
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
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Transform permissions array to permissions field for compatibility
    const staffWithPermissions = staff.map(member => ({
      ...member,
      permissions: member.permisos || []
    }));

    return NextResponse.json({
      staff: staffWithPermissions,
      total: staff.length
    });

  } catch (error) {
    console.error('Error al obtener staff:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'Administrador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newStaff = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        especialidad: especialidad || null,
        phone: phone || null,
        permisos: permissions || [],
        active: active !== undefined ? active : true,
        tempPassword: true // Mark as temporary password
      }
    });

    return NextResponse.json({
      ...newStaff,
      tempPassword: tempPassword // Return the temp password
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear staff:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

