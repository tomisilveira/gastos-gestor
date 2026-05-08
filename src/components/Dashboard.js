import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { calcularTotalServicios, formatearMoneda } from '../utils/calculos';

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function Dashboard({ gastos, propiedades, onEliminarGasto }) {
    const hoy = new Date();
    const [vistaDashboard, setVistaDashboard] = useState('general');
    const [mesSeleccionado, setMesSeleccionado] = useState(hoy.getMonth());
    const [añoSeleccionado, setAñoSeleccionado] = useState(hoy.getFullYear());
    const [propiedadSeleccionada, setPropiedadSeleccionada] = useState('todas');

    // Generar array de años disponibles (desde 2020 hasta año actual)
    const añosDisponibles = useMemo(() => {
        const años = [];
        for (let i = 2020; i <= hoy.getFullYear() + 1; i++) {
            años.push(i);
        }
        return años;
    }, []);

    // Filtrar gastos por mes, año y propiedad
    const gastosFiltrados = useMemo(() => {
        let filtrados = gastos.filter(gasto => {
            const fechaGasto = new Date(gasto.fecha);
            return fechaGasto.getMonth() === mesSeleccionado &&
                fechaGasto.getFullYear() === añoSeleccionado;
        });

        if (propiedadSeleccionada !== 'todas') {
            filtrados = filtrados.filter(gasto =>
                getPropiedadId(gasto) === parseInt(propiedadSeleccionada)
            );
        }

        return filtrados;
    }, [gastos, mesSeleccionado, añoSeleccionado, propiedadSeleccionada]);

    // Función para obtener el nombre de la propiedad
    const getPropiedadNombre = (gasto) => {
        if (gasto.propiedad_id) {
            const prop = propiedades.find(p => p.id === gasto.propiedad_id);
            if (prop) return prop.nombre;
        }
        if (gasto.propiedadId) {
            const prop = propiedades.find(p => p.id === gasto.propiedadId);
            if (prop) return prop.nombre;
        }
        if (gasto.propiedad?.nombre) {
            return gasto.propiedad.nombre;
        }
        return 'Sin propiedad';
    };

    // Función para obtener el ID de propiedad
    const getPropiedadId = (gasto) => {
        return gasto.propiedad_id || gasto.propiedadId || null;
    };

    const totalPeriodo = useMemo(() => calcularTotalServicios(gastosFiltrados), [gastosFiltrados]);

    // Agrupar por categoría
    const gastosAgrupados = useMemo(() => {
        const grupos = {};
        gastosFiltrados.forEach(gasto => {
            const categoria = gasto.categoria || 'Otros';
            if (!grupos[categoria]) {
                grupos[categoria] = [];
            }
            grupos[categoria].push(gasto);
        });
        return grupos;
    }, [gastosFiltrados]);

    // Totales por propiedad
    const totalesPorPropiedad = useMemo(() => {
        const totales = {};
        propiedades.forEach(prop => {
            const gastosProp = gastosFiltrados.filter(g => getPropiedadId(g) === prop.id);
            if (gastosProp.length > 0) {
                totales[prop.id] = {
                    propiedad: prop,
                    total: calcularTotalServicios(gastosProp),
                    cantidad: gastosProp.length
                };
            }
        });
        return totales;
    }, [gastosFiltrados, propiedades]);

    // Agrupar por propiedad
    const gastosPorPropiedad = useMemo(() => {
        const agrupados = {};

        const propsAMostrar = propiedadSeleccionada === 'todas'
            ? propiedades
            : propiedades.filter(p => p.id === parseInt(propiedadSeleccionada));

        propsAMostrar.forEach(prop => {
            const gastosProp = gastosFiltrados.filter(g => getPropiedadId(g) === prop.id);
            if (gastosProp.length > 0 || propiedadSeleccionada !== 'todas') {
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
            }
        });

        return agrupados;
    }, [gastosFiltrados, propiedades, propiedadSeleccionada]);

    const nombreMes = MESES[mesSeleccionado];

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

            {/* Selector de mes y año */}
            <div className="selector-periodo-dashboard">
                <div className="form-grupo">
                    <label>Mes</label>
                    <select
                        value={mesSeleccionado}
                        onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                    >
                        {MESES.map((mes, index) => (
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
                        {añosDisponibles.map(año => (
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
                            <option key={prop.id} value={prop.id}>{prop.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Vista General */}
            {vistaDashboard === 'general' && (
                <div className="vista-general">
                    <div className="resumen-card">
                        <h3>Resumen - {nombreMes} {añoSeleccionado}</h3>
                        <div className="total-mes">
                            Total: {formatearMoneda(totalPeriodo)}
                        </div>
                        <div className="cantidad-gastos">
                            {gastosFiltrados.length} gastos registrados
                        </div>
                    </div>

                    {/* Totales por propiedad */}
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

                    {/* Gastos por categoría */}
                    <div className="gastos-por-categoria">
                        <h3>Gastos de {nombreMes} {añoSeleccionado}</h3>
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
                        {gastosFiltrados.length === 0 && (
                            <div className="sin-gastos">
                                <p>📭 No hay gastos registrados en {nombreMes} {añoSeleccionado}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Vista por Propiedad */}
            {vistaDashboard === 'porPropiedad' && (
                <div className="vista-por-propiedad">
                    {Object.keys(gastosPorPropiedad).length === 0 ? (
                        <div className="sin-gastos">
                            <p>📭 No hay gastos registrados en {nombreMes} {añoSeleccionado}</p>
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
                                        <span className="total-label">Total {nombreMes}</span>
                                        <span className="total-monto">{formatearMoneda(data.total)}</span>
                                    </div>
                                </div>

                                {data.gastos.length === 0 ? (
                                    <p className="sin-gastos-seccion">Sin gastos en {nombreMes}</p>
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