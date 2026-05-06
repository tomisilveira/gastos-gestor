import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const exportarAExcel = (datos, mes, año, esIndividual) => {
    const workbook = XLSX.utils.book_new();

    if (esIndividual) {
        // Exportar una sola propiedad
        Object.entries(datos.gastosAgrupados).forEach(([id, data]) => {
            const hojaData = [
                [`GASTOS - ${data.propiedad.nombre} - ${mes}/${año}`],
                [`Dirección: ${data.propiedad.direccion}`],
                [''],
                ['Fecha', 'Concepto', 'Categoría', 'Monto', 'Descripción'],
                ...data.gastos.map(gasto => [
                    format(new Date(gasto.fecha), 'dd/MM/yyyy'),
                    gasto.concepto,
                    gasto.categoria,
                    gasto.monto,
                    gasto.descripcion || ''
                ]),
                [''],
                ['', '', 'TOTAL', data.total, '']
            ];

            const hoja = XLSX.utils.aoa_to_sheet(hojaData);
            XLSX.utils.book_append_sheet(workbook, hoja, data.propiedad.nombre.substring(0, 30));
        });
    } else {
        // Exportar todas las propiedades
        // Hoja resumen
        const resumenData = [
            [`RESUMEN DE GASTOS - ${mes}/${año}`],
            [''],
            ['Propiedad', 'Dirección', 'Total Gastos'],
            ...Object.entries(datos.gastosAgrupados).map(([id, data]) => [
                data.propiedad.nombre,
                data.propiedad.direccion,
                data.total
            ]),
            [''],
            ['TOTAL GENERAL', '', datos.totalGeneral]
        ];

        const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
        XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen');

        // Hojas individuales por propiedad
        Object.entries(datos.gastosAgrupados).forEach(([id, data]) => {
            const hojaData = [
                [`${data.propiedad.nombre} - ${data.propiedad.direccion}`],
                [''],
                ['Fecha', 'Concepto', 'Categoría', 'Monto', 'Descripción'],
                ...data.gastos.map(gasto => [
                    format(new Date(gasto.fecha), 'dd/MM/yyyy'),
                    gasto.concepto,
                    gasto.categoria,
                    gasto.monto,
                    gasto.descripcion || ''
                ]),
                [''],
                ['', '', 'TOTAL', data.total, '']
            ];

            const hoja = XLSX.utils.aoa_to_sheet(hojaData);
            XLSX.utils.book_append_sheet(workbook, hoja, data.propiedad.nombre.substring(0, 30));
        });
    }

    const nombreArchivo = `Gastos_${mes}_${año}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
};