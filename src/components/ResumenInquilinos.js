import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    calcularTotalServicios,
    formatearMoneda
} from '../utils/calculos';

function ResumenInquilinos({ gastos, propiedades, mes, año }) {
    const gastosFiltrados = useMemo(() => {
        return gastos.filter(gasto => {
            const fechaGasto = new Date(gasto.fecha);
            return fechaGasto.getMonth() === mes &&
                fechaGasto.getFullYear() === año;
        });
    }, [gastos, mes, año]);

    const resumenPorInquilino = useMemo(() => {
        const resumen = {};

        propiedades.forEach(propiedad => {
            // Gastos específicos de esta propiedad
            const gastosPropiedad = gastosFiltrados.filter(
                g => g.propiedadId === propiedad.id
            );

            // Gastos compartidos entre todos
            const gastosCompartidos = gastosFiltrados.filter(
                g => !g.propiedadId && g.esCompartido !== false
            );

            const totalGastosPropiedad = calcularTotalServicios(gastosPropiedad);
            const totalGastosCompartidos = calcularTotalServicios(gastosCompartidos);

            // Dividir gastos compartidos entre inquilinos
            const parteCompartida = propiedad.inquilinos > 0
                ? totalGastosCompartidos / propiedad.inquilinos
                : 0;

            const totalAPagar = totalGastosPropiedad + parteCompartida;

            resumen[propiedad.id] = {
                propiedad: propiedad,
                gastosPropiedad: gastosPropiedad,
                gastosCompartidos: gastosCompartidos,
                totalPropiedad: totalGastosPropiedad,
                totalCompartido: totalGastosCompartidos,
                parteCompartida: parteCompartida,
                totalAPagar: totalAPagar,
                totalPorInquilino: propiedad.inquilinos > 0
                    ? totalAPagar / propiedad.inquilinos
                    : totalAPagar
            };
        });

        return resumen;
    }, [gastosFiltrados, propiedades]);

    const nombreMes = format(new Date(año, mes), 'MMMM', { locale: es });

    return (
        <div className="resumen-inquilinos">
            <h2>📋 Resumen para Inquilinos - {nombreMes} {año}</h2>

            {Object.values(resumenPorInquilino).length === 0 ? (
                <div className="sin-datos">
                    <p>No hay gastos registrados para este período</p>
                    <p>Agrega gastos en la sección "Agregar Gastos" para ver el resumen aquí</p>
                </div>
            ) : (
                Object.values(resumenPorInquilino).map((resumen) => (
                    <div key={resumen.propiedad.id} className="resumen-propiedad">
                        <div className="resumen-header">
                            <h3>🏠 {resumen.propiedad.nombre}</h3>
                            <div className="resumen-info">
                                <span>📍 {resumen.propiedad.direccion}</span>
                                <span>👥 {resumen.propiedad.inquilinos} inquilino(s)</span>
                            </div>
                        </div>

                        <div className="resumen-detalle">
                            <div className="seccion-gastos">
                                <h4>Gastos de la Propiedad</h4>
                                {resumen.gastosPropiedad.length > 0 ? (
                                    <table className="tabla-gastos">
                                        <thead>
                                            <tr>
                                                <th>Concepto</th>
                                                <th>Fecha</th>
                                                <th>Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {resumen.gastosPropiedad.map(gasto => (
                                                <tr key={gasto.id}>
                                                    <td>{gasto.concepto}</td>
                                                    <td>{format(new Date(gasto.fecha), 'dd/MM/yyyy')}</td>
                                                    <td>{formatearMoneda(gasto.monto)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan="2"><strong>Subtotal Propiedad</strong></td>
                                                <td><strong>{formatearMoneda(resumen.totalPropiedad)}</strong></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                ) : (
                                    <p className="sin-gastos-seccion">Sin gastos específicos</p>
                                )}
                            </div>

                            <div className="seccion-gastos">
                                <h4>Gastos Compartidos</h4>
                                {resumen.gastosCompartidos.length > 0 ? (
                                    <table className="tabla-gastos">
                                        <thead>
                                            <tr>
                                                <th>Concepto</th>
                                                <th>Total</th>
                                                <th>Tu Parte ({resumen.propiedad.inquilinos} inquilinos)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {resumen.gastosCompartidos.map(gasto => (
                                                <tr key={gasto.id}>
                                                    <td>{gasto.concepto}</td>
                                                    <td>{formatearMoneda(gasto.monto)}</td>
                                                    <td>{formatearMoneda(gasto.monto / resumen.propiedad.inquilinos)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td><strong>Subtotal Compartido</strong></td>
                                                <td><strong>{formatearMoneda(resumen.totalCompartido)}</strong></td>
                                                <td><strong>{formatearMoneda(resumen.parteCompartida)}</strong></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                ) : (
                                    <p className="sin-gastos-seccion">Sin gastos compartidos</p>
                                )}
                            </div>

                            <div className="total-final">
                                <div className="total-item">
                                    <span>Total Propiedad:</span>
                                    <span>{formatearMoneda(resumen.totalPropiedad)}</span>
                                </div>
                                <div className="total-item">
                                    <span>Total Compartido:</span>
                                    <span>{formatearMoneda(resumen.parteCompartida)}</span>
                                </div>
                                <div className="total-item total-principal">
                                    <span>TOTAL A PAGAR POR LA PROPIEDAD:</span>
                                    <span>{formatearMoneda(resumen.totalAPagar)}</span>
                                </div>
                                {resumen.propiedad.inquilinos > 1 && (
                                    <div className="total-item">
                                        <span>Por cada inquilino ({resumen.propiedad.inquilinos}):</span>
                                        <span>{formatearMoneda(resumen.totalPorInquilino)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default ResumenInquilinos;