import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { calcularTotalServicios, formatearMoneda } from '../utils/calculos';
import { CATEGORIAS, CONCEPTOS, MESES } from './GastosForm';


function GastoEditModal({ gasto, propiedades, onClose, onSave }) {
    const [concepto, setConcepto] = useState(gasto.concepto);
    const [monto, setMonto] = useState(gasto.monto);
    const [categoria, setCategoria] = useState(gasto.categoria || 'Otros');
    const [propiedadId, setPropiedadId] = useState(gasto.propiedad_id || gasto.propiedadId || '');
    const [descripcion, setDescripcion] = useState(gasto.descripcion || '');
    
    // Parse month from date
    const parsearFecha = (fechaStr) => {
        if (!fechaStr) return new Date();
        const partes = String(fechaStr).split('T')[0].split('-');
        if (partes.length === 3) {
            return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
        }
        return new Date(fechaStr);
    };

    const fechaObj = parsearFecha(gasto.fecha);
    const [mesIndex, setMesIndex] = useState(fechaObj.getMonth());
    const [añoSeleccionado, setAñoSeleccionado] = useState(fechaObj.getFullYear());
    const [guardando, setGuardando] = useState(false);

    const hoy = new Date();
    const añosDisponibles = [];
    for (let i = 2020; i <= hoy.getFullYear() + 1; i++) {
        añosDisponibles.push(i);
    }

    const handleCategoriaChange = (nuevaCat) => {
        setCategoria(nuevaCat);
        setConcepto(''); // Resetear concepto
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!concepto || !monto || !propiedadId) {
            alert('Por favor completa los campos obligatorios: Concepto, Monto y Propiedad');
            return;
        }

        setGuardando(true);
        try {
            const mesStr = String(Number(mesIndex) + 1).padStart(2, '0');
            const gastoEditado = {
                ...gasto,
                concepto,
                monto: parseFloat(monto),
                categoria,
                propiedad_id: parseInt(propiedadId),
                propiedadId: parseInt(propiedadId),
                descripcion,
                fecha: `${añoSeleccionado}-${mesStr}-01`
            };

            const oldPropiedadId = gasto.propiedad_id || gasto.propiedadId;
            await onSave(gastoEditado, oldPropiedadId);
            onClose();
        } catch (error) {
            alert('Error al guardar: ' + error.message);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-contenido config-modal" style={{ maxWidth: '500px', width: '95%' }}>
                <h3>✏️ Editar Gasto</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-grupo-horizontal" style={{ display: 'flex', gap: '15px' }}>
                        <div className="form-grupo" style={{ flex: 1 }}>
                            <label>Mes al que corresponde *</label>
                            <select
                                value={mesIndex}
                                onChange={(e) => setMesIndex(parseInt(e.target.value))}
                                required
                            >
                                {MESES.map((mes, index) => (
                                    <option key={index} value={index}>{mes}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-grupo" style={{ width: '120px' }}>
                            <label>Año *</label>
                            <select
                                value={añoSeleccionado}
                                onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
                                required
                            >
                                {añosDisponibles.map(a => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-grupo">
                        <label>Categoría *</label>
                        <select
                            value={categoria}
                            onChange={(e) => handleCategoriaChange(e.target.value)}
                            required
                        >
                            {CATEGORIAS.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-grupo">
                        <label>Concepto *</label>
                        <select
                            value={concepto}
                            onChange={(e) => setConcepto(e.target.value)}
                            required
                        >
                            <option value="">Seleccionar concepto...</option>
                            {CONCEPTOS[categoria]?.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                            <option value="Otro">Otro (especificar en descripción)</option>
                        </select>
                    </div>

                    <div className="form-grupo">
                        <label>Monto $ *</label>
                        <input
                            type="number"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="form-grupo">
                        <label>Propiedad *</label>
                        <select
                            value={propiedadId}
                            onChange={(e) => setPropiedadId(e.target.value)}
                            required
                        >
                            {propiedades.map(prop => (
                                <option key={prop.id} value={prop.id}>
                                    {prop.nombre} - {prop.direccion}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-grupo">
                        <label>Descripción adicional</label>
                        <textarea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            rows="3"
                        />
                    </div>

                    <div className="modal-acciones">
                        <div className="modal-botones-derecha" style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <button 
                                type="button" 
                                className="btn-cancelar" 
                                onClick={onClose}
                                disabled={guardando}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="btn-primario"
                                disabled={guardando}
                            >
                                {guardando ? 'Guardando...' : '💾 Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Dashboard({ gastos, propiedades, onEliminarGasto, onEditarGasto }) {
    const hoy = new Date();
    const [vistaDashboard, setVistaDashboard] = useState('general');
    const [mesSeleccionado, setMesSeleccionado] = useState(hoy.getMonth());
    const [añoSeleccionado, setAñoSeleccionado] = useState(hoy.getFullYear());
    const [propiedadSeleccionada, setPropiedadSeleccionada] = useState('todas');
    const [gastoAEditar, setGastoAEditar] = useState(null);

    // Generar array de años disponibles (desde 2020 hasta año actual)
    const añosDisponibles = useMemo(() => {
        const años = [];
        for (let i = 2020; i <= hoy.getFullYear() + 1; i++) {
            años.push(i);
        }
        return años;
    }, []);

    // Parsear fecha desde string "YYYY-MM-DD" sin conversión UTC para evitar
    // que en zonas horarias negativas (ej: Argentina UTC-3) el día 1 de cada
    // mes quede desplazado al mes anterior.
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



    // Función para obtener el ID de propiedad (siempre como string)
    // DEBE estar definida ANTES del useMemo que la usa
    const getPropiedadId = (gasto) => {
        const id = gasto.propiedad_id || gasto.propiedadId || null;
        return id !== null ? String(id) : null;
    };

    // Función para obtener el nombre de la propiedad
    const getPropiedadNombre = (gasto) => {
        const gastoId = gasto.propiedad_id || gasto.propiedadId;
        if (gastoId) {
            const prop = propiedades.find(p => String(p.id) === String(gastoId));
            if (prop) return prop.nombre;
        }
        if (gasto.propiedad?.nombre) {
            return gasto.propiedad.nombre;
        }
        return 'Sin propiedad';
    };

    // Filtrar gastos por mes, año y propiedad
    const gastosFiltrados = useMemo(() => {
        let filtrados = gastos.filter(gasto => {
            const fechaGasto = parsearFecha(gasto.fecha);
            return fechaGasto.getMonth() === mesSeleccionado &&
                fechaGasto.getFullYear() === añoSeleccionado;
        });

        if (propiedadSeleccionada !== 'todas') {
            filtrados = filtrados.filter(gasto =>
                String(getPropiedadId(gasto)) === String(propiedadSeleccionada)
            );
        }

        return filtrados;
    }, [gastos, mesSeleccionado, añoSeleccionado, propiedadSeleccionada]);

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
            const gastosProp = gastosFiltrados.filter(g => String(getPropiedadId(g)) === String(prop.id));
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
            : propiedades.filter(p => String(p.id) === String(propiedadSeleccionada));

        propsAMostrar.forEach(prop => {
            const gastosProp = gastosFiltrados.filter(g => String(getPropiedadId(g)) === String(prop.id));
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
                                                    {getFechaFormateada(gasto.fecha)}
                                                </span>
                                            </div>
                                            <div className="gasto-monto">
                                                {formatearMoneda(gasto.monto)}
                                                <div className="gasto-acciones-botones">
                                                    <button
                                                        className="btn-editar"
                                                        onClick={() => setGastoAEditar(gasto)}
                                                        title="Editar gasto"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="btn-eliminar"
                                                        onClick={() => onEliminarGasto(gasto.id)}
                                                        title="Eliminar gasto"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
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
                                                                    {getFechaFormateada(gasto.fecha)}
                                                                </span>
                                                                {gasto.descripcion && (
                                                                    <span className="gasto-descripcion">{gasto.descripcion}</span>
                                                                )}
                                                            </div>
                                                            <div className="gasto-monto">
                                                                {formatearMoneda(gasto.monto)}
                                                                <div className="gasto-acciones-botones">
                                                                    <button
                                                                        className="btn-editar"
                                                                        onClick={() => setGastoAEditar(gasto)}
                                                                        title="Editar gasto"
                                                                    >
                                                                        ✏️
                                                                    </button>
                                                                    <button
                                                                        className="btn-eliminar"
                                                                        onClick={() => onEliminarGasto(gasto.id)}
                                                                        title="Eliminar gasto"
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                </div>
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
            {gastoAEditar && (
                <GastoEditModal
                    gasto={gastoAEditar}
                    propiedades={propiedades}
                    onClose={() => setGastoAEditar(null)}
                    onSave={onEditarGasto}
                />
            )}
        </div>
    );
}

export default Dashboard;