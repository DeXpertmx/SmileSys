
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Mapear productos con información adicional
    const mappedProducts = products.map(product => ({
      id: product.id,
      code: product.code,
      name: product.name,
      description: product.description || '',
      category: product.category,
      subcategory: product.subcategory,
      brand: product.brand,
      supplier: product.supplier,
      purchasePrice: parseFloat(product.purchasePrice.toString()),
      salePrice: parseFloat(product.salePrice.toString()),
      currentStock: product.currentStock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      unit: product.unit,
      location: product.location,
      isActive: product.isActive,
      expirationDate: product.expirationDate?.toISOString(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    }));

    return NextResponse.json(mappedProducts);

  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      name,
      description,
      category,
      subcategory,
      brand,
      supplier,
      purchasePrice,
      salePrice,
      currentStock,
      minStock,
      maxStock,
      unit,
      location
    } = body;

    // Verificar que el código no exista
    const existingProduct = await prisma.product.findUnique({
      where: { code }
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Ya existe un producto con este código' },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        code,
        name,
        description: description || null,
        category,
        subcategory: subcategory || null,
        brand: brand || null,
        supplier: supplier || null,
        purchasePrice: parseFloat(purchasePrice.toString()),
        salePrice: parseFloat(salePrice.toString()),
        currentStock: parseInt(currentStock.toString()),
        minStock: parseInt(minStock.toString()),
        maxStock: parseInt(maxStock.toString()),
        unit,
        location: location || null,
        isActive: true
      }
    });

    // Si hay stock inicial, crear transacción
    if (currentStock > 0) {
      await prisma.inventoryTransaction.create({
        data: {
          productId: product.id,
          type: 'entrada',
          subtype: 'stock_inicial',
          quantity: currentStock,
          unitPrice: parseFloat(purchasePrice.toString()),
          totalCost: currentStock * parseFloat(purchasePrice.toString()),
          description: 'Stock inicial del producto',
          stockBefore: 0,
          stockAfter: currentStock,
          userId: session.user.id
        }
      });
    }

    const mappedProduct = {
      id: product.id,
      code: product.code,
      name: product.name,
      description: product.description || '',
      category: product.category,
      subcategory: product.subcategory,
      brand: product.brand,
      supplier: product.supplier,
      purchasePrice: parseFloat(product.purchasePrice.toString()),
      salePrice: parseFloat(product.salePrice.toString()),
      currentStock: product.currentStock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      unit: product.unit,
      location: product.location,
      isActive: product.isActive,
      expirationDate: product.expirationDate?.toISOString(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    };

    return NextResponse.json(mappedProduct);

  } catch (error) {
    console.error('Error al crear producto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
