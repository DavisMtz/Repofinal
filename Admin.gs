/**
 * =================================================================================================
 * ADMINISTRACIÓN Y DIAGNÓSTICO | Sistema de cotizaciones Ventel + Portal Ventel
 * =================================================================================================
 * FUNCIÓN MAESTRA: revisionMaestra()
 *
 * Ejecútala UNA VEZ desde el editor de Apps Script (seleccionar "revisionMaestra" → Ejecutar):
 *   1. Google pedirá autorizar TODOS los permisos del proyecto de una sola vez
 *      (Sheets, Drive, Gmail, Calendario y peticiones externas), porque la función
 *      toca todos los servicios que usa el sistema.
 *   2. Al terminar deja en el registro (Ver → Registro de ejecución) un reporte
 *      legible del estatus de las dos bases de datos (Cotizaciones y Portal),
 *      los formatos de cotización, el correo, el calendario y la caché.
 *
 * También conviene correrla después de cualquier cambio de hojas/columnas o de un
 * re-despliegue: cualquier línea con ✖ indica exactamente qué se rompió.
 */

function revisionMaestra() {
  const inicio = new Date();
  const reporte = { fecha: inicio.toISOString(), usuario: '', url: '', checks: [] };

  function check(area, nombre, fn) {
    try {
      const detalle = fn();
      reporte.checks.push({ area: area, nombre: nombre, ok: true, detalle: detalle || 'OK' });
    } catch (e) {
      reporte.checks.push({ area: area, nombre: nombre, ok: false, detalle: e.message || String(e) });
    }
  }

  /** Verifica que exista la hoja y que tenga las columnas requeridas; devuelve el conteo de filas. */
  function checarHoja(ss, nombre, columnasRequeridas) {
    const sheet = ss.getSheetByName(nombre);
    if (!sheet) throw new Error('La hoja "' + nombre + '" NO existe.');
    const filas = Math.max(0, sheet.getLastRow() - 1);
    let faltantes = [];
    if (columnasRequeridas && columnasRequeridas.length && sheet.getLastColumn() > 0) {
      const hdr = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
      faltantes = columnasRequeridas.filter(function (c) { return hdr.indexOf(c) === -1; });
    }
    if (faltantes.length) throw new Error(nombre + ': faltan columnas [' + faltantes.join(', ') + '] · ' + filas + ' filas');
    return filas + ' filas, columnas completas';
  }

  // ── 1. IDENTIDAD Y DESPLIEGUE ─────────────────────────────────────────────
  check('Despliegue', 'Cuenta que ejecuta', function () {
    reporte.usuario = Session.getActiveUser().getEmail() || '(no visible)';
    return reporte.usuario + ' · zona horaria ' + Session.getScriptTimeZone();
  });
  check('Despliegue', 'URL de la web app', function () {
    reporte.url = ScriptApp.getService().getUrl() || '';
    if (!reporte.url) throw new Error('El proyecto aún no está desplegado como aplicación web.');
    return reporte.url;
  });

  // ── 2. BASE DE DATOS DE COTIZACIONES (hoja ligada al script) ──────────────
  check('BD Cotizaciones', 'Acceso a la hoja', function () {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('No hay hoja de cálculo ligada al script.');
    return '"' + ss.getName() + '" (' + ss.getId() + ')';
  });
  check('BD Cotizaciones', 'Hoja Registros', function () {
    return checarHoja(SpreadsheetApp.getActiveSpreadsheet(), REGISTROS_SHEET_NAME,
      ['Nombre', 'Email', 'PasswordHash', 'Avanzado']);
  });
  check('BD Cotizaciones', 'Hoja Cotizaciones', function () {
    return checarHoja(SpreadsheetApp.getActiveSpreadsheet(), COTIZACIONES_SHEET_NAME,
      ['Folio', 'Timestamp', 'AsesorCorreo', 'AsesorNombre', 'ClienteNombre', 'CorreoCliente',
       'Subtotal', 'IVA', 'TotalGeneral', 'Estatus', 'Observaciones']);
  });
  check('BD Cotizaciones', 'Hoja DetalleCotizaciones', function () {
    return checarHoja(SpreadsheetApp.getActiveSpreadsheet(), DETALLE_COTIZACIONES_SHEET_NAME,
      ['FolioCotizacion', 'SKU', 'DescripcionProducto', 'Cantidad', 'PrecioUnitarioBase',
       'CostoPagoUnicoLinea', 'DescPublicoPorcentaje', 'AplicaDescAdicional', 'PorcentajeDescAdicional']);
  });

  // ── 3. BASE DE DATOS DEL PORTAL (por ID) ──────────────────────────────────
  check('BD Portal', 'Acceso a la hoja del Portal', function () {
    const ss = portalSS_();
    return '"' + ss.getName() + '" (' + PORTAL_SHEET_ID + ')';
  });
  ['Herramientas', 'Presentaciones', 'Paqueterias', 'Formatos', 'PdePago', 'Plantillas'].forEach(function (h) {
    check('BD Portal', 'Hoja ' + h, function () { return checarHoja(portalSS_(), h, null); });
  });
  ['Anuncios', 'Promociones', 'MKP', 'Reportes'].forEach(function (h) {
    check('BD Portal', 'Hoja ' + h + ' (opcional)', function () {
      const sheet = portalSS_().getSheetByName(h);
      if (!sheet) return 'no existe (el portal funciona sin ella)';
      return Math.max(0, sheet.getLastRow() - 1) + ' filas';
    });
  });
  check('BD Portal', 'Datos del portal (fetchToolsData)', function () {
    const d = buildToolsData_(); // sin caché: mide el estado real
    if (d.status !== 'ok') throw new Error(d.error || 'estado ' + d.status);
    return d.herramientas.length + ' herramientas · ' + d.paqueterias.length + ' paqueterías · '
      + d.formatos.length + ' formatos · ' + d.plantillas.length + ' plantillas · '
      + d.anuncios.length + ' anuncios visibles';
  });

  // ── 4. FORMATOS DE COTIZACIÓN ─────────────────────────────────────────────
  check('Formatos', 'Catálogo de formatos', function () {
    const r = getEnabledQuoteFormats();
    if (!r || !r.success) throw new Error((r && r.message) || 'getEnabledQuoteFormats falló.');
    if (!r.formats.length) throw new Error('Ningún formato habilitado: los asesores no pueden cotizar.');
    return r.formats.map(function (f) { return f.id; }).join(', ') + ' · predeterminado: ' + r.defaultId;
  });
  check('Formatos', 'Plantilla CCL accesible', function () {
    const ss = SpreadsheetApp.openById(cclTemplateId_());
    const sheet = ss.getSheetByName(CCL_SHEET_NAME);
    if (!sheet) throw new Error('La plantilla existe pero no tiene la pestaña "' + CCL_SHEET_NAME + '".');
    return '"' + ss.getName() + '" · pestaña "' + CCL_SHEET_NAME + '" OK';
  });
  check('Formatos', 'Carpeta de salida CCL (Drive)', function () {
    const folder = getCclFolder_();
    return '"' + folder.getName() + '" (' + folder.getId() + ')';
  });

  // ── 5. CORREO ─────────────────────────────────────────────────────────────
  check('Correo', 'Remitente de cotizaciones', function () {
    const info = getMailSenderInfo();
    if (!info.success) throw new Error(info.message || 'no se pudo consultar Gmail');
    return info.aliasAvailable
      ? 'alias ' + info.alias + ' disponible'
      : 'alias ' + info.alias + ' NO dado de alta; se enviará desde ' + info.effectiveSender;
  });

  // ── 6. CALENDARIO DE PROMOCIONES ──────────────────────────────────────────
  check('Calendario', 'Calendario comercial', function () {
    const cal = CalendarApp.getCalendarById(PORTAL_CALENDAR_ID);
    if (!cal) throw new Error('Sin acceso al calendario ' + PORTAL_CALENDAR_ID + ' (pide que lo compartan con esta cuenta).');
    const hoy = new Date();
    const fin = new Date(); fin.setDate(hoy.getDate() + 90);
    return '"' + cal.getName() + '" · ' + cal.getEvents(hoy, fin).length + ' eventos en 90 días';
  });

  // ── 7. SEGURIDAD ──────────────────────────────────────────────────────────
  check('Seguridad', 'Modo de autenticación', function () {
    const modo = String(secConfig_('AUTH_MODO', 'portal')).toLowerCase();
    if (['portal', 'auto', 'estricto', 'legado'].indexOf(modo) < 0) {
      throw new Error('AUTH_MODO tiene un valor desconocido: "' + modo + '" (usa portal, auto, estricto o legado).');
    }
    if (modo === 'legado') {
      throw new Error('AUTH_MODO=legado: como "portal" pero sin respaldo cuando el navegador no manda correo. Usa "portal".');
    }
    if (modo === 'portal') {
      return 'portal · la sesión es la del correo con el que se entra al portal (la cuenta de Google no decide)';
    }
    return modo;
  });
  check('Seguridad', 'Identidad de Google visible', function () {
    const modo = String(secConfig_('AUTH_MODO', 'portal')).toLowerCase();
    const email = secUsuarioGoogle_();
    if (!email) {
      // En modo 'portal' la cuenta de Google solo es el respaldo para ejecuciones sin
      // navegador, así que no verla no rompe nada: se informa y ya.
      if (modo === 'portal') return '(no visible) · no hace falta en modo portal';
      throw new Error('Session.getActiveUser() no devuelve correo: revisa que el despliegue sea de DOMINIO y no "cualquier usuario".');
    }
    const reg = secBuscarRegistro_(email);
    return email + (reg.encontrado ? ' · dado de alta' + (reg.avanzado ? ' (avanzado)' : ' (normal)') : ' · NO está en Registros') +
      (modo === 'portal' ? ' · solo se usa como respaldo' : '');
  });
  check('Seguridad', 'Secretos fuera del código', function () {
    const props = PropertiesService.getScriptProperties();
    const faltantes = ['HASH_SALT', 'WEBHOOK_URL'].filter(function (k) { return !props.getProperty(k); });
    if (faltantes.length) {
      throw new Error('Aún viven en el código fuente: ' + faltantes.join(', ') + '. Ejecuta secGuardarConfiguracion().');
    }
    return 'HASH_SALT y WEBHOOK_URL están en las propiedades del script';
  });

  // ── 8. INFRAESTRUCTURA ────────────────────────────────────────────────────
  check('Infra', 'CacheService', function () {
    const c = CacheService.getScriptCache();
    c.put('diag_ping', 'ok', 60);
    if (c.get('diag_ping') !== 'ok') throw new Error('la caché no devuelve lo escrito');
    c.remove('diag_ping');
    return 'lectura/escritura OK';
  });
  check('Infra', 'Caché de lectura (Cache.gs)', function () {
    if (typeof cotCacheado_ !== 'function') {
      throw new Error('Cache.gs no está en el proyecto: la app funciona, pero relee la hoja completa en cada pantalla.');
    }
    const gen = cotGeneracion_();
    cotCachePut_('_diag_admin', { ok: true }, 60);
    const leido = cotCacheGet_('_diag_admin');
    if (!leido || !leido.ok) throw new Error('la caché no devuelve lo escrito');
    cotInvalidarCache_();
    if (cotCacheGet_('_diag_admin')) throw new Error('la invalidación por generación no surtió efecto');
    return 'lectura, escritura e invalidación OK (generación previa: ' + gen + ')';
  });
  check('Infra', 'LockService (folios)', function () {
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) throw new Error('no se pudo obtener el candado (¿otra ejecución activa?)');
    lock.releaseLock();
    return 'candado OK';
  });
  check('Infra', 'Webhook de Google Chat', function () {
    if (!WEBHOOK_URL) return 'no configurado (las notificaciones se omiten)';
    return 'configurado (no se envía mensaje de prueba para no hacer ruido en el chat)';
  });

  // ── RESUMEN ───────────────────────────────────────────────────────────────
  const errores = reporte.checks.filter(function (c) { return !c.ok; });
  reporte.ok = errores.length === 0;
  reporte.duracionMs = new Date() - inicio;

  Logger.log('═══════════ REVISIÓN MAESTRA · ' + inicio.toLocaleString('es-MX') + ' ═══════════');
  let areaActual = '';
  reporte.checks.forEach(function (c) {
    if (c.area !== areaActual) { areaActual = c.area; Logger.log('── ' + areaActual + ' ──'); }
    Logger.log((c.ok ? '  ✔ ' : '  ✖ ') + c.nombre + ' → ' + c.detalle);
  });
  Logger.log('───────────────────────────────────────────────');
  Logger.log(reporte.ok
    ? 'TODO EN ORDEN · ' + reporte.checks.length + ' verificaciones en ' + reporte.duracionMs + ' ms'
    : 'ATENCIÓN: ' + errores.length + ' problema(s): ' + errores.map(function (c) { return c.nombre; }).join(' · '));

  return reporte;
}

/**
 * ¿Qué versión del código está viva?
 *
 * Apps Script junta TODOS los archivos .gs en un mismo ámbito global. Si el proyecto
 * tiene una copia vieja de un archivo (Metricas copia.gs, Codigo1.gs…), las constantes
 * duplicadas revientan con "Identifier ... has already been declared" y las funciones
 * duplicadas NO revientan: simplemente gana la del archivo que se cargue al final, que
 * puede ser la vieja. Esto último es peligroso y silencioso.
 *
 * Ejecuta esta función desde el editor después de subir cambios: revisa que las piezas
 * de seguridad sean las nuevas. Si alguna sale ✖, hay un archivo duplicado en el
 * proyecto y hay que borrar la copia.
 */
function verificarVersionDelCodigo() {
  const esperado = [
    { nombre: 'metVerificarAsesor_', fn: typeof metVerificarAsesor_ === 'function' ? metVerificarAsesor_ : null,
      marca: 'secIdentidad_', pista: 'debe delegar en Seguridad.gs' },
    { nombre: 'isAdvancedUser', fn: typeof isAdvancedUser === 'function' ? isAdvancedUser : null,
      marca: 'secIdentidadAvanzada_', pista: 'debe delegar en Seguridad.gs' },
    { nombre: 'portalGateAvanzado_', fn: typeof portalGateAvanzado_ === 'function' ? portalGateAvanzado_ : null,
      marca: 'secIdentidadAvanzada_', pista: 'debe delegar en Seguridad.gs' },
    { nombre: 'loginUser', fn: typeof loginUser === 'function' ? loginUser : null,
      marca: 'secIntentosRevisar_', pista: 'debe traer el freno de fuerza bruta' },
    { nombre: 'getVerifiedImageUrl', fn: typeof getVerifiedImageUrl === 'function' ? getVerifiedImageUrl : null,
      marca: 'fetchAll', pista: 'debe verificar las imágenes en paralelo' },
    { nombre: 'doGet', fn: typeof doGet === 'function' ? doGet : null,
      marca: 'servirPagina_', pista: 'debe tener la página de error' }
  ];

  const problemas = [];
  Logger.log('═══ VERSIÓN DEL CÓDIGO EN EL PROYECTO ═══');
  esperado.forEach(function (e) {
    if (!e.fn) {
      Logger.log('  ✖ ' + e.nombre + ' → no existe en el proyecto');
      problemas.push(e.nombre);
      return;
    }
    const fuente = e.fn.toString();
    const ok = fuente.indexOf(e.marca) !== -1;
    Logger.log((ok ? '  ✔ ' : '  ✖ ') + e.nombre + ' → ' + (ok ? 'versión nueva' : 'VERSIÓN VIEJA · ' + e.pista));
    if (!ok) problemas.push(e.nombre);
  });

  Logger.log('───────────────────────────────────────');
  if (problemas.length) {
    Logger.log('ATENCIÓN: ' + problemas.length + ' función(es) con código viejo: ' + problemas.join(', '));
    Logger.log('Casi siempre significa que el proyecto tiene un archivo .gs DUPLICADO (una copia de respaldo).');
    Logger.log('Borra la copia en la lista de archivos del editor y vuelve a ejecutar esto.');
  } else {
    Logger.log('TODO EN ORDEN: el código que corre es el de esta versión.');
  }
  return { ok: problemas.length === 0, problemas: problemas };
}

/**
 * Versión para el panel de supervisión (usuarios avanzados): devuelve el mismo
 * reporte que revisionMaestra() pero valida el rol antes, para poder mostrarlo
 * en pantalla sin abrir el editor de Apps Script.
 */
function getSystemHealth(email) {
  if (!isAdvancedUser(email)) {
    return { success: false, message: 'Solo los usuarios avanzados pueden ver el estado del sistema.' };
  }
  try {
    return { success: true, report: revisionMaestra() };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
