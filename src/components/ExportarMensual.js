import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { exportarAExcel } from '../utils/exportUtils';
import {
    calcularTotalServicios,
    formatearMoneda
} from '../utils/calculos';

function ExportarMensual({ gastos, propiedades }) {
    const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
    const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
    const [propiedadSeleccionada, setPropiedadSeleccionada] = useState('todas');

    const gastosFiltrados = useMemo(() => {
        let filtrados = gastos.filter(gasto => {
            const fechaGasto = new Date(gasto.fecha);
            return fechaGasto.getMonth() === mesSeleccionado &&
                fechaGasto.getFullYear() === añoSeleccionado;
        });

        if (propiedadSeleccionada !== 'todas') {
            filtrados = filtrados.filter(gasto =>
                gasto.propiedadId === parseInt(propiedadSeleccionada)
            );
        }

        return filtrados;
    }, [gastos, mesSeleccionado, añoSeleccionado, propiedadSeleccionada]);

    const gastosAgrupados = useMemo(() => {
        const agrupados = {};

        // Filtrar propiedades según selección
        const propiedadesAMostrar = propiedadSeleccionada === 'todas'
            ? propiedades
            : propiedades.filter(p => p.id === parseInt(propiedadSeleccionada));

        propiedadesAMostrar.forEach(prop => {
            const gastosProp = gastosFiltrados.filter(g => g.propiedadId === prop.id);
            if (gastosProp.length > 0 || propiedadSeleccionada !== 'todas') {
                agrupados[prop.id] = {
                    propiedad: prop,
                    gastos: gastosProp,
                    total: calcularTotalServicios(gastosProp)
                };
            }
        });

        return agrupados;
    }, [gastosFiltrados, propiedades, propiedadSeleccionada]);

    const handleExportarExcel = () => {
        if (gastosFiltrados.length === 0) {
            alert('No hay gastos para exportar en este período');
            return;
        }

        const datos = {
            gastos: gastosFiltrados,
            totalGeneral: calcularTotalServicios(gastosFiltrados),
            totalesPorPropiedad: Object.fromEntries(
                Object.entries(gastosAgrupados).map(([id, data]) => [data.propiedad.nombre, data.total])
            ),
            gastosAgrupados: gastosAgrupados
        };

        const nombreMes = format(new Date(añoSeleccionado, mesSeleccionado), 'MMMM', { locale: es });
        exportarAExcel(datos, nombreMes, añoSeleccionado, propiedadSeleccionada !== 'todas');
    };

    const handleImprimir = () => {
        window.print();
    };

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    return (
        <div className="exportar-mensual">
            <h2>📥 Exportar Gastos Mensuales</h2>

            <div className="selector-periodo">
                <div className="form-grupo">
                    <label>Mes</label>
                    <select
                        value={mesSeleccionado}
                        onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                    >
                        {meses.map((mes, index) => (
                            <option key={index} value={index}>{mes}</option>
                        ))}
                    </select>
                </div>

                <div className="form-grupo">
                    <label>Año</label>
                    <select
                        value={añoSeleccionado}
                        onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
                    >
                        {[2023, 2024, 2025, 2026, 2027].map(año => (
                            <option key={año} value={año}>{año}</option>
                        ))}
                    </select>
                </div>

                <div className="form-grupo">
                    <label>Propiedad</label>
                    <select
                        value={propiedadSeleccionada}
                        onChange={(e) => setPropiedadSeleccionada(e.target.value)}
                    >
                        <option value="todas">Todas las propiedades</option>
                        {propiedades.map(prop => (
                            <option key={prop.id} value={prop.id}>
                                {prop.nombre}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="acciones-exportar">
                <button onClick={handleExportarExcel} className="btn-exportar">
                    📊 Exportar a Excel
                </button>
                <button onClick={handleImprimir} className="btn-exportar">
                    🖨️ Imprimir / PDF
                </button>
            </div>

            <div className="vista-previa">
                <h3>
                    Resumen {meses[mesSeleccionado]} {añoSeleccionado}
                    {propiedadSeleccionada !== 'todas' && (
                        <> - {propiedades.find(p => p.id === parseInt(propiedadSeleccionada))?.nombre}</>
                    )}
                </h3>

                <div className="total-general">
                    Total del período: {formatearMoneda(calcularTotalServicios(gastosFiltrados))}
                </div>

                {Object.keys(gastosAgrupados).length === 0 ? (
                    <div className="sin-datos">
                        <p>No hay gastos registrados en este período</p>
                        {propiedades.length === 0 && (
                            <p>También necesitas agregar propiedades en la sección "Propiedades"</p>
                        )}
                    </div>
                ) : (
                    Object.entries(gastosAgrupados).map(([id, data]) => (
                        <div key={id} className="propiedad-detalle">
                            <h4>🏠 {data.propiedad.nombre}</h4>
                            <p className="propiedad-direccion">📍 {data.propiedad.direccion}</p>

                            {data.gastos.length === 0 ? (
                                <p className="sin-gastos-seccion">Sin gastos en este período</p>
                            ) : (
                                <table className="tabla-gastos">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Concepto</th>
                                            <th>Categoría</th>
                                            <th>Monto</th>
                                            <th>Descripción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.gastos.map(gasto => (
                                            <tr key={gasto.id}>
                                                <td>{format(new Date(gasto.fecha), 'dd/MM/yyyy')}</td>
                                                <td>{gasto.concepto}</td>
                                                <td>{gasto.categoria}</td>
                                                <td>{formatearMoneda(gasto.monto)}</td>
                                                <td>{gasto.descripcion || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="3"><strong>Total {data.propiedad.nombre}</strong></td>
                                            <td colSpan="2"><strong>{formatearMoneda(data.total)}</strong></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default ExportarMensual;