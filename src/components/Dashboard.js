import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { calcularTotalServicios, formatearMoneda } from '../utils/calculos';

function Dashboard({ gastos, propiedades, onEliminarGasto }) {
    const [vistaDashboard, setVistaDashboard] = useState('general');
    const [propiedadSeleccionada, setPropiedadSeleccionada] = useState('todas');

    const gastosDelMes = useMemo(() => {
        const ahora = new Date();
        return gastos.filter(gasto => {
            const fechaGasto = new Date(gasto.fecha);
            return fechaGasto.getMonth() === ahora.getMonth() &&
                fechaGasto.getFullYear() === ahora.getFullYear();
        });
    }, [gastos]);

    // Función para obtener el nombre de la propiedad
    const getPropiedadNombre = (gasto) => {
        // Intentar con propiedad_id (formato Supabase)
        if (gasto.propiedad_id) {
            const prop = propiedades.find(p => p.id === gasto.propiedad_id);
            if (prop) return prop.nombre;
        }
        // Intentar con propiedadId (formato antiguo)
        if (gasto.propiedadId) {
            const prop = propiedades.find(p => p.id === gasto.propiedadId);
            if (prop) return prop.nombre;
        }
        // Intentar con propiedad.nombre (si viene con join)
        if (gasto.propiedad?.nombre) {
            return gasto.propiedad.nombre;
        }
        return 'Sin propiedad';
    };

    // Función para obtener el ID de propiedad
    const getPropiedadId = (gasto) => {
        return gasto.propiedad_id || gasto.propiedadId || null;
    };

    const totalMes = useMemo(() => calcularTotalServicios(gastosDelMes), [gastosDelMes]);

    const gastosAgrupados = useMemo(() => {
        const grupos = {};
        gastosDelMes.forEach(gasto => {
            const categoria = gasto.categoria || 'Otros';
            if (!grupos[categoria]) {
                grupos[categoria] = [];
            }
            grupos[categoria].push(gasto);
        });
        return grupos;
    }, [gastosDelMes]);

    const gastosPorPropiedad = useMemo(() => {
        const agrupados = {};

        const propiedadesAMostrar = propiedadSeleccionada === 'todas'
            ? propiedades
            : propiedades.filter(p => p.id === parseInt(propiedadSeleccionada));

        propiedadesAMostrar.forEach(prop => {
            const gastosProp = gastosDelMes.filter(g => getPropiedadId(g) === prop.id);
            agrupados[prop.id] = {
                propiedad: prop,
                gastos: gastosProp,
                total: calcularTotalServicios(gastosProp),
                categorias: {}
            };

            gastosProp.forEach(gasto => {
                const cat = gasto.categoria || 'Otros';
                if (!agrupados[prop.id].categorias[cat]) {
                    agrupados[prop.id].categorias[cat] = [];
                }
                agrupados[prop.id].categorias[cat].push(gasto);
            });
        });

        return agrupados;
    }, [gastosDelMes, propiedades, propiedadSeleccionada]);

    const totalesPorPropiedad = useMemo(() => {
        const totales = {};
        propiedades.forEach(prop => {
            const gastosProp = gastosDelMes.filter(g => getPropiedadId(g) === prop.id);
            if (gastosProp.length > 0) {
                totales[prop.id] = {
                    propiedad: prop,
                    total: calcularTotalServicios(gastosProp),
                    cantidad: gastosProp.length
                };
            }
        });
        return totales;
    }, [gastosDelMes, propiedades]);

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h2>📊 Dashboard</h2>
                <div className="dashboard-tabs">
                    <button
                        className={vistaDashboard === 'general' ? 'tab-activo' : 'tab'}
                        onClick={() => setVistaDashboard('general')}
                    >
                        📈 Vista General
                    </button>
                    <button
                        className={vistaDashboard === 'porPropiedad' ? 'tab-activo' : 'tab'}
                        onClick={() => setVistaDashboard('porPropiedad')}
                    >
                        🏠 Por Propiedad
                    </button>
                </div>
            </div>

            {vistaDashboard === 'general' && (
                <div className="vista-general">
                    <div className="resumen-card">
                        <h3>Resumen del Mes Actual</h3>
                        <div className="total-mes">
                            Total General: {formatearMoneda(totalMes)}
                        </div>
                        <div className="cantidad-gastos">
                            {gastosDelMes.length} gastos registrados este mes
                        </div>
                    </div>

                    {Object.keys(totalesPorPropiedad).length > 0 && (
                        <div className="totales-propiedades">
                            <h3>Totales por Propiedad</h3>
                            <div className="propiedades-resumen-grid">
                                {Object.entries(totalesPorPropiedad).map(([id, data]) => (
                                    <div key={id} className="propiedad-resumen-card">
                                        <div className="propiedad-resumen-header">
                                            🏠 {data.propiedad.nombre}
                                        </div>
                                        <div className="propiedad-resumen-monto">
                                            {formatearMoneda(data.total)}
                                        </div>
                                        <div className="propiedad-resumen-info">
                                            {data.cantidad} gasto(s)
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="gastos-por-categoria">
                        <h3>Todos los Gastos del Mes</h3>
                        {Object.entries(gastosAgrupados).map(([categoria, items]) => (
                            <div key={categoria} className="categoria-grupo">
                                <h4>
                                    📁 {categoria} - {formatearMoneda(calcularTotalServicios(items))}
                                    <span className="cantidad-items">({items.length})</span>
                                </h4>
                                <ul className="lista-gastos">
                                    {items.map(gasto => (
                                        <li key={gasto.id} className="gasto-item">
                                            <div className="gasto-info">
                                                <span className="gasto-concepto">{gasto.concepto}</span>
                                                <span className="gasto-propiedad">
                                                    {getPropiedadNombre(gasto)}
                                                </span>
                                                <span className="gasto-fecha">
                                                    {format(new Date(gasto.fecha), 'dd/MM/yyyy')}
                                                </span>
                                            </div>
                                            <div className="gasto-monto">
                                                {formatearMoneda(gasto.monto)}
                                                <button
                                                    className="btn-eliminar"
                                                    onClick={() => onEliminarGasto(gasto.id)}
                                                    title="Eliminar gasto"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                        {gastosDelMes.length === 0 && (
                            <div className="sin-gastos">
                                <p>📭 No hay gastos registrados este mes</p>
                                <p>Ve a "Agregar Gastos" para registrar nuevos gastos</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {vistaDashboard === 'porPropiedad' && (
                <div className="vista-por-propiedad">
                    <div className="selector-propiedad">
                        <div className="form-grupo">
                            <label>Seleccionar Propiedad</label>
                            <select
                                value={propiedadSeleccionada}
                                onChange={(e) => setPropiedadSeleccionada(e.target.value)}
                            >
                                <option value="todas">Todas las propiedades</option>
                                {propiedades.map(prop => (
                                    <option key={prop.id} value={prop.id}>{prop.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {Object.keys(gastosPorPropiedad).length === 0 ? (
                        <div className="sin-gastos">
                            <p>📭 No hay gastos registrados este mes</p>
                            {propiedades.length === 0 && (
                                <p>Agrega propiedades en la sección "Propiedades" para comenzar</p>
                            )}
                        </div>
                    ) : (
                        Object.entries(gastosPorPropiedad).map(([id, data]) => (
                            <div key={id} className="propiedad-dashboard-detalle">
                                <div className="propiedad-dashboard-header">
                                    <div>
                                        <h3>🏠 {data.propiedad.nombre}</h3>
                                        <p className="propiedad-direccion">📍 {data.propiedad.direccion}</p>
                                    </div>
                                    <div className="propiedad-total">
                                        <span className="total-label">Total del mes</span>
                                        <span className="total-monto">{formatearMoneda(data.total)}</span>
                                    </div>
                                </div>

                                {data.gastos.length === 0 ? (
                                    <p className="sin-gastos-seccion">Sin gastos este mes</p>
                                ) : (
                                    <div className="propiedad-categorias">
                                        {Object.entries(data.categorias).map(([categoria, items]) => (
                                            <div key={categoria} className="categoria-grupo">
                                                <h4>
                                                    📁 {categoria} - {formatearMoneda(calcularTotalServicios(items))}
                                                    <span className="cantidad-items">({items.length})</span>
                                                </h4>
                                                <ul className="lista-gastos">
                                                    {items.map(gasto => (
                                                        <li key={gasto.id} className="gasto-item">
                                                            <div className="gasto-info">
                                                                <span className="gasto-concepto">{gasto.concepto}</span>
                                                                <span className="gasto-fecha">
                                                                    {format(new Date(gasto.fecha), 'dd/MM/yyyy')}
                                                                </span>
                                                                {gasto.descripcion && (
                                                                    <span className="gasto-descripcion">{gasto.descripcion}</span>
                                                                )}
                                                            </div>
                                                            <div className="gasto-monto">
                                                                {formatearMoneda(gasto.monto)}
                                                                <button
                                                                    className="btn-eliminar"
                                                                    onClick={() => onEliminarGasto(gasto.id)}
                                                                    title="Eliminar gasto"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default Dashboard;