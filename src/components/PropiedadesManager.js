import React, { useState } from 'react';
import { googleSheetsClient } from '../googleSheetsClient';

function PropiedadesManager({ propiedades, onGuardarPropiedades }) {
    const [nuevaPropiedad, setNuevaPropiedad] = useState({
        nombre: '',
        direccion: '',
        tipo: 'departamento'
    });
    const [guardando, setGuardando] = useState(false);

    const agregarPropiedad = async (e) => {
        e.preventDefault();
        if (!nuevaPropiedad.nombre || !nuevaPropiedad.direccion) {
            alert('Completa los campos requeridos');
            return;
        }

        setGuardando(true);
        try {
            const propId = Date.now(); // Generar ID numérico único
            const propiedadData = {
                id: propId,
                nombre: nuevaPropiedad.nombre,
                direccion: nuevaPropiedad.direccion,
                tipo: nuevaPropiedad.tipo
            };

            const data = await googleSheetsClient.agregarPropiedad(propiedadData);

            onGuardarPropiedades([...propiedades, data]);
            setNuevaPropiedad({
                nombre: '',
                direccion: '',
                tipo: 'departamento'
            });
            console.log('Propiedad guardada:', data);
        } catch (error) {
            console.error('Error guardando propiedad:', error);
            alert('Error al guardar la propiedad: ' + error.message);
        } finally {
            setGuardando(false);
        }
    };

    const eliminarPropiedad = async (id) => {
        const propiedad = propiedades.find(p => p.id === id);
        if (!propiedad) return;

        if (window.confirm(`¿Estás seguro de eliminar la propiedad "${propiedad.nombre}"? Se eliminarán todos los gastos asociados.`)) {
            try {
                await googleSheetsClient.eliminarPropiedad(id, propiedad.nombre);

                onGuardarPropiedades(propiedades.filter(prop => prop.id !== id));
                console.log('Propiedad eliminada:', id);
            } catch (error) {
                console.error('Error eliminando propiedad:', error);
                alert('Error al eliminar la propiedad: ' + error.message);
            }
        }
    };

    return (
        <div className="propiedades-manager">
            <h2>🏘️ Gestionar Propiedades</h2>

            <form onSubmit={agregarPropiedad} className="propiedad-form">
                <h3>Agregar Nueva Propiedad</h3>

                <div className="form-grupo">
                    <label>Nombre de la propiedad *</label>
                    <input
                        type="text"
                        value={nuevaPropiedad.nombre}
                        onChange={(e) => setNuevaPropiedad({ ...nuevaPropiedad, nombre: e.target.value })}
                        placeholder="Ej: Depto 3B, Casa Calle 123"
                        required
                    />
                </div>

                <div className="form-grupo">
                    <label>Dirección *</label>
                    <input
                        type="text"
                        value={nuevaPropiedad.direccion}
                        onChange={(e) => setNuevaPropiedad({ ...nuevaPropiedad, direccion: e.target.value })}
                        placeholder="Dirección completa"
                        required
                    />
                </div>

                <div className="form-grupo">
                    <label>Tipo de propiedad</label>
                    <select
                        value={nuevaPropiedad.tipo}
                        onChange={(e) => setNuevaPropiedad({ ...nuevaPropiedad, tipo: e.target.value })}
                    >
                        <option value="departamento">Departamento</option>
                        <option value="casa">Casa</option>
                        <option value="local">Local Comercial</option>
                        <option value="oficina">Oficina</option>
                        <option value="terreno">Terreno</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>

                <button type="submit" className="btn-primario" disabled={guardando}>
                    {guardando ? '⏳ Guardando...' : '➕ Agregar Propiedad'}
                </button>
            </form>

            <div className="propiedades-lista">
                <h3>Propiedades Registradas ({propiedades.length})</h3>
                {propiedades.length === 0 ? (
                    <p className="sin-datos">No hay propiedades registradas. ¡Agrega la primera!</p>
                ) : (
                    <div className="propiedades-grid">
                        {propiedades.map(propiedad => (
                            <div key={propiedad.id} className="propiedad-card">
                                <div className="propiedad-header">
                                    <h4>{propiedad.nombre}</h4>
                                    <button
                                        className="btn-eliminar"
                                        onClick={() => eliminarPropiedad(propiedad.id)}
                                        title="Eliminar propiedad"
                                    >
                                        🗑️
                                    </button>
                                </div>
                                <div className="propiedad-detalles">
                                    <p>📍 {propiedad.direccion}</p>
                                    <p>🏠 {propiedad.tipo}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PropiedadesManager;