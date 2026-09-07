import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { ElectricalNode, ElectricalEdge, ProjectConfig, ElectricalAlert } from '../types/electrical';
import { calculateVoltageDrop, getAmpacity } from './electricalCalculations';

export async function exportFullProjectPDF(
  nodes: ElectricalNode[],
  edges: ElectricalEdge[],
  config: ProjectConfig,
  alerts: ElectricalAlert[]
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const today = new Date().toLocaleDateString('es-PA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // --- PÁGINA 1: CARÁTULA Y REPORTE TÉCNICO ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE TÉCNICO ELÉCTRICO INTEGRAL', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Proyecto: ${config.projectName} • Diseñador: ${config.designerName}`, 14, 23);

  doc.text(`Fecha: ${today}`, 160, 23);

  // Cuadro de Información del Proyecto
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. MEMORIA DESCRIPTIVA Y DATOS GENERALES', 14, 40);

  const totalKW = nodes.reduce((acc, n) => acc + (n.properties.loadPowerKW || 0), 0);
  const totalAmps = config.simulatedAmperage || 820;

  autoTable(doc, {
    startY: 45,
    head: [['Parámetro de Instalación', 'Valor de Diseño', 'Observación Técnica']],
    body: [
      ['Proyecto / Localización', `${config.projectName} - ${config.location}`, 'Aprobación para trámites de bomberos'],
      ['Ingeniero / Diseñador', config.designerName, 'Idóneo ante Junta Técnica de Ing. y Arq.'],
      ['Tipo de Acometida', config.serviceType === 'aerea' ? 'Aérea Monofásica 3 Hilos' : 'Subterránea en Ducto PVC', 'Límite de propiedad / Punto de entrega'],
      ['Tensión y Frecuencia', `${config.nominalVoltage}/120 V - 60 Hz`, 'Sistema bifilar con neutro puesto a tierra'],
      ['Protección General (IP)', `${config.mainBreakerAmps} A Caja Moldeada`, 'Capacidad interruptiva verificada'],
      ['Demanda Eléctrica Total', `${totalAmps} A (${totalKW.toFixed(1)} kW)`, `Factor de Potencia Global: ${config.globalPowerFactor}`],
      ['Distancia de Acometida', `${config.feederLengthMeters} metros`, 'Cálculo de alimentador principal'],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
  });

  // Resumen de Alertas y Diagnóstico Normativo
  const currentY2 = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. DIAGNÓSTICO Y CONFORMIDAD NORMATIVA', 14, currentY2);

  if (alerts.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 101, 52);
    doc.text('✓ La instalación cumple satisfactoriamente con los criterios de ampacidad, caída de tensión y protecciones.', 14, currentY2 + 8);
  } else {
    const alertRows = alerts.map(a => [
      a.emoji,
      a.title,
      a.description,
      a.standardRule,
      a.suggestedFix.label,
    ]);

    autoTable(doc, {
      startY: currentY2 + 5,
      head: [['', 'Alerta Detectada', 'Descripción del Hallazgo', 'Norma Violada', 'Acción Correctiva']],
      body: alertRows,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2 },
      headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255] },
    });
  }

  // --- PÁGINA 2: CÓMPUTO DE MATERIALES ---
  doc.addPage();
  doc.setFillColor(30, 58, 138); // bg-blue-900
  doc.rect(0, 0, 210, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('3. CÁLCULO DE MATERIALES Y TUBERÍAS', 14, 16);
  
  doc.setTextColor(15, 23, 42);

  // Calcular totales
  let totalConduitEMT = 0;
  let totalConduitPVC = 0;
  let totalConduitRMC = 0;
  let totalWire = 0;

  nodes.forEach(node => {
    const dist = node.properties.distanceMeters || 0;
    if (node.properties.conduitType === 'EMT') totalConduitEMT += dist;
    else if (node.properties.conduitType === 'PVC') totalConduitPVC += dist;
    else if (node.properties.conduitType === 'RMC') totalConduitRMC += dist;
    
    // Wire length (assuming 3 wires per conduit for simplicity)
    totalWire += dist * 3;
  });

  const conduitRows = [
    ['Tubería Conduit EMT (Metálica)', `${totalConduitEMT.toFixed(2)} m`, `${Math.ceil(totalConduitEMT / 3)} tubos (3m)`],
    ['Tubería Conduit PVC (Plástica)', `${totalConduitPVC.toFixed(2)} m`, `${Math.ceil(totalConduitPVC / 3)} tubos (3m)`],
    ['Tubería Conduit RMC (Rígida)', `${totalConduitRMC.toFixed(2)} m`, `${Math.ceil(totalConduitRMC / 3)} tubos (3m)`],
    ['Conductor Eléctrico Total (Fases + Neutro + Tierra)', `${totalWire.toFixed(2)} m`, 'Metraje lineal estimado']
  ];

  autoTable(doc, {
    startY: 35,
    head: [['Descripción de Canalización/Cable', 'Metraje Total Estimado', 'Unidades Comerciales']],
    body: conduitRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
  });

  // Equipos y Cajas
  const equipmentRows = nodes.map(node => [
    node.label,
    node.type,
    node.properties.ratedCurrent ? `${node.properties.ratedCurrent}A` : 'N/A',
    node.properties.conduitSize || 'N/A',
    '1 ud'
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Equipo / Componente', 'Tipo', 'Capacidad', 'Salida / Diámetro', 'Cantidad']],
    body: equipmentRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
  });

  // --- PÁGINA 3: PLANO CAD UNIFILAR (LANDSCAPE) ---
  doc.addPage('a4', 'landscape');
  
  // Fondo blanco técnico de plano CAD
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 297, 210, 'F');

  // Marco perimetral normativo con margen doble de plano
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.rect(8, 8, 281, 194);
  doc.setLineWidth(0.25);
  doc.rect(10, 10, 277, 190);

  // Carátula de Plano (Title Block) en esquina inferior derecha
  const tbX = 205;
  const tbY = 145;
  const tbW = 82;
  const tbH = 55;

  doc.setFillColor(248, 250, 252);
  doc.rect(tbX, tbY, tbW, tbH, 'FD');
  doc.setLineWidth(0.4);
  doc.rect(tbX, tbY, tbW, tbH);

  // Divisiones de carátula
  doc.line(tbX, tbY + 12, tbX + tbW, tbY + 12);
  doc.line(tbX, tbY + 24, tbX + tbW, tbY + 24);
  doc.line(tbX, tbY + 36, tbX + tbW, tbY + 36);
  doc.line(tbX + 45, tbY + 36, tbX + 45, tbY + tbH);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PLANO ELÉCTRICO UNIFILAR', tbX + 4, tbY + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`PROYECTO: ${config.projectName.substring(0, 32)}`, tbX + 4, tbY + 10);
  
  doc.setFontSize(7);
  doc.text(`UBICACIÓN: ${config.location.substring(0, 35)}`, tbX + 4, tbY + 16);
  doc.text(`SUMINISTRADOR: ${config.utilityProvider} • Tensión: ${config.nominalVoltage}/120V`, tbX + 4, tbY + 21);
  
  doc.text(`DISEÑÓ: ${config.designerName}`, tbX + 4, tbY + 29);
  doc.text(`CAPACIDAD TOTAL: ${config.simulatedAmperage || 820}A • IP: ${config.mainBreakerAmps}A`, tbX + 4, tbY + 33);
  
  doc.text('ESCALA: SIN ESCALA (ESQUEMA)', tbX + 4, tbY + 41);
  doc.text(`FECHA: ${today}`, tbX + 4, tbY + 46);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('LÁMINA:', tbX + 49, tbY + 43);
  
  doc.setFontSize(14);
  doc.text('E - 01', tbX + 51, tbY + 51);

  // Título del plano en la parte superior izquierda
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DIAGRAMA UNIFILAR GENERAL Y DETALLE DE MEDICIÓN MÚLTIPLE', 15, 17);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('ESPECIFICACIONES: CONDUCTORES THHN/THWN EN TUBERÍA CONDUIT RMC/EMT • PUESTA A TIERRA DE SEGURIDAD', 15, 22);

  // Escala de coordenadas del canvas al plano PDF
  // Área útil de dibujo en PDF: X: 15 a 195, Y: 30 a 190
  const minCanvasX = Math.min(...nodes.map(n => n.x), 50);
  const maxCanvasX = Math.max(...nodes.map(n => n.x), 900);
  const minCanvasY = Math.min(...nodes.map(n => n.y), 50);
  const maxCanvasY = Math.max(...nodes.map(n => n.y), 450);

  const mapX = (x: number) => 18 + ((x - minCanvasX) / (maxCanvasX - minCanvasX || 1)) * 175;
  const mapY = (y: number) => 35 + ((y - minCanvasY) / (maxCanvasY - minCanvasY || 1)) * 135;

  // Dibujar conexiones (aristas) estilo CAD
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);

  const nodePos = new Map<string, { x: number; y: number; node: ElectricalNode }>();
  nodes.forEach(n => {
    nodePos.set(n.id, { x: mapX(n.x), y: mapY(n.y), node: n });
  });

  edges.forEach(e => {
    const from = nodePos.get(e.fromNodeId);
    const to = nodePos.get(e.toNodeId);
    if (from && to) {
      // Línea ortogonal estilo CAD
      doc.line(from.x, from.y, to.x, from.y);
      doc.line(to.x, from.y, to.x, to.y);
      
      // Puntos de conexión (nodos)
      doc.setFillColor(30, 41, 59);
      doc.circle(from.x, from.y, 0.8, 'F');
      doc.circle(to.x, to.y, 0.8, 'F');
    }
  });

  // Dibujar símbolos eléctricos esquemáticos
  nodes.forEach(n => {
    const pos = nodePos.get(n.id)!;
    const { x, y } = pos;
    
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    
    // Caja de símbolo
    doc.rect(x - 9, y - 5, 18, 10, 'FD');
    
    // Símbolo representativo según tipo
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    
    if (n.type === 'acometida_aerea' || n.type === 'acometida_subterranea') {
      doc.text('⚡ ACOM', x - 7, y + 1);
    } else if (n.type === 'interruptor_principal' || n.type === 'breaker_termomagnetico') {
      doc.text(`[ ${n.properties.ratedCurrent}A ]`, x - 7, y + 1);
    } else if (n.type === 'medidor') {
      doc.circle(x, y, 3.5, 'S');
      doc.text('kWh', x - 3, y + 1);
    } else if (n.type === 'barra_distribucion') {
      doc.setFillColor(202, 138, 4);
      doc.rect(x - 8, y - 2, 16, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('BUSBAR', x - 6, y + 1);
      doc.setTextColor(15, 23, 42);
    } else if (n.type === 'tierra_fisica') {
      doc.line(x - 4, y, x + 4, y);
      doc.line(x - 2.5, y + 2, x + 2.5, y + 2);
      doc.line(x - 1, y + 4, x + 1, y + 4);
    } else {
      doc.text(n.properties.tag || n.type.substring(0, 6).toUpperCase(), x - 7, y + 1);
    }
    
    // Texto de especificación bajo el equipo
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(n.label.substring(0, 22), x - 9, y + 8);
    
    doc.setTextColor(71, 85, 105);
    doc.text(`${n.properties.conductorGauge} • ${n.properties.conduitSize}`, x - 9, y + 11);
  });

  // Cuadro de simbología y notas en la esquina superior derecha
  const noteX = 205;
  const noteY = 30;
  
  doc.setLineWidth(0.3);
  doc.rect(noteX, noteY, 82, 105);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('NOTAS GENERALES Y LEYENDA', noteX + 4, noteY + 6);
  
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  
  const notes = [
    '1. Toda la instalación cumplirá el Código Eléctrico Nacional.',
    '2. Los conductores de cobre serán THHN/THWN-2 a 75°C mín.',
    '3. Tubería conduit metálica RMC en acometida y EMT en derivados.',
    '4. La caída de tensión máxima admisible no superará el 3.0%.',
    '5. Conexión equipotencial de neutro y tierra en el gabinete principal.',
    '6. Medidores con base tipo socket 4 mordazas aprobada por ENSA.',
    '7. Interruptor principal 1200A calibrado para selectividad térmica.',
    '8. Varilla de puesta a tierra de cobre 5/8" x 2.40m con R < 25 Ohms.',
  ];
  
  notes.forEach((nt, idx) => {
    doc.text(nt, noteX + 4, noteY + 14 + idx * 7);
  });

  // --- PÁGINA 4: VISTA ESTÁTICA DEL DIAGRAMA ACTUAL ---
  try {
    const canvasElement = document.getElementById('canvas-background');
    if (canvasElement) {
      doc.addPage('a4', 'landscape');
      
      doc.setFillColor(15, 23, 42); // slate-900 header
      doc.rect(0, 0, 297, 20, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('4. VISTA EN TIEMPO REAL DEL LIENZO', 14, 13);
      
      // Temporarily remove infinite background pattern for cleaner capture
      const originalBg = canvasElement.style.background;
      const originalBgColor = canvasElement.style.backgroundColor;
      canvasElement.style.background = 'none';
      canvasElement.style.backgroundColor = '#121418';
      
      const canvas = await html2canvas(canvasElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#121418',
        logging: false
      });
      
      // Restore styles
      canvasElement.style.background = originalBg;
      canvasElement.style.backgroundColor = originalBgColor;
      
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      
      // Calculate scaling to fit A4 landscape (297x210) while maintaining aspect ratio
      const pdfWidth = 277; // Margins of 10mm
      const pdfHeight = 175; // 210 - 20 (header) - 15 (margins)
      
      const imgProps = doc.getImageProperties(imgData);
      const ratio = imgProps.width / imgProps.height;
      
      let renderWidth = pdfWidth;
      let renderHeight = renderWidth / ratio;
      
      if (renderHeight > pdfHeight) {
        renderHeight = pdfHeight;
        renderWidth = renderHeight * ratio;
      }
      
      const xPos = 10 + (pdfWidth - renderWidth) / 2;
      const yPos = 25 + (pdfHeight - renderHeight) / 2;
      
      doc.addImage(imgData, 'JPEG', xPos, yPos, renderWidth, renderHeight);
    }
  } catch (err) {
    console.error('Failed to capture canvas screenshot for PDF', err);
  }

  doc.save(`Reporte_Integral_${config.projectName.replace(/\s+/g, '_')}.pdf`);
}


export function exportA4BlueprintCAD(
  nodes: ElectricalNode[],
  edges: ElectricalEdge[],
  config: ProjectConfig
): void {
  // A4 Apaisado (Landscape): 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Fondo blanco técnico de plano CAD
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 297, 210, 'F');

  // Marco perimetral normativo con margen doble de plano
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.rect(8, 8, 281, 194);
  doc.setLineWidth(0.25);
  doc.rect(10, 10, 277, 190);

  // Carátula de Plano (Title Block) en esquina inferior derecha
  const tbX = 205;
  const tbY = 145;
  const tbW = 82;
  const tbH = 55;

  doc.setFillColor(248, 250, 252);
  doc.rect(tbX, tbY, tbW, tbH, 'FD');
  doc.setLineWidth(0.4);
  doc.rect(tbX, tbY, tbW, tbH);

  // Divisiones de carátula
  doc.line(tbX, tbY + 12, tbX + tbW, tbY + 12);
  doc.line(tbX, tbY + 24, tbX + tbW, tbY + 24);
  doc.line(tbX, tbY + 36, tbX + tbW, tbY + 36);
  doc.line(tbX + 45, tbY + 36, tbX + 45, tbY + tbH);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PLANO ELÉCTRICO UNIFILAR', tbX + 4, tbY + 6);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`PROYECTO: ${config.projectName.substring(0, 32)}`, tbX + 4, tbY + 10);

  doc.setFontSize(7);
  doc.text(`UBICACIÓN: ${config.location.substring(0, 35)}`, tbX + 4, tbY + 16);
  doc.text(`SUMINISTRADOR: ${config.utilityProvider} • Tensión: ${config.nominalVoltage}/120V`, tbX + 4, tbY + 21);

  doc.text(`DISEÑÓ: ${config.designerName}`, tbX + 4, tbY + 29);
  doc.text(`CAPACIDAD TOTAL: ${config.simulatedAmperage || 820}A • IP: ${config.mainBreakerAmps}A`, tbX + 4, tbY + 33);

  doc.text('ESCALA: SIN ESCALA (ESQUEMA)', tbX + 4, tbY + 41);
  doc.text(`FECHA: ${new Date().toLocaleDateString('es-PA')}`, tbX + 4, tbY + 46);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('LÁMINA:', tbX + 49, tbY + 43);
  doc.setFontSize(14);
  doc.text('E - 01', tbX + 51, tbY + 51);

  // Título del plano en la parte superior izquierda
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DIAGRAMA UNIFILAR GENERAL Y DETALLE DE MEDICIÓN MÚLTIPLE', 15, 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('ESPECIFICACIONES: CONDUCTORES THHN/THWN EN TUBERÍA CONDUIT RMC/EMT • PUESTA A TIERRA DE SEGURIDAD', 15, 22);

  // Escala de coordenadas del canvas al plano PDF
  // Área útil de dibujo en PDF: X: 15 a 195, Y: 30 a 190
  const minCanvasX = Math.min(...nodes.map(n => n.x), 50);
  const maxCanvasX = Math.max(...nodes.map(n => n.x), 900);
  const minCanvasY = Math.min(...nodes.map(n => n.y), 50);
  const maxCanvasY = Math.max(...nodes.map(n => n.y), 450);

  const mapX = (x: number) => 18 + ((x - minCanvasX) / (maxCanvasX - minCanvasX)) * 175;
  const mapY = (y: number) => 35 + ((y - minCanvasY) / (maxCanvasY - minCanvasY)) * 135;

  // Dibujar conexiones (aristas) estilo CAD
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);

  const nodePos = new Map<string, { x: number; y: number; node: ElectricalNode }>();
  nodes.forEach(n => {
    nodePos.set(n.id, { x: mapX(n.x), y: mapY(n.y), node: n });
  });

  edges.forEach(e => {
    const from = nodePos.get(e.fromNodeId);
    const to = nodePos.get(e.toNodeId);
    if (from && to) {
      // Línea ortogonal estilo CAD
      doc.line(from.x, from.y, to.x, from.y);
      doc.line(to.x, from.y, to.x, to.y);

      // Puntos de conexión (nodos)
      doc.setFillColor(30, 41, 59);
      doc.circle(from.x, from.y, 0.8, 'F');
      doc.circle(to.x, to.y, 0.8, 'F');
    }
  });

  // Dibujar símbolos eléctricos esquemáticos
  nodes.forEach(n => {
    const pos = nodePos.get(n.id)!;
    const { x, y } = pos;

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);

    // Caja de símbolo
    doc.rect(x - 9, y - 5, 18, 10, 'FD');

    // Símbolo representativo según tipo
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);

    if (n.type === 'acometida_aerea' || n.type === 'acometida_subterranea') {
      doc.text('⚡ ACOM', x - 7, y + 1);
    } else if (n.type === 'interruptor_principal' || n.type === 'breaker_termomagnetico') {
      doc.text(`[ ${n.properties.ratedCurrent}A ]`, x - 7, y + 1);
    } else if (n.type === 'medidor') {
      doc.circle(x, y, 3.5, 'S');
      doc.text('kWh', x - 3, y + 1);
    } else if (n.type === 'barra_distribucion') {
      doc.setFillColor(202, 138, 4);
      doc.rect(x - 8, y - 2, 16, 4, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('BUSBAR', x - 6, y + 1);
      doc.setTextColor(15, 23, 42);
    } else if (n.type === 'tierra_fisica') {
      doc.line(x - 4, y, x + 4, y);
      doc.line(x - 2.5, y + 2, x + 2.5, y + 2);
      doc.line(x - 1, y + 4, x + 1, y + 4);
    } else {
      doc.text(n.properties.tag || n.type.substring(0, 6).toUpperCase(), x - 7, y + 1);
    }

    // Texto de especificación bajo el equipo
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(n.label.substring(0, 22), x - 9, y + 8);
    doc.setTextColor(71, 85, 105);
    doc.text(`${n.properties.conductorGauge} • ${n.properties.conduitSize}`, x - 9, y + 11);
  });

  // Cuadro de simbología y notas en la esquina superior derecha
  const noteX = 205;
  const noteY = 30;
  doc.setLineWidth(0.3);
  doc.rect(noteX, noteY, 82, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('NOTAS GENERALES Y LEYENDA', noteX + 4, noteY + 6);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const notes = [
    '1. Toda la instalación cumplirá el Código Eléctrico Nacional.',
    '2. Los conductores de cobre serán THHN/THWN-2 a 75°C mín.',
    '3. Tubería conduit metálica RMC en acometida y EMT en derivados.',
    '4. La caída de tensión máxima admisible no superará el 3.0%.',
    '5. Conexión equipotencial de neutro y tierra en el gabinete principal.',
    '6. Medidores con base tipo socket 4 mordazas aprobada por ENSA.',
    '7. Interruptor principal 1200A calibrado para selectividad térmica.',
    '8. Varilla de puesta a tierra de cobre 5/8" x 2.40m con R < 25 Ohms.',
  ];

  notes.forEach((nt, idx) => {
    doc.text(nt, noteX + 4, noteY + 14 + idx * 7);
  });

  doc.save(`Plano_A4_CAD_${config.projectName.replace(/\s+/g, '_')}.pdf`);
}

export function exportMaterialsListPDF(
  nodes: ElectricalNode[],
  config: ProjectConfig
): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(30, 58, 138); // bg-blue-900
  doc.rect(0, 0, 210, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CÁLCULO DE MATERIALES Y TUBERÍAS', 14, 16);
  
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Proyecto: ${config.projectName}`, 14, 35);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-PA')}`, 14, 42);

  // Calcular totales
  let totalConduitEMT = 0;
  let totalConduitPVC = 0;
  let totalConduitRMC = 0;
  let totalWire = 0;

  nodes.forEach(node => {
    const dist = node.properties.distanceMeters || 0;
    if (node.properties.conduitType === 'EMT') totalConduitEMT += dist;
    else if (node.properties.conduitType === 'PVC') totalConduitPVC += dist;
    else if (node.properties.conduitType === 'RMC') totalConduitRMC += dist;
    
    // Wire length (assuming 3 wires per conduit for simplicity)
    totalWire += dist * 3;
  });

  const conduitRows = [
    ['Tubería Conduit EMT (Metálica)', `${totalConduitEMT.toFixed(2)} m`, `${Math.ceil(totalConduitEMT / 3)} tubos (3m)`],
    ['Tubería Conduit PVC (Plástica)', `${totalConduitPVC.toFixed(2)} m`, `${Math.ceil(totalConduitPVC / 3)} tubos (3m)`],
    ['Tubería Conduit RMC (Rígida)', `${totalConduitRMC.toFixed(2)} m`, `${Math.ceil(totalConduitRMC / 3)} tubos (3m)`],
    ['Conductor Eléctrico Total (Fases + Neutro + Tierra)', `${totalWire.toFixed(2)} m`, 'Metraje lineal estimado']
  ];

  autoTable(doc, {
    startY: 50,
    head: [['Descripción de Canalización/Cable', 'Metraje Total Estimado', 'Unidades Comerciales']],
    body: conduitRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
  });

  // Equipos y Cajas
  const equipmentRows = nodes.map(node => [
    node.label,
    node.type,
    node.properties.ratedCurrent ? `${node.properties.ratedCurrent}A` : 'N/A',
    node.properties.conduitSize || 'N/A',
    '1 ud'
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Equipo / Componente', 'Tipo', 'Capacidad', 'Salida / Diámetro', 'Cantidad']],
    body: equipmentRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
  });

  doc.save(`Materiales_Cubicacion_${config.projectName.replace(/\s+/g, '_')}.pdf`);
}
