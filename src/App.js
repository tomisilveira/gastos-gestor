import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Dashboard from './components/Dashboard';
import GastosForm from './components/GastosForm';
import PropiedadesManager from './components/PropiedadesManager';
import ExportarMensual from './components/ExportarMensual';
import './App.css';

function LoginScreen({ onLogin }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [configuracionInicial, setConfiguracionInicial] = useState(false);
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        verificarConfiguracion();
    }, []);

    const verificarConfiguracion = async () => {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .limit(1);

            if (error) throw error;

            if (!data || data.length === 0) {
                setConfiguracionInicial(true);
            }
        } catch (error) {
            console.error('Error verificando configuración:', error);
        } finally {
            setCargando(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('password_hash')
                .single();

            if (error) throw error;

            // Encriptación simple (para producción usa bcrypt)
            const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
            const hashArray = Array.from(new Uint8Array(hash));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            if (hashHex === data.password_hash) {
                onLogin(true);
            } else {
                setError('Contraseña incorrecta');
            }
        } catch (error) {
            console.error('Error en login:', error);
            setError('Error al verificar contraseña');
        }
    };

    const handleSetPassword = async (e) => {
        e.preventDefault();
        if (nuevaPassword.length < 4) {
            setError('La contraseña debe tener al menos 4 caracteres');
            return;
        }
        if (nuevaPassword !== confirmarPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        try {
            const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nuevaPassword));
            const hashArray = Array.from(new Uint8Array(hash));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            const { error } = await supabase
                .from('usuarios')
                .insert([{ password_hash: hashHex }]);

            if (error) throw error;

            setConfiguracionInicial(false);
            onLogin(true);
        } catch (error) {
            console.error('Error guardando password:', error);
            setError('Error al guardar la contraseña');
        }
    };

    if (cargando) {
        return <div className="cargando">Verificando configuración...</div>;
    }

    if (configuracionInicial) {
        return (
            <div className="login-screen">
                <div className="login-card">
                    <h1>🏠 Gestor de Gastos</h1>
                    <h2>Configuración Inicial</h2>
                    <p>Establece una contraseña para proteger tus datos</p>
                    <form onSubmit={handleSetPassword}>
                        <div className="form-grupo">
                            <label>Nueva Contraseña</label>
                            <input
                                type="password"
                                value={nuevaPassword}
                                onChange={(e) => setNuevaPassword(e.target.value)}
                                placeholder="Mínimo 4 caracteres"
                                required
                            />
                        </div>
                        <div className="form-grupo">
                            <label>Confirmar Contraseña</label>
                            <input
                                type="password"
                                value={confirmarPassword}
                                onChange={(e) => setConfirmarPassword(e.target.value)}
                                placeholder="Repite la contraseña"
                                required
                            />
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <button type="submit" className="btn-primario">
                            🔒 Establecer Contraseña
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="login-screen">
            <div className="login-card">
                <h1>🏠 Gestor de Gastos</h1>
                <h2>Iniciar Sesión</h2>
                <form onSubmit={handleLogin}>
                    <div className="form-grupo">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Ingresa tu contraseña"
                            required
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit" className="btn-primario">
                        🔑 Ingresar
                    </button>
                </form>
            </div>
        </div>
    );
}

function App() {
    const [autenticado, setAutenticado] = useState(false);
    const [vistaActual, setVistaActual] = useState('dashboard');
    const [gastos, setGastos] = useState([]);
    const [propiedades, setPropiedades] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        if (autenticado) {
            cargarDatos();
        }
    }, [autenticado]);

    const cargarDatos = async () => {
        try {
            // Cargar propiedades
            const { data: propiedadesData, error: errorProp } = await supabase
                .from('propiedades')
                .select('*')
                .order('nombre');

            if (errorProp) throw errorProp;

            // Cargar gastos
            const { data: gastosData, error: errorGastos } = await supabase
                .from('gastos')
                .select('*')
                .order('fecha', { ascending: false });

            if (errorGastos) throw errorGastos;

            setPropiedades(propiedadesData || []);
            setGastos(gastosData || []);

            console.log('Datos cargados:', {
                propiedades: propiedadesData?.length,
                gastos: gastosData?.length
            });
        } catch (error) {
            console.error('Error cargando datos:', error);
            alert('Error al cargar datos del servidor');
        } finally {
            setCargando(false);
        }
    };

    const agregarGasto = async (nuevoGasto) => {
        try {
            const { data, error } = await supabase
                .from('gastos')
                .insert([{
                    concepto: nuevoGasto.concepto,
                    monto: nuevoGasto.monto,
                    categoria: nuevoGasto.categoria,
                    propiedad_id: nuevoGasto.propiedadId,
                    descripcion: nuevoGasto.descripcion,
                    fecha: nuevoGasto.fecha
                }])
                .select()
                .single();

            if (error) throw error;

            setGastos([data, ...gastos]);
            console.log('Gasto guardado:', data);
        } catch (error) {
            console.error('Error guardando gasto:', error);
            alert('Error al guardar el gasto');
        }
    };

    const eliminarGasto = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este gasto?')) {
            try {
                const { error } = await supabase
                    .from('gastos')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                setGastos(gastos.filter(gasto => gasto.id !== id));
                console.log('Gasto eliminado:', id);
            } catch (error) {
                console.error('Error eliminando gasto:', error);
                alert('Error al eliminar el gasto');
            }
        }
    };

    const guardarPropiedades = async (nuevasPropiedades) => {
        // Solo necesitamos actualizar el estado, las operaciones 
        // de agregar/eliminar se hacen individualmente
        setPropiedades(nuevasPropiedades);
    };

    const handleLogout = () => {
        setAutenticado(false);
        setVistaActual('dashboard');
    };

    if (!autenticado) {
        return <LoginScreen onLogin={setAutenticado} />;
    }

    if (cargando) {
        return <div className="cargando">Cargando datos del servidor...</div>;
    }

    return (
        <div className="app">
            <nav className="navegacion">
                <div className="nav-header">
                    <h1>🏠 Gestor de Gastos</h1>
                    <button className="btn-logout" onClick={handleLogout}>
                        🚪 Salir
                    </button>
                </div>
                <div className="nav-botones">
                    <button
                        className={vistaActual === 'dashboard' ? 'activo' : ''}
                        onClick={() => setVistaActual('dashboard')}
                    >
                        📊 Dashboard
                    </button>
                    <button
                        className={vistaActual === 'gastos' ? 'activo' : ''}
                        onClick={() => setVistaActual('gastos')}
                    >
                        💰 Agregar Gastos
                    </button>
                    <button
                        className={vistaActual === 'propiedades' ? 'activo' : ''}
                        onClick={() => setVistaActual('propiedades')}
                    >
                        🏘️ Propiedades
                    </button>
                    <button
                        className={vistaActual === 'exportar' ? 'activo' : ''}
                        onClick={() => setVistaActual('exportar')}
                    >
                        📥 Exportar
                    </button>
                </div>
            </nav>

            <main className="contenido-principal">
                {vistaActual === 'dashboard' && (
                    <Dashboard
                        gastos={gastos}
                        propiedades={propiedades}
                        onEliminarGasto={eliminarGasto}
                    />
                )}
                {vistaActual === 'gastos' && (
                    <GastosForm
                        propiedades={propiedades}
                        onAgregarGasto={agregarGasto}
                    />
                )}
                {vistaActual === 'propiedades' && (
                    <PropiedadesManager
                        propiedades={propiedades}
                        onGuardarPropiedades={guardarPropiedades}
                    />
                )}
                {vistaActual === 'exportar' && (
                    <ExportarMensual
                        gastos={gastos}
                        propiedades={propiedades}
                    />
                )}
            </main>
        </div>
    );
}

export default App;