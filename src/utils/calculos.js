// Utilidades para cálculos de gastos
export const calcularTotalServicios = (servicios) => {
    return servicios.reduce((total, servicio) => total + parseFloat(servicio.monto || 0), 0);
};

export const calcularGastosPorPropiedad = (gastos, propiedadId) => {
    return gastos
        .filter(gasto => gasto.propiedadId === propiedadId)
        .reduce((total, gasto) => total + parseFloat(gasto.monto || 0), 0);
};

export const dividirGastosComunes = (gastos, cantidadInquilinos) => {
    const totalGastos = calcularTotalServicios(gastos);
    return cantidadInquilinos > 0 ? totalGastos / cantidadInquilinos : 0;
};

export const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(monto);
};