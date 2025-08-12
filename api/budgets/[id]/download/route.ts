
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const budgetId = params.id;

    // Handle demo budgets
    if (budgetId.startsWith('999')) {
      const demoData = {
        '999901': {
          id: '999901',
          name: 'Limpieza Dental',
          total: 150000,
          status: 'Pendiente',
          items: [
            { name: 'Limpieza Dental', description: 'Profilaxis completa', total: 150000 }
          ]
        },
        '999902': {
          id: '999902',
          name: 'Ortodoncia',
          total: 2500000,
          status: 'Aprobado',
          items: [
            { name: 'Ortodoncia', description: 'Tratamiento completo de ortodoncia', total: 2500000 }
          ]
        }
      };

      const demoBudget = demoData[budgetId as keyof typeof demoData];
      if (!demoBudget) {
        return NextResponse.json({ error: 'Presupuesto demo no encontrado' }, { status: 404 });
      }

      // Generate HTML for demo budget
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Presupuesto Demo #${demoBudget.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .patient-info { margin-bottom: 20px; }
            .treatments { margin-bottom: 20px; }
            .total { font-weight: bold; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SmileSys - Clínica Dental</h1>
            <h2>Presupuesto Demo #${demoBudget.id}</h2>
            <p>Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
          </div>
          
          <div class="patient-info">
            <h3>Información del Paciente</h3>
            <p><strong>Nombre:</strong> ${session.user?.firstName || 'Demo'} ${session.user?.lastName || 'Patient'}</p>
            <p><strong>Email:</strong> ${session.user?.email}</p>
          </div>
          
          <div class="treatments">
            <h3>Tratamientos</h3>
            <table>
              <thead>
                <tr>
                  <th>Tratamiento</th>
                  <th>Descripción</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                ${demoBudget.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.description || '-'}</td>
                    <td>$${item.total.toLocaleString('es-CO')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="total">
            <p>Total: $${demoBudget.total.toLocaleString('es-CO')}</p>
            <p>Estado: ${demoBudget.status}</p>
          </div>
          
          <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
            <p>SmileSys - Sistema de Gestión Dental</p>
            <p>Este es un documento de demostración generado automáticamente</p>
          </div>
        </body>
        </html>
      `;

      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="presupuesto-demo-${demoBudget.id}.html"`,
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Get budget with patient info for real budgets
    const budget = await prisma.budget.findUnique({
      where: {
        id: budgetId,
      },
      include: {
        patient: true,
        items: true,
      },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });
    }

    // Verify that the budget belongs to the logged-in patient
    if (budget.patient.email !== session.user.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Generate PDF content (simple HTML for now, can be enhanced with proper PDF generation)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Presupuesto #${budget.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .patient-info { margin-bottom: 20px; }
          .treatments { margin-bottom: 20px; }
          .total { font-weight: bold; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SmileSys - Clínica Dental</h1>
          <h2>Presupuesto #${budget.id}</h2>
          <p>Fecha: ${budget.createdAt.toLocaleDateString('es-ES')}</p>
        </div>
        
        <div class="patient-info">
          <h3>Información del Paciente</h3>
          <p><strong>Nombre:</strong> ${budget.patient.firstName} ${budget.patient.lastName}</p>
          <p><strong>Email:</strong> ${budget.patient.email}</p>
          ${budget.patient.phone ? `<p><strong>Teléfono:</strong> ${budget.patient.phone}</p>` : ''}
        </div>
        
        <div class="treatments">
          <h3>Tratamientos</h3>
          <table>
            <thead>
              <tr>
                <th>Tratamiento</th>
                <th>Descripción</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              ${budget.items.map((item: any) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.description || '-'}</td>
                  <td>$${item.total.toString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="total">
          <p>Total: $${budget.total.toString()}</p>
          <p>Estado: ${budget.status}</p>
        </div>
        
        ${budget.notes ? `
          <div style="margin-top: 20px;">
            <h3>Notas</h3>
            <p>${budget.notes}</p>
          </div>
        ` : ''}
        
        <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
          <p>SmileSys - Sistema de Gestión Dental</p>
          <p>Este documento fue generado automáticamente</p>
        </div>
      </body>
      </html>
    `;

    // Return HTML as downloadable file
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="presupuesto-${budget.id}.html"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error downloading budget:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
