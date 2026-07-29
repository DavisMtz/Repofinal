# Referencia de funciones

El API del servidor: qué puede llamar el navegador, qué recibe y qué devuelve. Para consultar
mientras escribes código de pantalla.

---

## Cómo se llama al servidor

Desde el navegador, con `AppRun` (el envoltorio de `google.script.run` que vive en `app_core.html`):

```javascript
// Devuelve una promesa y deduplica llamadas idénticas en vuelo.
const r = await AppRun('getQuotesForUser', AppSession.email(), termino, false);
if (r.success) pintar(r.quotes);
```

`google.script.run` directo también funciona, pero pierdes la deduplicación y el manejo de error
uniforme.

### Dos convenciones de respuesta

El proyecto arrastra dos formas. **No las mezcles dentro de un mismo módulo.**

| Convención | Quién la usa | Forma |
|---|---|---|
| `success` | Cotizaciones, correos, formatos, métricas | `{success: true, ...}` / `{success: false, message}` |
| `status` | Portal y anuncios | `{status: 'ok', ...}` / `{status: 'error', error}` |

**Las funciones expuestas al cliente no lanzan.** Devuelven el error en el objeto.

### Advertencia de seguridad

> En Apps Script **toda función global `.gs` es invocable** desde `google.script.run`, la llame o no
> tu pantalla. Con `access: DOMAIN`, eso convierte a estas funciones en un API abierto al dominio.
>
> **Al agregar una función nueva:** si toca datos, ponle su control de identidad dentro. No confíes
> en que la pantalla la proteja. Las privadas llevan `_` al final del nombre por convención, pero
> eso **no** las hace inaccesibles.

---

## Sesión e identidad

### `getUserEmail(correoPortal)`
El correo efectivo según el modo de autenticación. `null` si no se puede resolver.

### `registerUser(name, email, password)`
Alta de usuario.

- Normaliza el correo (minúsculas, sin espacios).
- Exige nombre, correo válido y contraseña ≥ 6 caracteres.
- Rechaza correos duplicados.
- Rol inicial: `Avanzado = 'No'`.

→ `{success, message}`

### `loginUser(email, password)`
Valida credenciales.

- Freno de fuerza bruta: 8 intentos por correo en 15 minutos.
- Comparación de hash en tiempo constante.

→ `{success, message, userName, userEmail, isAdvanced}`

### `secDiagnostico(correoPortal)`
Diagnóstico de identidad: qué modo está activo, qué correo declara el navegador, cuál es la cuenta
de Google y qué resolvió el sistema. Úsala cuando alguien reporte "no me reconoce".

---

## Cotizaciones

### `saveQuoteAndGoToPreview(quoteData)`
Guarda con estatus `Folio Generado` y devuelve el folio. Si `quoteData.folio` viene, actualiza; si
no, genera uno nuevo.

Forma de `quoteData`:

```javascript
{
  folio: '',                    // vacío = nueva
  timestamp: null,
  advisorEmail, advisorName, advisorExt,
  clientName, clientEmail, clientPhone,
  summarySubtotal, summaryVat, summaryTotal,
  observations,
  format: 'actual',             // o 'ccl_liverpool'
  products: [{
    sku, description, quantity, unitPrice,
    costPaymentUnique,
    discountPublicPercent,
    additionalDiscountApplied,   // 'Si' | 'No'
    additionalDiscountPercent,
    imageUrl
  }]
}
```

→ `{success, folio, message}`

### `getQuotesForUser(callingUserEmail, searchTerm, forzarRecarga)`
Las cotizaciones del asesor. Con `searchTerm` busca por folio y cliente **con tolerancia a errores
de dedo**. `forzarRecarga = true` salta la caché.

→ `{success, quotes: [...]}`

### `getQuoteDetails(folio)`
Cotización completa con sus productos.

→ `{success, quote: {..., products: [...]}}`

### `getDashboardStats()`
Datos del dashboard: mes actual y anterior, por asesor, últimos 7 días, hoy y últimas cotizaciones.

→ `{success, stats: {currentMonthCount, previousMonthCount, quotesPerUser, last7Days, today, lastQuotes}}`

### `getSupervisionQuotes(email)` 🔒
**Rol avanzado.** Todas las cotizaciones del sistema, ordenadas por fecha descendente, con
`timestamp` en ISO para filtrar por rango sin ambigüedad.

→ `{success, quotes: [...]}`

### `sendWebhookNotification(folio)`
Avisa a Google Chat que hay un folio nuevo. **Solo manda el folio**, nunca datos de cliente. La
llama `saveQuoteDataToSheets` cuando la cotización es nueva.

---

## Formatos y PDF

### `getEnabledQuoteFormats()`
Los formatos que el asesor puede elegir: habilitados **y** utilizables.

→ `{success, formats: [{id, name, description}], defaultId}`

### `getFormatSettings(email)` 🔒
**Rol avanzado.** El catálogo completo con estado y disponibilidad real.

→ `{success, formats: [{id, name, description, enabled, available, unavailableReason}]}`

### `setQuoteFormatEnabled(email, formatId, enabled)` 🔒
**Rol avanzado.** Enciende o apaga un formato. **No permite dejar cero habilitados.**

→ `getFormatSettings(email)` con el estado nuevo.

### `generateQuotePdfBlob(folio, formatId)`
El PDF listo para adjuntar o descargar. Si omites `formatId`, usa el guardado en la cotización.

- `actual` → HTML → PDF.
- `ccl_liverpool` → copia la plantilla de Sheets, la llena y la exporta.

**Lanza** si no hay folio o si el formato no se puede generar.

### `downloadQuotePdf(folio, formatId)`
El PDF en base64, para descarga desde el navegador.

### `openQuoteInSheets(folio)`
Genera —o reutiliza— la hoja CCL del folio y devuelve su enlace. Lo guarda en `LinkSheetCCL`.

### `probarAccesoCcl()`
Diagnóstico: verifica que la plantilla CCL abra y tenga su pestaña. Corre desde el editor.

---

## Correos

### `getMailSenderInfo()`
Desde qué remitente saldrán los correos. Se cachea por usuario 6 h, y **solo cuando el alias
existe**: si aún no está dado de alta, no se cachea, para que la pantalla lo refleje en cuanto
alguien lo configure.

→ `{success, alias, aliasAvailable, effectiveSender}`

### `getQuoteDetailsForEmail(folio)`
Los datos de la cotización con el asunto y el cuerpo ya sugeridos.

### `sendQuoteByEmail(emailData)` 🔒
**Requiere sesión.** Envía la cotización con su PDF adjunto.

```javascript
{ to, subject, body, folio, format, asesor }
```

Orden de ejecución: valida sesión → valida destinatarios (máx. 3, asunto ≤ 250) → genera PDF →
arma HTML → envía → registra métrica.

Sale desde el alias institucional si está disponible; si no, desde la cuenta propia. `replyTo`
siempre es el asesor.

→ `{success, message, sentFrom}`

### `enviarCorreoPlantilla(payload)` 🔒
**Requiere sesión.** Correo de plantilla al cliente. El HTML llega ya armado desde el navegador
(idéntico a la vista previa) y aquí solo se valida y se envía.

```javascript
{ plantilla, to, cc, cco, asunto, htmlBody,
  adjuntos: [{nombre, mime, base64}], asesor }
```

Plantillas válidas: `ticket`, `edodecuenta`, `edodecuentaextranjera`, `validacionexitosa`,
`formato`, `textoplano`.

> **`cotizacion` no se acepta aquí.** Esa va por `sendQuoteByEmail`, con su PDF.

→ `{status: 'ok', sentFrom}` / `{status: 'error', error}`

### `getVerifiedImageUrl(sku, preferredUrl)`
Devuelve una URL de imagen que **responde**. Prueba la sugerida y los subdominios de imágenes de
Liverpool, en paralelo.

> **Deuda:** acepta una URL arbitraria del llamador y le hace `fetch`. Es un SSRF ciego (M-05 del
> informe de seguridad). Al tocar esta función, restringe el destino a dominios permitidos.

### `getResumenMetricasCorreos(solicitanteEmail)` 🔒
**Rol avanzado.** Resumen de envíos: totales, por tipo, por día (30), por asesor y los últimos 20.
Caché de 10 min.

→ `{success, total, enviados, errores, porTipo, porDia, porAsesor, recientes}`

---

## Portal

### `fetchToolsData()`
Todo el contenido del Portal en una llamada. Caché de 10 min. **Solo cachea si `status === 'ok'`.**

→ `{herramientas, presentaciones, paqueterias, formatos, pdePago, plantillas, anuncios, avisos, status, error}`

`avisos` existe solo por compatibilidad con cachés viejas del navegador: son los anuncios de formato
`banner`, aplanados.

### `fetchApplicationData()`
Promociones, Marketplace y calendario a 90 días.

→ `{promociones: [...], eventos: [...], status, error}`

Cada promoción: `{origen, direccion, categoria, promocion, marca, vigencia, liga}`.
Cada evento: `{titulo, inicio, fin, esTodoElDia, descripcion, ubicacion}`.

Si el calendario falla, `eventos` viene vacío y el resto se sirve igual.

### `fetchPromoCounts()`
El widget *"Hoy en promociones"*. Reutiliza `fetchApplicationData`, que ya está cacheado.

→ `{status, activas, porTerminar}` — *por terminar* = vencen en ≤ 3 días.

### `reportBrokenLink(report)`
Registra un enlace roto. Máximo 20 por usuario por hora.

```javascript
{ seccion, nombre, enlace }
```

→ `{status: 'ok'}` / `{status: 'error', error}`

---

## Anuncios 🔒

Todas exigen **rol avanzado** y todas invalidan la caché del Portal.

### `publicarAnuncio(payload)`
Crea o actualiza. Si mandas `id`, actualiza; si no, genera `anc-<base36>`.

```javascript
{ id, formato, activo, orden, desde, hasta, datos: {...}, asesor }
```

`formato` ∈ `banner` · `destacado` · `tarjeta` · `modal`. Las fechas van como `YYYY-MM-DD`; `hasta`
se guarda al final del día.

→ `{status: 'ok', id}`

### `getAnunciosAdmin(email)`
**Todas** las publicaciones: activas, apagadas y expiradas.

### `eliminarAnuncio(id, email)`
Borra. **No se puede deshacer.**

### `toggleAnuncio(id, activo, email)`
Enciende o apaga sin borrar.

### `moverAnuncio(id, dir, email)`
Cambia el orden. `dir` = `'up'` / `'down'`.

### `subirImagenAnuncio(payload)`
Sube una imagen a la carpeta del Portal y devuelve su URL.

### `probarCarpetaAnuncios()`
Diagnóstico de la carpeta de Drive.

---

## Administración y diagnóstico

### `revisionMaestra()`
**La función maestra.** Ejecútala desde el editor de Apps Script.

1. Google pide autorizar **todos** los permisos de una sola vez, porque toca todos los servicios.
2. Deja en *Ver → Registro de ejecución* un reporte legible: identidad, despliegue, las dos bases de
   datos y sus columnas, formatos, correo, calendario, caché y secretos.

Cada línea sale con ✔ o ✖. **Una línea con ✖ dice exactamente qué se rompió.**

Córrela después de cualquier cambio de hojas o columnas, y después de cada redespliegue.

### `getSystemHealth(email)` 🔒
**Rol avanzado.** El mismo reporte, pero desde el panel de supervisión, sin abrir el editor.

### `verificarVersionDelCodigo()`
Verifica que las funciones clave sean la versión nueva, buscando marcas dentro de su código fuente.

Casi siempre que falla es porque **hay un archivo `.gs` duplicado** (una copia de respaldo) en el
proyecto. Bórrala del editor y vuelve a correrla.

### `cotCacheDiagnostico()`
Estado de la caché de cotizaciones: generación actual y qué hay guardado.

### `secGuardarConfiguracion()`
Mueve los valores sensibles a Script Properties. **Se corre una vez, a mano, con los valores
reales.** Después vacía las constantes de `Code.gs` y `Portal.gs`.

### `secFijarModoAuth(modo)`
Cambia `AUTH_MODO`: `portal`, `auto`, `estricto` o `legado`.

---

## Funciones privadas que conviene conocer

No se llaman desde el navegador, pero las vas a tocar si extiendes el sistema.

| Función | Qué hace |
|---|---|
| `secIdentidad_(email)` | **Resuelve quién eres.** Todo pasa por aquí. |
| `secIdentidadAvanzada_(email)` | Lo mismo + verifica rol avanzado. |
| `secConfig_(clave, respaldo)` | Propiedad del script, o la constante si no existe. |
| `secEscapeHtml_(texto)` | Escapa HTML. **Úsala siempre** antes de insertar texto de usuario. |
| `secComparacionSegura_(a, b)` | Comparación en tiempo constante, para hashes. |
| `secIntentosRevisar_/Sumar_/Limpiar_` | El limitador de intentos. |
| `cotCacheado_(nombre, ttl, productor, aceptar, forzar)` | **El patrón de caché.** Úsalo para toda lectura nueva. |
| `cotInvalidarCache_()` | **Llámala después de toda escritura correcta.** Nunca antes. |
| `secNormalizarCorreo_(email)` | Minúsculas, sin espacios. |
| `fuzzyScore_(texto, término)` | La búsqueda tolerante. |

---

## Al agregar una función nueva

1. **Ponle prefijo de su capa**: `sec*`, `cot*`, `portal*`, `met*`, `cc*`, `ccl*`. El ámbito global
   es compartido entre todos los `.gs`.
2. **Si es privada, termina el nombre en `_`.** Es convención, no protección.
3. **Si toca datos, valida identidad dentro** con `secIdentidad_` o `secIdentidadAvanzada_`.
4. **No lances si la llama el navegador.** Devuelve el error en el objeto.
5. **Si escribe, llama `cotInvalidarCache_()` al final.** Si lee, envuélvela en `cotCacheado_`.
6. **Escapa con `secEscapeHtml_()`** todo lo que venga del usuario y vaya a HTML.
7. **Documéntala aquí** en el mismo cambio.
