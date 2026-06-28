import React, { useState } from 'react';

export const CATEGORIAS = [
    'Impuestos',
    'Servicios',
    'Mantenimiento',
    'Seguros',
    'Administración',
    'Reparaciones',
    'Otros'
];

export const CONCEPTOS = {
    'Impuestos': ['Municipalidad', 'Inmobiliario', 'Escuela', 'Patentes Autos'],
    'Servicios': ['Agua', 'Electricidad', 'Gas', 'Cable', 'Teléfono', 'Internet'],
    'Mantenimiento': ['Limpieza', 'Jardinería', 'Pintura', 'Plomería', 'Electricidad'],
    'Seguros': ['Seguros Autos', 'Seguro Hogar', 'Seguro Vida'],
    'Administración': ['Gastos Administrativos', 'Honorarios', 'Papelería'],
    'Reparaciones': ['Electrodomésticos', 'Estructura', 'Techos', 'Pisos'],
    'Otros': ['Varios', 'Emergencias', 'Otros']
};

export const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];


function GastosForm({ propiedades, onAgregarGasto }) {
    const hoy = new Date();
    const mesActualStr = String(hoy.getMonth() + 1).padStart(2, '0');
    
    const [formData, setFormData] = useState({
        concepto: '',
        monto: '',
        categoria: 'Impuestos',
        propiedadId: '',
        descripcion: '',
        fecha: `2026-${mesActualStr}-01`
    });

    const handleMesChange = (mesIndex) => {
        const mesStr = String(Number(mesIndex) + 1).padStart(2, '0');
        setFormData({
            ...formData,
            fecha: `2026-${mesStr}-01`
        });
    };


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
            fecha: `2026-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
        });
    };


    return (
        <div className="gastos-form">
            <h2>💰 Registrar Nuevo Gasto</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-grupo-horizontal" style={{ display: 'flex', gap: '15px' }}>
                    <div className="form-grupo" style={{ flex: 1 }}>
                        <label>Mes al que corresponde *</label>
                        <select
                            value={parseInt(formData.fecha.split('-')[1]) - 1}
                            onChange={(e) => handleMesChange(e.target.value)}
                            required
                        >
                            {MESES.map((mes, index) => (
                                <option key={index} value={index}>{mes}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-grupo" style={{ width: '100px' }}>
                        <label>Año</label>
                        <input
                            type="text"
                            value="2026"
                            disabled
                            style={{ 
                                textAlign: 'center', 
                                background: '#f5f5f5', 
                                color: '#555',
                                cursor: 'not-allowed'
                            }}
                        />
                    </div>
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