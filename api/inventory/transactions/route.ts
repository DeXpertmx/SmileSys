
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

    const transactions = await prisma.inventoryTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true
          }
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      take: 50 // Limitar a las últimas 50 transacciones
    });

    const mappedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      productId: transaction.productId,
      product: {
        id: transaction.product.id,
        code: transaction.product.code,
        name: transaction.product.name,
        category: transaction.product.category,
        unit: transaction.product.unit
      },
      transactionNumber: transaction.transactionNumber,
      type: transaction.type,
      subtype: transaction.subtype,
      quantity: transaction.quantity,
      unitPrice: transaction.unitPrice ? parseFloat(transaction.unitPrice.toString()) : null,
      totalCost: transaction.totalCost ? parseFloat(transaction.totalCost.toString()) : null,
      description: transaction.description,
      stockBefore: transaction.stockBefore,
      stockAfter: transaction.stockAfter,
      user: transaction.user,
      patient: transaction.patient,
      createdAt: transaction.createdAt.toISOString()
    }));

    return NextResponse.json(mappedTransactions);

  } catch (error) {
    console.error('Error al obtener transacciones:', error);
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
    const { productId, type, quantity, unitPrice, description } = body;

    // Obtener el producto actual
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const stockBefore = product.currentStock;
    let stockAfter = stockBefore;
    let finalQuantity = parseInt(quantity.toString());

    // Calcular el nuevo stock
    switch (type) {
      case 'entrada':
        stockAfter = stockBefore + finalQuantity;
        break;
      case 'salida':
        stockAfter = stockBefore - finalQuantity;
        finalQuantity = -finalQuantity; // Negativo para salidas
        break;
      case 'ajuste':
        stockAfter = finalQuantity;
        finalQuantity = finalQuantity - stockBefore; // Diferencia
        break;
    }

    // Validar que no quede stock negativo
    if (stockAfter < 0) {
      return NextResponse.json(
        { error: 'No hay suficiente stock disponible' },
        { status: 400 }
      );
    }

    // Crear la transacción
    const transaction = await prisma.inventoryTransaction.create({
      data: {
        productId,
        type,
        subtype: type === 'entrada' ? 'compra' : type === 'salida' ? 'venta' : 'ajuste_manual',
        quantity: finalQuantity,
        unitPrice: unitPrice ? parseFloat(unitPrice.toString()) : null,
        totalCost: unitPrice ? Math.abs(finalQuantity) * parseFloat(unitPrice.toString()) : null,
        description: description || null,
        stockBefore,
        stockAfter,
        userId: session.user.id
      },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Actualizar el stock del producto
    await prisma.product.update({
      where: { id: productId },
      data: { 
        currentStock: stockAfter,
        updatedAt: new Date()
      }
    });

    // Crear alerta si el stock está bajo
    if (stockAfter <= product.minStock) {
      await prisma.inventoryAlert.create({
        data: {
          productId,
          type: stockAfter === 0 ? 'agotado' : 'stock_bajo',
          message: stockAfter === 0 
            ? `El producto ${product.name} está agotado`
            : `El producto ${product.name} tiene stock bajo (${stockAfter} ${product.unit})`,
          priority: stockAfter === 0 ? 'Alta' : 'Normal'
        }
      });
    }

    const mappedTransaction = {
      id: transaction.id,
      productId: transaction.productId,
      product: {
        id: transaction.product.id,
        code: transaction.product.code,
        name: transaction.product.name,
        category: transaction.product.category,
        unit: transaction.product.unit
      },
      transactionNumber: transaction.transactionNumber,
      type: transaction.type,
      subtype: transaction.subtype,
      quantity: transaction.quantity,
      unitPrice: transaction.unitPrice ? parseFloat(transaction.unitPrice.toString()) : null,
      totalCost: transaction.totalCost ? parseFloat(transaction.totalCost.toString()) : null,
      description: transaction.description,
      stockBefore: transaction.stockBefore,
      stockAfter: transaction.stockAfter,
      user: transaction.user,
      createdAt: transaction.createdAt.toISOString()
    };

    return NextResponse.json(mappedTransaction);

  } catch (error) {
    console.error('Error al crear transacción:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
