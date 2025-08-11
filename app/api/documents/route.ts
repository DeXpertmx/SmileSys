
import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'ID de paciente requerido' }, { status: 400 });
    }

    const documents = await prisma.medicalDocument.findMany({
      where: { 
        patientId,
        isActive: true 
      },
      orderBy: { uploadDate: 'desc' }
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error obteniendo documentos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const patientId = formData.get('patientId') as string;
    const type = formData.get('type') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const files = formData.getAll('files') as File[];

    if (!patientId || files.length === 0) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // Crear directorio si no existe
    const uploadDir = path.join(process.cwd(), 'public/uploads/documents');
    await mkdir(uploadDir, { recursive: true });

    const uploadedDocuments = [];

    for (const file of files) {
      if (file instanceof File) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Generar nombre único para el archivo
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = path.join(uploadDir, fileName);
        
        // Guardar archivo
        await writeFile(filePath, buffer);
        
        // Crear registro en la base de datos
        const document = await prisma.medicalDocument.create({
          data: {
            patientId,
            type: type || 'documento',
            name: file.name,
            filename: fileName,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            url: `/uploads/documents/${fileName}`,
            description: description || null,
            category: category || null,
            uploadDate: new Date(),
          }
        });

        uploadedDocuments.push(document);
      }
    }

    return NextResponse.json(uploadedDocuments, { status: 201 });
  } catch (error) {
    console.error('Error subiendo documentos:', error);
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
      return NextResponse.json({ error: 'ID de documento requerido' }, { status: 400 });
    }

    // Marcar como inactivo en lugar de eliminar
    await prisma.medicalDocument.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando documento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
