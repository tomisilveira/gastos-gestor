import React, { useState, useEffect } from 'react';
import localforage from 'localforage';
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

    useEffect(() => {
        verificarPasswordGuardada();
    }, []);

    const verificarPasswordGuardada = async () => {
        const passGuardada = await localforage.getItem('appPassword');
        if (!passGuardada) {
            setConfiguracionInicial(true);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const passGuardada = await localforage.getItem('appPassword');

        if (password === passGuardada) {
            onLogin(true);
        } else {
            setError('Contraseña incorrecta');
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

        await localforage.setItem('appPassword', nuevaPassword);
        setConfiguracionInicial(false);
        onLogin(true);
    };

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
            const gastosGuardados = await localforage.getItem('gastos');
            const propiedadesGuardadas = await localforage.getItem('propiedades');

            if (gastosGuardados) setGastos(gastosGuardados);
            if (propiedadesGuardadas) setPropiedades(propiedadesGuardadas);
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setCargando(false);
        }
    };

    const guardarGastos = async (nuevosGastos) => {
        await localforage.setItem('gastos', nuevosGastos);
        setGastos(nuevosGastos);
    };

    const guardarPropiedades = async (nuevasPropiedades) => {
        await localforage.setItem('propiedades', nuevasPropiedades);
        setPropiedades(nuevasPropiedades);
    };

    const agregarGasto = async (nuevoGasto) => {
        const gastoConId = {
            ...nuevoGasto,
            id: Date.now(),
            fecha: nuevoGasto.fecha || new Date().toISOString()
        };
        const nuevosGastos = [...gastos, gastoConId];
        await guardarGastos(nuevosGastos);
    };

    const eliminarGasto = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este gasto?')) {
            const nuevosGastos = gastos.filter(gasto => gasto.id !== id);
            await guardarGastos(nuevosGastos);
        }
    };

    const handleLogout = async () => {
        setAutenticado(false);
        setVistaActual('dashboard');
    };

    if (!autenticado) {
        return <LoginScreen onLogin={setAutenticado} />;
    }

    if (cargando) {
        return <div className="cargando">Cargando aplicación...</div>;
    }

    return (
        <div className="app">
            <nav className="navegacion">
                <div className="nav-header">
                    <h1>🏠 Gestor de Gastos</h1>
                    <button
                        className="btn-logout"
                        onClick={handleLogout}
                        title="Cerrar sesión"
                    >
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