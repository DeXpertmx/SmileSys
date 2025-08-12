
import { NextResponse } from 'next/server';

export async function GET() {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Presupuesto Demo - Ortodoncia</title>
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
        <h2>Presupuesto Demo - Ortodoncia</h2>
        <p>Fecha: ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}</p>
      </div>
      
      <div class="patient-info">
        <h3>Información del Paciente</h3>
        <p><strong>Nombre:</strong> Paciente Demo</p>
        <p><strong>Email:</strong> paciente@ejemplo.com</p>
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
            <tr>
              <td>Ortodoncia Completa</td>
              <td>Brackets metálicos con tratamiento completo de 24 meses</td>
              <td>$2.000.000</td>
            </tr>
            <tr>
              <td>Consulta Ortodóncica</td>
              <td>Evaluación inicial y seguimiento mensual</td>
              <td>$300.000</td>
            </tr>
            <tr>
              <td>Radiografías</td>
              <td>Serie radiográfica completa</td>
              <td>$200.000</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="total">
        <p>Total: $2.500.000</p>
        <p>Estado: Aprobado</p>
      </div>
      
      <div style="margin-top: 20px;">
        <h3>Notas</h3>
        <p>El tratamiento se realizará en 24 meses con revisiones mensuales. Se incluye el mantenimiento durante todo el período de tratamiento.</p>
      </div>
      
      <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
        <p>SmileSys - Sistema de Gestión Dental</p>
        <p>Este es un documento de demostración</p>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': 'inline; filename="presupuesto-ortodoncia-demo.html"',
    },
  });
}
