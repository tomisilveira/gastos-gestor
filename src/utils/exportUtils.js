import * as XLSX from 'xlsx';

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const parsearFecha = (fechaStr) => {
    if (!fechaStr) return new Date();
    const partes = String(fechaStr).split('T')[0].split('-');
    if (partes.length === 3) {
        return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    }
    return new Date(fechaStr);
};

const getFechaFormateada = (fechaStr) => {
    const fecha = parsearFecha(fechaStr);
    const mesNombre = MESES[fecha.getMonth()];
    return `${mesNombre} ${fecha.getFullYear()}`;
};


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
                    getFechaFormateada(gasto.fecha),
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
                    getFechaFormateada(gasto.fecha),
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