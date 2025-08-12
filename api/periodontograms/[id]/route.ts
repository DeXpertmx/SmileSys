
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Obtener periodontograma específico
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const periodontogram = await prisma.periodontogram.findUnique({
      where: { id: params.id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            numeroExpediente: true,
            birthDate: true,
            phone: true,
            email: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            especialidad: true
          }
        },
        measurements: {
          orderBy: [
            { toothNumber: 'asc' },
            { position: 'asc' }
          ]
        },
        toothStatuses: {
          orderBy: { toothNumber: 'asc' }
        }
      }
    });

    if (!periodontogram) {
      return NextResponse.json(
        { error: 'Periodontograma no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(periodontogram);
  } catch (error) {
    console.error('Error al obtener periodontograma:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar periodontograma
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      notes, 
      diagnosis, 
      recommendations, 
      riskLevel, 
      status,
      treatmentPlan,
      followUpDate,
      measurements,
      toothStatuses
    } = body;

    // Actualizar información básica del periodontograma
    const updatedPeriodontogram = await prisma.periodontogram.update({
      where: { id: params.id },
      data: {
        title,
        notes,
        diagnosis,
        recommendations,
        riskLevel,
        status,
        treatmentPlan,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        updatedAt: new Date()
      }
    });

    // Actualizar mediciones si se proporcionan
    if (measurements && Array.isArray(measurements)) {
      for (const measurement of measurements) {
        await prisma.periodontalMeasurement.upsert({
          where: {
            periodontogramId_toothNumber_position: {
              periodontogramId: params.id,
              toothNumber: measurement.toothNumber,
              position: measurement.position
            }
          },
          update: {
            pocketDepthMesial: measurement.pocketDepthMesial || 0,
            pocketDepthCentral: measurement.pocketDepthCentral || 0,
            pocketDepthDistal: measurement.pocketDepthDistal || 0,
            attachmentLevelMesial: measurement.attachmentLevelMesial || 0,
            attachmentLevelCentral: measurement.attachmentLevelCentral || 0,
            attachmentLevelDistal: measurement.attachmentLevelDistal || 0,
            recessionMesial: measurement.recessionMesial || 0,
            recessionCentral: measurement.recessionCentral || 0,
            recessionDistal: measurement.recessionDistal || 0,
            bleedingMesial: measurement.bleedingMesial || false,
            bleedingCentral: measurement.bleedingCentral || false,
            bleedingDistal: measurement.bleedingDistal || false,
            suppurationMesial: measurement.suppurationMesial || false,
            suppurationCentral: measurement.suppurationCentral || false,
            suppurationDistal: measurement.suppurationDistal || false,
            plaqueMesial: measurement.plaqueMesial || false,
            plaqueCentral: measurement.plaqueCentral || false,
            plaqueDistal: measurement.plaqueDistal || false,
            calculusMesial: measurement.calculusMesial || false,
            calculusCentral: measurement.calculusCentral || false,
            calculusDistal: measurement.calculusDistal || false
          },
          create: {
            periodontogramId: params.id,
            toothNumber: measurement.toothNumber,
            position: measurement.position,
            pocketDepthMesial: measurement.pocketDepthMesial || 0,
            pocketDepthCentral: measurement.pocketDepthCentral || 0,
            pocketDepthDistal: measurement.pocketDepthDistal || 0,
            attachmentLevelMesial: measurement.attachmentLevelMesial || 0,
            attachmentLevelCentral: measurement.attachmentLevelCentral || 0,
            attachmentLevelDistal: measurement.attachmentLevelDistal || 0,
            recessionMesial: measurement.recessionMesial || 0,
            recessionCentral: measurement.recessionCentral || 0,
            recessionDistal: measurement.recessionDistal || 0,
            bleedingMesial: measurement.bleedingMesial || false,
            bleedingCentral: measurement.bleedingCentral || false,
            bleedingDistal: measurement.bleedingDistal || false,
            suppurationMesial: measurement.suppurationMesial || false,
            suppurationCentral: measurement.suppurationCentral || false,
            suppurationDistal: measurement.suppurationDistal || false,
            plaqueMesial: measurement.plaqueMesial || false,
            plaqueCentral: measurement.plaqueCentral || false,
            plaqueDistal: measurement.plaqueDistal || false,
            calculusMesial: measurement.calculusMesial || false,
            calculusCentral: measurement.calculusCentral || false,
            calculusDistal: measurement.calculusDistal || false
          }
        });
      }
    }

    // Actualizar estados de dientes si se proporcionan
    if (toothStatuses && Array.isArray(toothStatuses)) {
      for (const toothStatus of toothStatuses) {
        await prisma.toothStatus.upsert({
          where: {
            periodontogramId_toothNumber: {
              periodontogramId: params.id,
              toothNumber: toothStatus.toothNumber
            }
          },
          update: {
            status: toothStatus.status || 'Presente',
            condition: toothStatus.condition,
            mobility: toothStatus.mobility || 0,
            furcationMesial: toothStatus.furcationMesial || 0,
            furcationDistal: toothStatus.furcationDistal || 0,
            furcationVestibular: toothStatus.furcationVestibular || 0,
            furcationLingual: toothStatus.furcationLingual || 0,
            hasImplant: toothStatus.hasImplant || false,
            implantBrand: toothStatus.implantBrand,
            implantSize: toothStatus.implantSize,
            hasRestoration: toothStatus.hasRestoration || false,
            restorationType: toothStatus.restorationType,
            restorationCondition: toothStatus.restorationCondition,
            notes: toothStatus.notes
          },
          create: {
            periodontogramId: params.id,
            toothNumber: toothStatus.toothNumber,
            status: toothStatus.status || 'Presente',
            condition: toothStatus.condition,
            mobility: toothStatus.mobility || 0,
            furcationMesial: toothStatus.furcationMesial || 0,
            furcationDistal: toothStatus.furcationDistal || 0,
            furcationVestibular: toothStatus.furcationVestibular || 0,
            furcationLingual: toothStatus.furcationLingual || 0,
            hasImplant: toothStatus.hasImplant || false,
            implantBrand: toothStatus.implantBrand,
            implantSize: toothStatus.implantSize,
            hasRestoration: toothStatus.hasRestoration || false,
            restorationType: toothStatus.restorationType,
            restorationCondition: toothStatus.restorationCondition,
            notes: toothStatus.notes
          }
        });
      }
    }

    // Obtener el periodontograma actualizado
    const result = await prisma.periodontogram.findUnique({
      where: { id: params.id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            numeroExpediente: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true
          }
        },
        measurements: true,
        toothStatuses: true
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error al actualizar periodontograma:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar periodontograma
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const periodontogram = await prisma.periodontogram.findUnique({
      where: { id: params.id }
    });

    if (!periodontogram) {
      return NextResponse.json(
        { error: 'Periodontograma no encontrado' },
        { status: 404 }
      );
    }

    await prisma.periodontogram.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Periodontograma eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar periodontograma:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
