import React, { useState, useEffect } from 'react';
import { googleSheetsClient, getWebhookUrl, setWebhookUrl } from './googleSheetsClient';
import Dashboard from './components/Dashboard';
import GastosForm from './components/GastosForm';
import PropiedadesManager from './components/PropiedadesManager';
import ExportarMensual from './components/ExportarMensual';
import './App.css';

const APPS_SCRIPT_CODE = `/**
 * Gestor de Gastos - Google Apps Script Backend
 * 
 * Copia este código y pégalo en Extensiones -> Apps Script de tu planilla.
 */
function inicializarHojas(ss) {
  var sheetConfig = ss.getSheetByName('_Configuracion');
  if (!sheetConfig) {
    sheetConfig = ss.insertSheet('_Configuracion');
    sheetConfig.appendRow(['Clave', 'Valor']);
  }
  var sheetPropiedades = ss.getSheetByName('_Propiedades');
  if (!sheetPropiedades) {
    sheetPropiedades = ss.insertSheet('_Propiedades');
    sheetPropiedades.appendRow(['id', 'nombre', 'direccion', 'tipo']);
  }
}

function cleanSheetName(name) {
  var clean = name.replace(/[\\\\\\/\\?\\*\\:\\[\\]]/g, '').trim();
  if (clean.length > 30) {
    clean = clean.substring(0, 30).trim();
  }
  return clean || 'Propiedad_Sin_Nombre';
}

function formatearFechaExcel(fechaVal) {
  if (fechaVal instanceof Date) {
    var y = fechaVal.getFullYear();
    var m = String(fechaVal.getMonth() + 1).padStart(2, '0');
    var d = String(fechaVal.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  if (typeof fechaVal === 'string') {
    if (fechaVal.indexOf('T') !== -1) {
      return fechaVal.split('T')[0];
    }
    return fechaVal;
  }
  return String(fechaVal);
}

function doGet(e) {
  var action = e.parameter.action || 'getDatos';
  var JSONResponse;
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    inicializarHojas(ss);
    if (action === 'getDatos') {
      JSONResponse = { success: true, data: getDatos(ss) };
    } else if (action === 'checkConfig') {
      JSONResponse = { success: true, data: checkConfig(ss) };
    } else {
      JSONResponse = { success: false, error: 'Acción no válida en GET' };
    }
  } catch (err) {
    JSONResponse = { success: false, error: err.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(JSONResponse))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var JSONResponse;
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    inicializarHojas(ss);
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var result;
    if (action === 'checkConfig') {
      result = checkConfig(ss);
    } else if (action === 'setPassword') {
      result = setPassword(ss, data.hash);
    } else if (action === 'getDatos') {
      result = getDatos(ss);
    } else if (action === 'agregarPropiedad') {
      result = agregarPropiedad(ss, data.propiedad);
    } else if (action === 'eliminarPropiedad') {
      result = eliminarPropiedad(ss, data.id, data.nombre);
    } else if (action === 'agregarGasto') {
      result = agregarGasto(ss, data.gasto);
    } else if (action === 'editarGasto') {
      result = editarGasto(ss, data.gasto, data.oldPropiedadId);
    } else if (action === 'eliminarGasto') {
      result = eliminarGasto(ss, data.id, data.propiedad_id);
    } else {
      throw new Error('Acción no reconocida: ' + action);
    }
    JSONResponse = { success: true, data: result };
  } catch (err) {
    JSONResponse = { success: false, error: err.toString() };
  }
  return ContentService.createTextOutput(JSON.stringify(JSONResponse))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkConfig(ss) {
  var sheet = ss.getSheetByName('_Configuracion');
  var rows = sheet.getDataRange().getValues();
  var passwordHash = null;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'password_hash') {
      passwordHash = rows[i][1];
      break;
    }
  }
  return {
    configurado: passwordHash !== null && passwordHash !== "",
    password_hash: passwordHash
  };
}

function setPassword(ss, hash) {
  var sheet = ss.getSheetByName('_Configuracion');
  var rows = sheet.getDataRange().getValues();
  var found = false;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'password_hash') {
      sheet.getRange(i + 1, 2).setValue(hash);
      found = true;
      break;
    }
  }
  if (!found) {
    sheet.appendRow(['password_hash', hash]);
  }
  return { configurado: true };
}

function getDatos(ss) {
  var config = checkConfig(ss);
  var sheetProps = ss.getSheetByName('_Propiedades');
  var rowsProps = sheetProps.getDataRange().getValues();
  var propiedades = [];
  for (var i = 1; i < rowsProps.length; i++) {
    if (rowsProps[i][0] === "") continue;
    propiedades.push({
      id: Number(rowsProps[i][0]),
      nombre: String(rowsProps[i][1]),
      direccion: String(rowsProps[i][2]),
      tipo: String(rowsProps[i][3])
    });
  }
  var gastos = [];
  for (var p = 0; p < propiedades.length; p++) {
    var prop = propiedades[p];
    var sheetProp = ss.getSheetByName(prop.nombre);
    if (sheetProp) {
      var rowsGastos = sheetProp.getDataRange().getValues();
      for (var j = 1; j < rowsGastos.length; j++) {
        if (rowsGastos[j][0] === "") continue;
        gastos.push({
          id: String(rowsGastos[j][0]),
          fecha: formatearFechaExcel(rowsGastos[j][1]),
          concepto: String(rowsGastos[j][2]),
          monto: Number(rowsGastos[j][3]),
          categoria: String(rowsGastos[j][4]),
          descripcion: String(rowsGastos[j][5]),
          propiedad_id: prop.id,
          propiedadId: prop.id
        });
      }
    }
  }
  return {
    configurado: config.configurado,
    password_hash: config.password_hash,
    propiedades: propiedades,
    gastos: gastos
  };
}

function agregarPropiedad(ss, prop) {
  var sheetProps = ss.getSheetByName('_Propiedades');
  var cleanNombre = cleanSheetName(prop.nombre);
  sheetProps.appendRow([prop.id, cleanNombre, prop.direccion, prop.tipo]);
  var newSheet = ss.getSheetByName(cleanNombre);
  if (!newSheet) {
    newSheet = ss.insertSheet(cleanNombre);
    newSheet.appendRow(['id', 'fecha', 'concepto', 'monto', 'categoria', 'descripcion']);
  }
  return {
    id: prop.id,
    nombre: cleanNombre,
    direccion: prop.direccion,
    tipo: prop.tipo
  };
}

function eliminarPropiedad(ss, id, nombre) {
  var propId = Number(id);
  var sheetProps = ss.getSheetByName('_Propiedades');
  var rows = sheetProps.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (Number(rows[i][0]) === propId) {
      sheetProps.deleteRow(i + 1);
      break;
    }
  }
  var sheet = ss.getSheetByName(nombre);
  if (sheet) {
    ss.deleteSheet(sheet);
  }
  return { id: propId };
}

function agregarGasto(ss, gasto) {
  var sheetProps = ss.getSheetByName('_Propiedades');
  var rows = sheetProps.getDataRange().getValues();
  var sheetName = null;
  for (var i = 1; i < rows.length; i++) {
    if (Number(rows[i][0]) === Number(gasto.propiedad_id)) {
      sheetName = rows[i][1];
      break;
    }
  }
  if (!sheetName) {
    throw new Error('No se encontró la hoja para la propiedad con ID: ' + gasto.propiedad_id);
  }
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['id', 'fecha', 'concepto', 'monto', 'categoria', 'descripcion']);
  }
  sheet.appendRow([
    gasto.id,
    gasto.fecha,
    gasto.concepto,
    gasto.monto,
    gasto.categoria,
    gasto.descripcion
  ]);
  return gasto;
}

function eliminarGasto(ss, id, propiedadId) {
  var gastoId = String(id);
  var propId = Number(propiedadId);
  var sheetProps = ss.getSheetByName('_Propiedades');
  var rowsProps = sheetProps.getDataRange().getValues();
  var sheetName = null;
  for (var i = 1; i < rowsProps.length; i++) {
    if (Number(rowsProps[i][0]) === propId) {
      sheetName = rowsProps[i][1];
      break;
    }
  }
  if (!sheetName) {
    throw new Error('No se encontró la hoja para la propiedad con ID: ' + propId);
  }
  var sheet = ss.getSheetByName(sheetName);
  if (sheet) {
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === gastoId) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
  return { id: gastoId };
}

function editarGasto(ss, gasto, oldPropiedadId) {
  var gastoId = String(gasto.id);
  var newPropId = Number(gasto.propiedad_id);
  var oldPropId = oldPropiedadId ? Number(oldPropiedadId) : newPropId;
  
  if (newPropId !== oldPropId) {
    // Si cambió la propiedad, eliminamos de la anterior e insertamos en la nueva
    eliminarGasto(ss, gastoId, oldPropId);
    agregarGasto(ss, gasto);
  } else {
    // Si es la misma propiedad, actualizamos la fila existente
    var sheetProps = ss.getSheetByName('_Propiedades');
    var rowsProps = sheetProps.getDataRange().getValues();
    var sheetName = null;
    for (var i = 1; i < rowsProps.length; i++) {
      if (Number(rowsProps[i][0]) === newPropId) {
        sheetName = rowsProps[i][1];
        break;
      }
    }
    if (!sheetName) {
      throw new Error('No se encontró la hoja para la propiedad con ID: ' + newPropId);
    }
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('No se encontró la hoja: ' + sheetName);
    }
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === gastoId) {
        // Formatos de columna: [id, fecha, concepto, monto, categoria, descripcion]
        sheet.getRange(i + 1, 2).setValue(gasto.fecha);
        sheet.getRange(i + 1, 3).setValue(gasto.concepto);
        sheet.getRange(i + 1, 4).setValue(gasto.monto);
        sheet.getRange(i + 1, 5).setValue(gasto.categoria);
        sheet.getRange(i + 1, 6).setValue(gasto.descripcion);
        break;
      }
    }
  }
  return gasto;
}
`;

function LoginScreen({ onLogin }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [configuracionInicial, setConfiguracionInicial] = useState(false);
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [cargando, setCargando] = useState(true);
    
    // Configuración de Sheets
    const [sheetConfigured, setSheetConfigured] = useState(!!getWebhookUrl());
    const [sheetUrlInput, setSheetUrlInput] = useState('');
    const [copiado, setCopiado] = useState(false);

    useEffect(() => {
        if (sheetConfigured) {
            verificarConfiguracion();
        } else {
            setCargando(false);
        }
    }, [sheetConfigured]);

    const verificarConfiguracion = async () => {
        if (!getWebhookUrl()) {
            setSheetConfigured(false);
            setCargando(false);
            return;
        }
        try {
            setCargando(true);
            const data = await googleSheetsClient.checkConfig();
            if (!data.configurado) {
                setConfiguracionInicial(true);
            } else {
                setConfiguracionInicial(false);
            }
        } catch (error) {
            console.error('Error verificando configuración:', error);
            setError('Error al conectar con la planilla. Verifica que la URL sea correcta y que la implementación esté activa.');
            setSheetConfigured(false);
        } finally {
            setCargando(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            setCargando(true);
            const data = await googleSheetsClient.checkConfig();

            // Hash de contraseña
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
            setError('Error al verificar contraseña: ' + error.message);
        } finally {
            setCargando(false);
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
            setCargando(true);
            const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nuevaPassword));
            const hashArray = Array.from(new Uint8Array(hash));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            await googleSheetsClient.setPassword(hashHex);

            setConfiguracionInicial(false);
            onLogin(true);
        } catch (error) {
            console.error('Error guardando password:', error);
            setError('Error al guardar la contraseña: ' + error.message);
        } finally {
            setCargando(false);
        }
    };

    const handleSaveUrl = (e) => {
        e.preventDefault();
        if (!sheetUrlInput.trim().startsWith('https://script.google.com/')) {
            setError('Por favor, ingresa una URL válida de Google Apps Script Web App.');
            return;
        }
        setWebhookUrl(sheetUrlInput.trim());
        setError('');
        setSheetConfigured(true);
    };

    const copiarCodigo = () => {
        navigator.clipboard.writeText(APPS_SCRIPT_CODE);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    };

    if (cargando) {
        return <div className="cargando">Conectando con Google Sheets...</div>;
    }

    if (!sheetConfigured) {
        return (
            <div className="login-screen">
                <div className="login-card config-card">
                    <h1>🏠 Gestor de Gastos</h1>
                    <h2>Conectar con Google Sheets</h2>
                    <p className="descripcion-config">
                        Esta aplicación utiliza Google Sheets como base de datos en la nube. Sigue estos pasos para conectarla:
                    </p>
                    <div className="pasos-config">
                        <ol>
                            <li>Crea una nueva planilla en <strong>Google Sheets</strong>.</li>
                            <li>Ve a <strong>Extensiones ➔ Apps Script</strong>.</li>
                            <li>Borra todo el código existente y pega el código backend.</li>
                            <li>Guarda el proyecto con el icono de disco.</li>
                            <li>Haz clic en <strong>Desplegar ➔ Nueva implementación</strong>.</li>
                            <li>Selecciona <strong>Aplicación web</strong>. Configura <em>Ejecutar como:</em> <strong>Yo</strong> y <em>Acceso:</em> <strong>Cualquiera</strong>.</li>
                            <li>Presiona <strong>Desplegar</strong>, autoriza los permisos y copia la URL generada.</li>
                        </ol>
                    </div>

                    <button type="button" onClick={copiarCodigo} className="btn-secundario btn-copiar">
                        {copiado ? '✅ ¡Copiado con éxito!' : '📋 Copiar Código Apps Script'}
                    </button>

                    <form onSubmit={handleSaveUrl} className="form-config-url">
                        <div className="form-grupo">
                            <label>URL de Apps Script Web App</label>
                            <input
                                type="url"
                                value={sheetUrlInput}
                                onChange={(e) => setSheetUrlInput(e.target.value)}
                                placeholder="https://script.google.com/macros/s/.../exec"
                                required
                            />
                        </div>
                        {error && <div className="error-message">{error}</div>}
                        <button type="submit" className="btn-primario btn-ancho">
                            ⚡ Conectar Planilla
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (configuracionInicial) {
        return (
            <div className="login-screen">
                <div className="login-card">
                    <h1>🏠 Gestor de Gastos</h1>
                    <h2>Configuración Inicial</h2>
                    <p>Establece una contraseña para proteger tus datos en la planilla</p>
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
                        <button type="submit" className="btn-primario btn-ancho">
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
                    <button type="submit" className="btn-primario btn-ancho">
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
    const [configuracionAbierta, setConfiguracionAbierta] = useState(false);
    const [sheetUrlInput, setSheetUrlInput] = useState(getWebhookUrl());

    useEffect(() => {
        if (autenticado) {
            cargarDatos();
        }
    }, [autenticado]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const data = await googleSheetsClient.getDatos();
            setPropiedades(data.propiedades || []);
            setGastos(data.gastos || []);

            console.log('Datos cargados:', {
                propiedades: data.propiedades?.length,
                gastos: data.gastos?.length
            });
        } catch (error) {
            console.error('Error cargando datos:', error);
            alert('Error al cargar datos del servidor: ' + error.message);
        } finally {
            setCargando(false);
        }
    };

    const agregarGasto = async (nuevoGasto) => {
        try {
            const gastoId = 'g_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            const gastoCompleto = {
                id: gastoId,
                concepto: nuevoGasto.concepto,
                monto: nuevoGasto.monto,
                categoria: nuevoGasto.categoria,
                propiedad_id: nuevoGasto.propiedadId,
                descripcion: nuevoGasto.descripcion,
                fecha: nuevoGasto.fecha
            };

            await googleSheetsClient.agregarGasto(gastoCompleto);

            // Añadir propiedades con nombres de id alternativos para compatibilidad
            const gastoConIds = {
                ...gastoCompleto,
                propiedadId: nuevoGasto.propiedadId
            };

            setGastos([gastoConIds, ...gastos]);
            console.log('Gasto guardado:', gastoConIds);
        } catch (error) {
            console.error('Error guardando gasto:', error);
            alert('Error al guardar el gasto: ' + error.message);
        }
    };

    const editarGasto = async (gastoEditado, oldPropiedadId) => {
        try {
            await googleSheetsClient.editarGasto(gastoEditado, oldPropiedadId);

            setGastos(prevGastos => {
                const index = prevGastos.findIndex(g => g.id === gastoEditado.id);
                if (index !== -1) {
                    const copy = [...prevGastos];
                    copy[index] = {
                        ...gastoEditado,
                        propiedadId: gastoEditado.propiedad_id
                    };
                    return copy;
                }
                return prevGastos;
            });
            console.log('Gasto editado:', gastoEditado);
        } catch (error) {
            console.error('Error al editar el gasto:', error);
            alert('Error al editar el gasto: ' + error.message);
        }
    };

    const eliminarGasto = async (id) => {
        const gastoAEliminar = gastos.find(g => g.id === id);
        if (!gastoAEliminar) return;

        if (window.confirm('¿Estás seguro de eliminar este gasto?')) {
            try {
                const propiedadId = gastoAEliminar.propiedad_id || gastoAEliminar.propiedadId;
                await googleSheetsClient.eliminarGasto(id, propiedadId);

                setGastos(gastos.filter(g => g.id !== id));
                console.log('Gasto eliminado:', id);
            } catch (error) {
                console.error('Error eliminando gasto:', error);
                alert('Error al eliminar el gasto: ' + error.message);
            }
        }
    };

    const guardarPropiedades = async (nuevasPropiedades) => {
        setPropiedades(nuevasPropiedades);
        // Borrar en cascada localmente todos los gastos de propiedades eliminadas
        const activasIds = nuevasPropiedades.map(p => p.id);
        setGastos(prevGastos => prevGastos.filter(g => {
            const pid = g.propiedad_id || g.propiedadId;
            return activasIds.includes(pid);
        }));
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
                    <div className="nav-header-acciones">
                        <button className="btn-config" onClick={() => setConfiguracionAbierta(true)} title="Configurar Planilla">
                            ⚙️ Planilla
                        </button>
                        <button className="btn-logout" onClick={handleLogout}>
                            🚪 Salir
                        </button>
                    </div>
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
                        onEditarGasto={editarGasto}
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

            {/* Modal de Configuración de Google Sheets */}
            {configuracionAbierta && (
                <div className="modal-overlay">
                    <div className="modal-contenido config-modal">
                        <h3>⚙️ Configuración de Google Sheets</h3>
                        <p>Modifica la conexión a tu hoja de cálculo o vuelve a copiar el código backend.</p>
                        
                        <div className="form-grupo">
                            <label>URL de Apps Script Web App</label>
                            <input
                                type="url"
                                value={sheetUrlInput}
                                onChange={(e) => setSheetUrlInput(e.target.value)}
                                placeholder="https://script.google.com/macros/s/.../exec"
                                required
                            />
                        </div>
                        
                        <div className="modal-acciones">
                            <button className="btn-secundario btn-copiar-modal" onClick={() => {
                                navigator.clipboard.writeText(APPS_SCRIPT_CODE);
                                alert('Código Apps Script copiado al portapapeles.');
                            }}>
                                📋 Copiar Código Apps Script
                            </button>
                            <div className="modal-botones-derecha">
                                <button className="btn-cancelar" onClick={() => setConfiguracionAbierta(false)}>
                                    Cancelar
                                </button>
                                <button className="btn-primario" onClick={() => {
                                    if (!sheetUrlInput.trim().startsWith('https://script.google.com/')) {
                                        alert('Por favor ingresa una URL válida.');
                                        return;
                                    }
                                    setWebhookUrl(sheetUrlInput.trim());
                                    setConfiguracionAbierta(false);
                                    window.location.reload();
                                }}>
                                    💾 Guardar y Reiniciar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;