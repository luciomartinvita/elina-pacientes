const Exportar = {

    /**
     * Genera un PDF con los pacientes del mes actual (o del mes seleccionado en el filtro).
     * @param {Array} pacientes - Lista completa de pacientes ya cargados en el estado.
     * @param {string} mesSeleccionado - Formato 'YYYY-MM' del filtro activo (opcional).
     */
    descargarPDF(pacientes, mesSeleccionado = null) {
        const { jsPDF } = window.jspdf;

        // Determinar mes a exportar
        const ahora = new Date();
        const mesFiltro = mesSeleccionado ||
            `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

        // Filtrar pacientes del mes
        const del_mes = pacientes.filter(p => p.fecha && p.fecha.startsWith(mesFiltro));

        if (del_mes.length === 0) {
            return { exito: false, mensaje: 'No hay pacientes para el mes seleccionado.' };
        }

        // Nombre legible del mes
        const [anio, mes] = mesFiltro.split('-');
        const nombreMes = new Date(parseInt(anio), parseInt(mes) - 1, 1)
            .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

        // Crear doc PDF (A4 apaisado para que entren todas las columnas)
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        // ── Encabezado ────────────────────────────────────────────────
        doc.setFillColor(15, 107, 89);       // Verde médico
        doc.rect(0, 0, 297, 22, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Registro Quirúrgico — Dra. Elina Melo', 14, 10);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Pacientes de ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}`, 14, 17);

        // Fecha de impresión (derecha)
        const fechaImp = new Date().toLocaleDateString('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        doc.text(`Generado: ${fechaImp}`, 297 - 14, 17, { align: 'right' });

        // ── Tabla ─────────────────────────────────────────────────────
        const columnas = [
            { header: 'Fecha',      dataKey: 'fecha' },
            { header: 'Paciente',   dataKey: 'nombre' },
            { header: 'DNI',        dataKey: 'dni' },
            { header: 'Obra Social',dataKey: 'obra_social' },
            { header: 'Cirugía',    dataKey: 'cirugia' },
            { header: 'Notas',      dataKey: 'notas' },
        ];

        const filas = del_mes.map(p => {
            const parts = p.fecha.split('-');
            return {
                fecha:       `${parts[2]}/${parts[1]}/${parts[0]}`,
                nombre:      p.nombre ? p.nombre.trim() : '',
                dni:         p.dni || '—',
                obra_social: p.obra_social || '—',
                cirugia:     p.cirugia || '—',
                notas:       p.notas || '',
            };
        });

        doc.autoTable({
            startY: 26,
            columns: columnas,
            body: filas,
            styles: {
                fontSize: 9,
                cellPadding: 3,
                textColor: [30, 41, 59],
                lineColor: [200, 210, 220],
                lineWidth: 0.2,
            },
            headStyles: {
                fillColor: [15, 107, 89],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9,
            },
            alternateRowStyles: {
                fillColor: [240, 249, 245],
            },
            columnStyles: {
                fecha:       { cellWidth: 22 },
                nombre:      { cellWidth: 50 },
                dni:         { cellWidth: 25 },
                obra_social: { cellWidth: 35 },
                cirugia:     { cellWidth: 65 },
                notas:       { cellWidth: 'auto' },
            },
            margin: { left: 14, right: 14 },
            didDrawPage(data) {
                // Pie de página con número
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(
                    `Página ${data.pageNumber} de ${pageCount}`,
                    297 / 2, 210 - 5,
                    { align: 'center' }
                );
            }
        });

        // ── Resumen al final ─────────────────────────────────────────
        const finalY = doc.lastAutoTable.finalY + 6;
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total de cirugías: ${del_mes.length}`, 14, finalY);

        // ── Guardar ───────────────────────────────────────────────────
        const nombreArchivo = `pacientes_${mesFiltro}.pdf`;
        doc.save(nombreArchivo);

        return { exito: true, mensaje: `PDF exportado: ${nombreArchivo}` };
    }
};
