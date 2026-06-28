/**
 * Gestor de Gastos - Google Apps Script Backend
 * 
 * Instrucciones de instalación:
 * 1. Crea una nueva planilla en Google Sheets.
 * 2. Ve a Extensiones -> Apps Script.
 * 3. Reemplaza cualquier código existente con este bloque completo.
 * 4. Presiona el botón de Guardar (icono de disco).
 * 5. Haz clic en "Desplegar" -> "Nueva implementación".
 * 6. Tipo: "Aplicación web".
 * 7. Ejecutar como: "Yo" (tu correo de Google).
 * 8. Quién tiene acceso: "Cualquiera" (Anyone).
 * 9. Haz clic en Desplegar. Autoriza los permisos requeridos.
 * 10. Copia la "URL de la aplicación web" generada.
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
  var clean = name.replace(/[\\\/\?\*\:\[\]]/g, '').trim();
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
