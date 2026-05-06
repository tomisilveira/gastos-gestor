import React, { useState } from 'react';

const CATEGORIAS = [
    'Impuestos',
    'Servicios',
    'Mantenimiento',
    'Seguros',
    'Administración',
    'Reparaciones',
    'Otros'
];

const CONCEPTOS = {
    'Impuestos': ['Municipalidad', 'Inmobiliario', 'Escuela', 'Patentes Autos'],
    'Servicios': ['Agua', 'Electricidad', 'Gas', 'Cable', 'Teléfono', 'Internet'],
    'Mantenimiento': ['Limpieza', 'Jardinería', 'Pintura', 'Plomería', 'Electricidad'],
    'Seguros': ['Seguros Autos', 'Seguro Hogar', 'Seguro Vida'],
    'Administración': ['Gastos Administrativos', 'Honorarios', 'Papelería'],
    'Reparaciones': ['Electrodomésticos', 'Estructura', 'Techos', 'Pisos'],
    'Otros': ['Varios', 'Emergencias', 'Otros']
};

function GastosForm({ propiedades, onAgregarGasto }) {
    const [formData, setFormData] = useState({
        concepto: '',
        monto: '',
        categoria: 'Impuestos',
        propiedadId: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0]
    });

    const handleCategoriaChange = (categoria) => {
        setFormData({
            ...formData,
            categoria: categoria,
            concepto: '' // Resetear concepto al cambiar categoría
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.concepto || !formData.monto || !formData.propiedadId) {
            alert('Por favor completa los campos obligatorios: Concepto, Monto y Propiedad');
            return;
        }

        onAgregarGasto({
            ...formData,
            monto: parseFloat(formData.monto),
            propiedadId: parseInt(formData.propiedadId)
        });

        setFormData({
            concepto: '',
            monto: '',
            categoria: 'Impuestos',
            propiedadId: '',
            descripcion: '',
            fecha: new Date().toISOString().split('T')[0]
        });
    };

    return (
        <div className="gastos-form">
            <h2>💰 Registrar Nuevo Gasto</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-grupo">
                    <label>Fecha</label>
                    <input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        required
                    />
                </div>

                <div className="form-grupo">
                    <label>Categoría</label>
                    <select
                        value={formData.categoria}
                        onChange={(e) => handleCategoriaChange(e.target.value)}
                    >
                        {CATEGORIAS.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="form-grupo">
                    <label>Concepto *</label>
                    <select
                        value={formData.concepto}
                        onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                        required
                    >
                        <option value="">Seleccionar concepto...</option>
                        {CONCEPTOS[formData.categoria]?.map(concepto => (
                            <option key={concepto} value={concepto}>{concepto}</option>
                        ))}
                        <option value="Otro">Otro (especificar en descripción)</option>
                    </select>
                </div>

                <div className="form-grupo">
                    <label>Monto $ *</label>
                    <input
                        type="number"
                        value={formData.monto}
                        onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                        placeholder="0.00"
                        step="0.01"
                        required
                    />
                </div>

                <div className="form-grupo">
                    <label>Propiedad *</label>
                    <select
                        value={formData.propiedadId}
                        onChange={(e) => setFormData({ ...formData, propiedadId: e.target.value })}
                        required
                    >
                        <option value="">Seleccionar propiedad...</option>
                        {propiedades.map(prop => (
                            <option key={prop.id} value={prop.id}>
                                {prop.nombre} - {prop.direccion}
                            </option>
                        ))}
                    </select>
                    {propiedades.length === 0 && (
                        <small style={{ color: 'red' }}>
                            Debes agregar al menos una propiedad en la sección "Propiedades"
                        </small>
                    )}
                </div>

                <div className="form-grupo">
                    <label>Descripción adicional</label>
                    <textarea
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        placeholder="Detalles adicionales del gasto..."
                        rows="3"
                    />
                </div>

                <button type="submit" className="btn-primario">
                    💾 Registrar Gasto
                </button>
            </form>
        </div>
    );
}

export default GastosForm;