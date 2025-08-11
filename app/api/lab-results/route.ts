
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
    const labOrderId = searchParams.get('labOrderId');

    if (!labOrderId) {
      return NextResponse.json({ error: 'ID de orden de laboratorio requerido' }, { status: 400 });
    }

    const results = await prisma.labResult.findMany({
      where: { labOrderId },
      orderBy: { uploadDate: 'desc' }
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error obteniendo resultados:', error);
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
    const labOrderId = formData.get('labOrderId') as string;
    const type = formData.get('type') as string;
    const description = formData.get('description') as string;
    const content = formData.get('content') as string;
    const files = formData.getAll('files') as File[];

    if (!labOrderId) {
      return NextResponse.json({ error: 'ID de orden requerido' }, { status: 400 });
    }

    // Verificar que la orden existe
    const labOrder = await prisma.labOrder.findUnique({
      where: { id: labOrderId }
    });

    if (!labOrder) {
      return NextResponse.json({ error: 'Orden de laboratorio no encontrada' }, { status: 404 });
    }

    const uploadedResults = [];

    // Si hay archivos, procesarlos
    if (files.length > 0) {
      const uploadDir = path.join(process.cwd(), 'public/uploads/lab-results');
      await mkdir(uploadDir, { recursive: true });

      for (const file of files) {
        if (file instanceof File) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          const timestamp = Date.now();
          const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const filePath = path.join(uploadDir, fileName);
          
          await writeFile(filePath, buffer);
          
          const result = await prisma.labResult.create({
            data: {
              labOrderId,
              type: 'archivo',
              name: file.name,
              filename: fileName,
              url: `/uploads/lab-results/${fileName}`,
              mimeType: file.type,
              size: file.size,
              description: description || null
            }
          });

          uploadedResults.push(result);
        }
      }
    }

    // Si hay contenido de texto, crear resultado de texto
    if (content && content.trim()) {
      const textResult = await prisma.labResult.create({
        data: {
          labOrderId,
          type: 'texto',
          name: `Resultado - ${new Date().toLocaleDateString()}`,
          content: content,
          description: description || null
        }
      });

      uploadedResults.push(textResult);
    }

    // Actualizar la orden para marcar que tiene resultados
    await prisma.labOrder.update({
      where: { id: labOrderId },
      data: { 
        hasResults: true,
        status: 'Completada',
        completedDate: new Date()
      }
    });

    return NextResponse.json(uploadedResults, { status: 201 });
  } catch (error) {
    console.error('Error subiendo resultados:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
