import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// 1. Exportar Ticket de Entrada
export const exportarTicketPDF = (ticketData) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 135]
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FERCHICORP', 40, 12, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Parking & Mobility Division', 40, 16.5, { align: 'center' });
  doc.text('NIT: 9045128019 | Central: (591) 4-4589234', 40, 20.5, { align: 'center' });
  doc.line(5, 23.5, 75, 23.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`PASE DE ACCESO VEHICULAR`, 40, 29, { align: 'center' });
  doc.setFontSize(9);
  doc.text(`${ticketData.ticket_numero}`, 40, 34, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.text(`Matrícula:`, 8, 44);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`${ticketData.placa}`, 35, 44);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Categoría:`, 8, 51);
  doc.text(`${ticketData.tipo_vehiculo || 'Auto'}`, 35, 51);

  doc.text(`Bahía / Celda:`, 8, 58);
  doc.setFont('helvetica', 'bold');
  const celdaDisplay = ticketData.celda_codigo
    ? `${ticketData.celda_codigo}${ticketData.celda_piso ? ` (${ticketData.celda_piso})` : ''}`
    : 'P1-A01';
  doc.text(celdaDisplay, 35, 58);

  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha Ingreso:`, 8, 65);
  doc.text(`${new Date(ticketData.fecha_entrada).toLocaleDateString()}`, 35, 65);

  doc.text(`Hora Exacta:`, 8, 72);
  doc.text(`${new Date(ticketData.fecha_entrada).toLocaleTimeString()}`, 35, 72);

  doc.text(`Régimen:`, 8, 79);
  doc.text(`${ticketData.tarifa_tipo || 'Por Hora'}`, 35, 79);

  doc.line(5, 84, 75, 84);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.text('Presente este comprobante al retirar su unidad.', 40, 90, { align: 'center' });
  doc.text('Custodia monitoreada por FERCHICORP Security.', 40, 94.5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('www.ferchicorp.com', 40, 101, { align: 'center' });

  doc.save(`Ferchicorp_Ticket_${ticketData.ticket_numero}.pdf`);
};

// 2. Exportar Comprobante de Cobro / Salida
export const exportarComprobanteCobroPDF = (pagoData) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 140]
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('FERCHICORP', 40, 12, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('RECIBO OFICIAL DE TESORERÍA', 40, 17, { align: 'center' });
  doc.line(5, 21, 75, 21);

  doc.setFontSize(8.5);
  doc.text(`Transacción: ${pagoData.comprobante_numero || 'CMP-GENERAL'}`, 8, 27);
  doc.text(`Emisión: ${new Date().toLocaleString()}`, 8, 33);
  doc.text(`Unidad / Placa: ${pagoData.placa}`, 8, 39);
  doc.text(`Permanencia: ${pagoData.tiempo_minutos} min`, 8, 45);
  doc.text(`Canal de Pago: ${pagoData.metodo_pago}`, 8, 51);

  doc.line(5, 55, 75, 55);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`IMPORTE TOTAL:`, 8, 63);
  doc.text(`Bs. ${Number(pagoData.monto).toFixed(2)}`, 72, 63, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Efectivo / Recibido:`, 8, 70);
  doc.text(`Bs. ${Number(pagoData.monto_recibido !== undefined ? pagoData.monto_recibido : pagoData.monto).toFixed(2)}`, 72, 70, { align: 'right' });
  doc.text(`Cambio Entregado:`, 8, 76);
  doc.text(`Bs. ${Number(pagoData.cambio || 0).toFixed(2)}`, 72, 76, { align: 'right' });

  doc.line(5, 82, 75, 82);
  doc.setFontSize(7.5);
  doc.text('Barrera de salida habilitada.', 40, 89, { align: 'center' });
  doc.text('FERCHICORP — Innovación en Gestión Vehicular', 40, 94, { align: 'center' });

  doc.save(`Ferchicorp_Recibo_${pagoData.placa}.pdf`);
};

// 3. Exportar Reporte General de Transacciones y Caja
export const exportarReporteCajaPDF = (transacciones, resumen) => {
  const doc = new jsPDF();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('FERCHICORP — AUDITORÍA Y ARQUEO DE CAJA', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`, 14, 25);
  doc.text(`Recaudación Neta: Bs. ${Number(resumen.ingresosHoy || 0).toFixed(2)} | Operaciones Registradas: ${transacciones.length}`, 14, 30);

  const tableColumn = ['#', 'N° Comprobante', 'Concepto Operativo', 'Canal Pago', 'Importe (Bs.)', 'Fecha/Hora', 'Estado'];
  const tableRows = [];

  transacciones.forEach((t) => {
    tableRows.push([
      t.id,
      t.comprobante_numero || 'N/A',
      t.concepto,
      t.metodo_pago,
      Number(t.monto).toFixed(2),
      new Date(t.fecha_pago).toLocaleString(),
      t.activo !== false ? 'Válido' : 'Anulado'
    ]);
  });

  autoTable(doc, {
    startY: 36,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [245, 158, 11] },
    styles: { fontSize: 8 }
  });

  doc.save(`Ferchicorp_Caja_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// 4. Exportar Reporte de Clientes y Mensualidades
export const exportarReporteClientesPDF = (clientes) => {
  const doc = new jsPDF();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('FERCHICORP — PADRÓN DE CLIENTES Y CONVENIOS', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`, 14, 25);

  const tableColumn = ['Titular', 'Documento CI/NIT', 'Contacto', 'Modalidad', 'Vigencia Plan', 'Vencimiento', 'Estado'];
  const tableRows = [];

  clientes.forEach((c) => {
    tableRows.push([
      c.nombre_completo,
      c.ci_nit,
      c.telefono || 'S/N',
      c.es_mensualidad ? 'Abonado Mensual' : 'Visitante',
      c.estado_mensualidad || 'Sin Plan',
      c.fecha_fin_mensualidad ? String(c.fecha_fin_mensualidad).slice(0, 10) : '-',
      c.activo !== false ? 'Habilitado' : 'Suspendido'
    ]);
  });

  autoTable(doc, {
    startY: 32,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [245, 158, 11] },
    styles: { fontSize: 8 }
  });

  doc.save(`Ferchicorp_Clientes_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// 5. Exportar Reporte de Vehículos
export const exportarReporteVehiculosPDF = (vehiculos) => {
  const doc = new jsPDF();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('FERCHICORP — FLOTA Y PARQUE AUTOMOTOR REGISTRADO', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`, 14, 25);

  const tableColumn = ['Matrícula', 'Clase', 'Marca', 'Modelo', 'Color', 'Propietario / Vínculo', 'Estado'];
  const tableRows = [];

  vehiculos.forEach((v) => {
    tableRows.push([
      v.placa,
      v.tipo,
      v.marca || '-',
      v.modelo || '-',
      v.color || '-',
      v.propietario_nombre || 'Visitante Ocasional',
      v.activo !== false ? 'Habilitado' : 'Inactivo'
    ]);
  });

  autoTable(doc, {
    startY: 32,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [245, 158, 11] },
    styles: { fontSize: 8 }
  });

  doc.save(`Ferchicorp_Vehiculos_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// 6. Exportar Reporte de Celdas / Espacios
export const exportarReporteCeldasPDF = (celdas) => {
  const doc = new jsPDF();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('FERCHICORP — INFRAESTRUCTURA DE CELDAS Y SECTORES', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de Emisión: ${new Date().toLocaleString()}`, 14, 25);

  const tableColumn = ['Código Bahía', 'Nivel / Piso', 'Zona / Sector', 'Clase Admitida', 'Ocupación', 'Operatividad'];
  const tableRows = [];

  celdas.forEach((c) => {
    tableRows.push([
      c.codigo,
      c.piso,
      c.sector,
      c.tipo_permitido,
      c.estado,
      c.activo !== false ? 'Habilitada' : 'Clausurada'
    ]);
  });

  autoTable(doc, {
    startY: 32,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [245, 158, 11] },
    styles: { fontSize: 8 }
  });

  doc.save(`Ferchicorp_Celdas_${new Date().toISOString().slice(0, 10)}.pdf`);
};
