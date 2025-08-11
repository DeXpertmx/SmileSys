

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el código ya existe en otro producto
    if (data.code && data.code !== existingProduct.code) {
      const codeExists = await prisma.product.findFirst({
        where: { 
          code: data.code,
          id: { not: params.id }
        }
      });

      if (codeExists) {
        return NextResponse.json(
          { error: 'Ya existe un producto con este código' },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        brand: data.brand,
        supplier: data.supplier,
        supplierCode: data.supplierCode,
        purchasePrice: parseFloat(data.purchasePrice?.toString() || '0'),
        salePrice: parseFloat(data.salePrice?.toString() || '0'),
        currentStock: parseInt(data.currentStock?.toString() || '0'),
        minStock: parseInt(data.minStock?.toString() || '0'),
        maxStock: parseInt(data.maxStock?.toString() || '0'),
        reorderPoint: parseInt(data.reorderPoint?.toString() || '0'),
        unit: data.unit || 'unidad',
        location: data.location,
        isActive: data.isActive !== false,
        requiresLot: data.requiresLot === true,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        updatedAt: new Date()
      }
    });

    // Crear transacción de ajuste si el stock cambió
    if (product.currentStock !== existingProduct.currentStock) {
      const difference = product.currentStock - existingProduct.currentStock;
      const transactionType = difference > 0 ? 'entrada' : 'salida';
      
      await prisma.inventoryTransaction.create({
        data: {
          productId: product.id,
          type: 'ajuste',
          subtype: 'ajuste_inventario',
          quantity: Math.abs(difference),
          description: `Ajuste de inventario: ${difference > 0 ? '+' : ''}${difference} unidades`,
          stockBefore: existingProduct.currentStock,
          stockAfter: product.currentStock,
          userId: session.user.id,
        }
      });
    }

    // Verificar y actualizar alertas
    await checkAndUpdateAlerts(product);

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function checkAndUpdateAlerts(product: any) {
  try {
    // Resolver alertas existentes si el stock mejoró
    if (product.currentStock > product.minStock) {
      await prisma.inventoryAlert.updateMany({
        where: {
          productId: product.id,
          type: { in: ['stock_bajo', 'agotado'] },
          isResolved: false
        },
        data: {
          isResolved: true,
          resolvedAt: new Date()
        }
      });
    }

    // Crear nuevas alertas si es necesario
    if (product.currentStock <= product.minStock) {
      const alertType = product.currentStock === 0 ? 'agotado' : 'stock_bajo';
      const priority = product.currentStock === 0 ? 'Alta' : 'Normal';
      
      // Verificar si ya existe una alerta similar
      const existingAlert = await prisma.inventoryAlert.findFirst({
        where: {
          productId: product.id,
          type: alertType,
          isResolved: false
        }
      });

      if (!existingAlert) {
        await prisma.inventoryAlert.create({
          data: {
            productId: product.id,
            type: alertType,
            message: product.currentStock === 0 
              ? `El producto ${product.name} está agotado`
              : `El producto ${product.name} tiene stock bajo (${product.currentStock} unidades)`,
            priority
          }
        });
      }
    }
  } catch (error) {
    console.error('Error updating alerts:', error);
  }
}

