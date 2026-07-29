# Informe de Revisión de Seguridad de la Información
## Sistema de Cotizaciones Ventel — Google Apps Script

| Campo | Dato |
|---|---|
| **Alcance** | `C:\Users\seguimientos\Desktop\Carpeta del proyecto` (32 archivos: 8 `.gs`, 23 `.html`, 1 `appsscript.json`) |
| **Fecha de revisión** | 28 de julio de 2026 |
| **Tipo de revisión** | Análisis estático de código fuente (SAST manual) + revisión de arquitectura de identidad y superficie externa |
| **Versión declarada** | 0.9 — "Pruebas de control" (`Code.gs:5`) |
| **Plataforma** | Google Apps Script (V8), web app desplegada, Google Sheets como base de datos |
| **Clasificación de datos tratados** | **Confidencial** — PII de clientes (nombre, correo, teléfono), precios, descuentos, credenciales de asesores |

---

## 1. Resumen ejecutivo

Se revisó el proyecto con foco en dos preguntas: **(a)** ¿se están usando servicios externos?, y **(b)** ¿se está filtrando información?

**Respuesta directa a la pregunta de negocio:**

> **No se encontró exfiltración deliberada ni encubierta de datos.** No hay analítica de terceros, ni telemetría, ni beacons, ni SDKs de tracking, ni llamadas a APIs de terceros con datos de cliente. Los datos de cotizaciones y clientes permanecen dentro del tenant de Google Workspace de Liverpool.
>
> **Sin embargo, sí existen dependencias externas activas y una fuga de perímetro de bajo impacto pero real**, y —lo más grave— **un modelo de identidad que no autentica al usuario del lado del servidor**, lo que permite que cualquier persona con cuenta del dominio suplante a cualquier asesor o supervisor, lea toda la base de cotizaciones y envíe correo desde el alias corporativo `cotizacion@liverpool.com.mx`.

**Veredicto de la revisión: NO APTO para producción en su estado actual.** Los hallazgos C-01, C-02 y C-03 deben remediarse antes de cualquier despliegue que trate datos reales de clientes.

### 1.1 Distribución de hallazgos

| Severidad | Cantidad | Hallazgos |
|---|---|---|
| 🔴 **Crítico** | 3 | C-01, C-02, C-03 |
| 🟠 **Alto** | 6 | A-01 … A-06 |
| 🟡 **Medio** | 7 | M-01 … M-07 |
| 🔵 **Bajo** | 6 | B-01 … B-06 |
| **Total** | **22** | |

### 1.2 Riesgo agregado

El riesgo no está en un bug aislado, sino en la **combinación** de tres decisiones de diseño:

```
  La identidad la declara el navegador (C-02)
              +
  El web app es accesible a TODO el dominio (appsscript.json)
              +
  Todas las funciones .gs globales son un API público para el dominio
              ↓
  Cualquier empleado con cuenta @liverpool.com.mx puede:
    · leer TODA la base de cotizaciones con PII de clientes
    · descargar cualquier PDF de cualquier folio
    · enviar correo HTML arbitrario desde cotizacion@liverpool.com.mx
    · publicar anuncios en el Portal visto por toda la operación
    · elevarse a rol "avanzado" declarando el correo de un supervisor
```

---

## 2. Inventario de servicios externos

Esta sección responde de forma exhaustiva a *"que no estemos usando servicios externos"*.

### 2.1 Llamadas salientes desde el **servidor** (`UrlFetchApp`)

| # | Destino | Archivo | Qué se envía | Riesgo |
|---|---|---|---|---|
| 1 | `chat.googleapis.com` (webhook Google Chat) | `Code.gs:963` | Solo el folio de la cotización. **Sin PII.** | 🔴 La URL contiene API key + token en el código fuente (**C-01**) |
| 2 | `ss*.liverpool.com.mx` (9 subdominios de imágenes) | `Correos.gs:810` | El SKU del producto. Infraestructura **propia de Liverpool**. | 🟢 Aceptable |
| 3 | **URL arbitraria** suministrada por el cliente (`preferredUrl`) | `Correos.gs:793` | Petición HTTP GET a donde indique el llamador | 🟡 SSRF ciego (**M-05**) |
| 4 | `docs.google.com/.../export?format=pdf` | `Formatos.gs:499` | Token OAuth propio del script. Servicio de Google. | 🟢 Aceptable |

**Conclusión servidor:** no hay envío de datos de cliente fuera de Google/Liverpool.

### 2.2 Recursos cargados por el **navegador** (terceros reales)

Estos sí constituyen dependencia y fuga de perímetro, porque cada petición revela al tercero: **IP del empleado, User-Agent, cabecera `Referer` con la URL de la app, y el momento exacto de uso.**

#### a) Scripts ejecutables de terceros — **sin Subresource Integrity (SRI)**

| Recurso | Archivos | Observación |
|---|---|---|
| `cdnjs.cloudflare.com/.../gsap/3.13.0/gsap.min.js` | `Index.html:10`, `Promociones.html:8`, `app_motion.html:1` | Versión fijada, **sin SRI** |
| `cdnjs.cloudflare.com/.../ScrollTrigger.min.js` | `Index.html:11`, `Promociones.html:9` | Versión fijada, **sin SRI** |
| `cdnjs.cloudflare.com/.../SplitText.min.js` | `inicioDeSesion.html:117`, `registro.html:138` | **En las pantallas de login y registro** |
| `cdnjs.cloudflare.com/.../DrawSVGPlugin.min.js` | `inicioDeSesion.html:118`, `registro.html:139` | **En las pantallas de login y registro** |
| `cdn.jsdelivr.net/npm/gsap@3.13.0/.../MorphSVGPlugin.min.js` | `Index.html:12`, `Promociones.html:10`, `app_motion.html:4` | Versión fijada, **sin SRI** |
| `cdn.jsdelivr.net/npm/chart.js` | `inicio_avanzado.html:7` | 🔴 **Sin versión fijada y sin SRI** |

> **Nota de severidad:** que `SplitText` y `DrawSVG` se carguen desde un CDN externo **en `inicioDeSesion.html`** significa que un compromiso de cdnjs permitiría a un tercero ejecutar JavaScript en la misma página donde el asesor teclea su contraseña. Ver **M-02**.

#### b) Tipografías

`fonts.googleapis.com` y `fonts.gstatic.com` — en `Index.html`, `Promociones.html`, `app_theme.html`, `consulta_cotizacion.html`, `cotizado_preview.html`. Servicio de Google; fuga limitada a metadatos de conexión.

#### c) Imágenes alojadas en sitios de terceros no controlados

Referenciadas desde `Index.html` (Portal corporativo), líneas 1450–1555:

| Host | Naturaleza |
|---|---|
| `1000marcas.net` | Blog de logotipos, sin relación contractual |
| `vectorseek.com` | Banco de vectores, sin relación contractual |
| `iconlogovector.com` | Banco de iconos, sin relación contractual |
| `funocomercial.com` | Sitio comercial de terceros |
| `cmsphoto.ww-cdn.com` | CDN de terceros |
| `portalagency.azurewebsites.net` | Azure de terceros |
| `pagaqui.com.mx` | Proveedor externo |
| `upload.wikimedia.org` | Wikimedia |
| `encrypted-tbn0.gstatic.com` | Caché de imágenes de Google |
| `placehold.co` | Generador de marcadores de posición |
| `lh5.googleusercontent.com/proxy/...` | Proxy de Google |

Adicionalmente, en documentos que se **envían por correo al cliente**: `assetspwa.liverpool.com.mx` y `assets.liverpool.com.mx` (propios, correctos) y `upload.wikimedia.org` (`Correos.gs:180`, `Correos.gs:465`, `cotizacion.html:117`, `cotizado_preview.html:385`) — **el logotipo institucional de Liverpool se sirve desde Wikipedia en correos a clientes.** Ver **M-03**.

### 2.3 Servicios externos **descartados** (verificado)

Se buscó explícitamente y **no se encontró**: Google Analytics, Meta Pixel, Hotjar, Sentry, Datadog, LogRocket, Mixpanel, `sendBeacon`, WebSockets, `fetch()` a terceros, `XMLHttpRequest`, `importScripts`, ni ninguna API key de proveedor externo distinta de la de Google Chat.

Se reconoce como **buena práctica ya aplicada**: el CDN de Tailwind (`cdn.tailwindcss.com`) fue retirado y sustituido por CSS compilado local (`app_tailwind.html:6`, documentado en el propio archivo). Es exactamente el patrón que debe replicarse con GSAP y Chart.js.

---

## 3. Hallazgos críticos

### 🔴 C-01 — Secretos en texto plano en el código fuente

**Archivo:** `Code.gs:29-30`
**CWE:** CWE-798 (Credenciales embebidas), CWE-540 (Información sensible en código fuente)

```javascript
const HASH_SALT  = "vPe/O5s2aG+Bv4cRGCwz+w==";
const WEBHOOK_URL = "https://chat.googleapis.com/v1/spaces/AAQAF6OTWgk/messages"
                  + "?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI"
                  + "&token=eUUUkEFC28CJYK0au8d5fRWkiZX5h7Zd7T-cAerb5wI";
```

**Impacto:**

1. **Webhook de Google Chat comprometido.** Cualquiera que obtenga esta URL —y está en texto plano en el código, en esta carpeta del Escritorio, y en cualquier copia o repositorio— puede publicar mensajes arbitrarios en el espacio de Chat corporativo `AAQAF6OTWgk`. Vector directo de ingeniería social interna ("Se ha generado una nueva cotización…" es un formato ya reconocido por el equipo).
2. **Sal de contraseñas expuesta.** `HASH_SALT` es la **única** sal del sistema, compartida por todos los usuarios (`Seguridad.gs:322`). Con la sal conocida, un atacante que obtenga la hoja `Registros` puede precomputar diccionarios y romper las contraseñas de todos los asesores en minutos. La sal deja de cumplir su función.

**Agravante:** estos valores están en una carpeta de Escritorio sin cifrado a nivel de archivo, fuera de cualquier gestor de secretos.

**Remediación:**
1. **Rotar de inmediato** el webhook de Google Chat (borrar y recrear el webhook del espacio).
2. **Rotar `HASH_SALT`** — implica forzar restablecimiento de contraseña a todos los usuarios (ver también M-01, que debe hacerse en el mismo movimiento).
3. Ejecutar `secGuardarConfiguracion()` (ya implementada en `Seguridad.gs:59`) para migrar los valores a *Script Properties*, y **después vaciar las constantes**: `const HASH_SALT = ""; const WEBHOOK_URL = "";`
4. Añadir estos archivos a control de cambios con revisión, y prohibir el patrón "respaldo en código" para secretos.

> **Nota:** el proyecto ya tiene la infraestructura correcta (`secConfig_`, `secGuardarConfiguracion`, y un chequeo en `Admin.gs:164-170` que verifica que los secretos estén en propiedades). **La migración simplemente no se ha ejecutado.** Es una corrección de bajo esfuerzo.

---

### 🔴 C-02 — La identidad del usuario la declara el propio cliente (suplantación total)

**Archivos:** `Seguridad.gs:176-232`, `appsscript.json:15-18`, `app_core.html:51-65`
**CWE:** CWE-287 (Autenticación incorrecta), CWE-290 (Suplantación por spoofing), CWE-807 (Decisión de seguridad sobre entrada no confiable)

El propio código lo documenta con honestidad (`Seguridad.gs:32-34`):

> *"OJO con 'portal': el correo lo declara el navegador, así que el servidor comprueba que exista en «Registros» pero **no puede probar que sea de quien dice ser**."*

**Cadena de explotación:**

```
appsscript.json → "access": "DOMAIN"
   → cualquier cuenta @liverpool.com.mx puede abrir el web app

En Apps Script, TODA función global .gs es invocable vía google.script.run
   → el atacante no necesita la UI; abre la consola del navegador y llama directo

secIdentidad_(emailCliente) confía en el parámetro `emailCliente`
   → basta con conocer (o adivinar) el correo de un supervisor

secIdentidadAvanzada_() solo comprueba la columna "Avanzado" de ESE correo
   → elevación de privilegio inmediata a rol supervisor
```

**Prueba de concepto (conceptual, no ejecutada):**

```javascript
// Desde la consola del navegador de cualquier empleado del dominio,
// con la app abierta:
google.script.run
  .withSuccessHandler(console.log)
  .getSupervisionQuotes('supervisor.conocido@liverpool.com.mx');
// → devuelve TODAS las cotizaciones del sistema con PII de clientes

google.script.run
  .withSuccessHandler(console.log)
  .getResumenMetricasCorreos('supervisor.conocido@liverpool.com.mx');
// → métricas completas de envíos por asesor
```

Los "gates" de rol avanzado (`portalGateAvanzado_`, `secIdentidadAvanzada_`, `isAdvancedUser`, `metVerificarAsesor_`) están **bien construidos y aplicados de forma consistente** — pero todos validan un dato que el atacante controla. La puerta es sólida; la cerradura acepta cualquier llave que se le declare.

**Impacto:**
- Suplantación de cualquier asesor registrado.
- Elevación de privilegio a rol supervisor/avanzado.
- Acceso completo a la base de cotizaciones con PII de clientes.
- Publicación, edición y borrado de anuncios en el Portal corporativo.
- Envío de correo desde el alias institucional (ver **C-03**).
- **Repudio total**: las bitácoras (`CorreosEnviados`, `MetricasCorreos`, columna `AsesorCorreo`, columna `Autor`) registran el correo *declarado*, no el real. Ante un incidente, los registros señalarán a un empleado inocente y no existe forma de distinguir la actividad legítima de la suplantada.

**Remediación (la corrección de mayor impacto de todo el informe):**

`Session.getActiveUser().getEmail()` **funciona de forma fiable y no falsificable** para cuentas del mismo dominio de Workspace en un web app con `access: DOMAIN`. La función `secUsuarioGoogle_()` (`Seguridad.gs:96`) ya la implementa.

1. **Cambiar `AUTH_MODO` a `'estricto'`** mediante `secFijarModoAuth('estricto')` (`Seguridad.gs:83`). Este modo ya está implementado y **elimina por completo la confianza en el correo declarado** (`Seguridad.gs:217-225`).
2. Si el requisito de negocio de "trabajar con un usuario del portal distinto a la cuenta de Google del navegador" es real, entonces debe implementarse con un **token de sesión firmado por el servidor**: emitido por `loginUser()`, almacenado en `CacheService`/`PropertiesService` con expiración, y validado en cada llamada. El correo por sí solo nunca puede ser la credencial.
3. **Nunca** derivar decisiones de autorización de un parámetro que viaja desde el cliente.

> **Recomendación de la revisión:** aunque el comentario del código señala que el modo `'portal'` fue *"elegido a propósito"*, esa elección intercambia toda la autenticación del sistema por una comodidad operativa. Debe elevarse a decisión formal de riesgo y documentarse con firma del dueño del dato, o corregirse. La revisión recomienda corregirse.

---

### 🔴 C-03 — Envío de correo HTML arbitrario desde el alias corporativo

**Archivos:** `CorreoCliente.gs:52-148`, `Correos.gs:296-306`, `Correos.gs:10`
**CWE:** CWE-285 (Autorización incorrecta), CWE-863 (Autorización incorrecta), CWE-451 (Suplantación de interfaz)

`enviarCorreoPlantilla(payload)` acepta desde el cliente:

| Campo | Control | Límite |
|---|---|---|
| `htmlBody` | **HTML completo, sin validación ni saneado** | 400 000 caracteres |
| `to` | Correos arbitrarios, **incluidos externos** | 3 destinatarios |
| `cc` | Correos arbitrarios, incluidos externos | 10 |
| `cco` (BCC) | Correos arbitrarios, incluidos externos | 10 |
| `adjuntos` | Base64 arbitrario, cualquier MIME | 20 MB |
| `asesor` | **Correo declarado — la única "autenticación"** | — |

Y lo envía con:

```javascript
// Correos.gs:10
const MAIL_ALIAS = 'cotizacion@liverpool.com.mx';
// CorreoCliente.gs:114
GmailApp.sendEmail(to.join(','), asunto, '', {..., from: MAIL_ALIAS });
```

**Impacto combinado con C-02 — cualquier empleado del dominio puede:**

1. **Phishing con remitente legítimo.** Correo HTML totalmente controlado, enviado desde `cotizacion@liverpool.com.mx`, que **pasará SPF, DKIM y DMARC** porque efectivamente sale de la infraestructura de Liverpool. Es indistinguible de un correo institucional real para el destinatario y para los filtros. El comentario del propio código lo confirma: *"el HTML final llega ya armado desde el cliente"* (`CorreoCliente.gs:6-7`).
2. **Canal de exfiltración de datos.** Hasta 20 MB de adjuntos arbitrarios + 10 destinatarios en **copia oculta**, hacia direcciones externas. El campo `cco` no aparece en ninguna vista de la aplicación fuera de la bitácora, y ésta registra el asesor *declarado*.
3. **Atribución falsa.** `registrarCorreoClienteEnviado_` y `metRegistrarEnvio_` graban el correo suplantado.
4. **Fallback silencioso.** Si el alias falla, `MailApp.sendEmail` envía igualmente desde la cuenta que despliega el script (`CorreoCliente.gs:121-124`) — el envío nunca se bloquea.

**Remediación:**
1. Corregir **C-02** primero (elimina el vector de suplantación).
2. **Construir el HTML en el servidor** a partir de la plantilla y de un conjunto acotado de variables, en lugar de aceptarlo del cliente. Las plantillas ya están enumeradas (`CC_PLANTILLAS_VALIDAS`, `CorreoCliente.gs:19`); el paso natural es que el servidor las renderice.
3. Si el HTML del cliente es un requisito de negocio innegociable, sanear con lista blanca de etiquetas/atributos y **prohibir** `<script>`, `<iframe>`, `<object>`, `<form>`, manejadores `on*` y URLs `javascript:`/`data:`.
4. Restringir destinatarios externos, o exigir aprobación/segundo factor para dominios fuera de la organización.
5. Registrar en la bitácora el correo **verificado** (`Session.getActiveUser()`), no el declarado. Añadir un hash del cuerpo enviado para trazabilidad forense.
6. Alertar al SOC ante envíos con BCC externo o adjuntos grandes.

---

## 4. Hallazgos altos

### 🟠 A-01 — IDOR: acceso sin autorización a cualquier cotización por folio

**Archivos:** `Code.gs:653` (`getQuoteDetails`), `Formatos.gs:680` (`downloadQuotePdf`), `Formatos.gs:587` (`openQuoteInSheets`)
**CWE:** CWE-639 (Autorización basada en clave controlada por el usuario), CWE-284

Estas tres funciones **no realizan ninguna comprobación de identidad ni de permisos.** Reciben un folio y devuelven el contenido:

```javascript
function getQuoteDetails(folio) {          // sin gate
function downloadQuotePdf(folio, formatId) { // sin gate
function openQuoteInSheets(folio) {         // sin gate
```

Los folios son **predecibles por diseño** (`Code.gs:285`, formato `LVP-AAMMDD-XXXX` con secuencial diario que reinicia en 1). Enumerar la base completa es trivial:

```
LVP-260728-0001, LVP-260728-0002, … LVP-260728-0050
LVP-260727-0001, …
```

**Datos expuestos por folio:** nombre del cliente, correo, teléfono, productos, SKUs, precios unitarios, descuentos aplicados, totales, observaciones, correo del asesor. Adicionalmente `openQuoteInSheets` **crea archivos en Drive** a petición del llamador no autenticado.

**Remediación:** aplicar `secIdentidad_()` en las tres funciones y verificar que el folio pertenezca al asesor solicitante, o que el solicitante tenga rol avanzado. Considerar folios no secuenciales (UUID) como defensa en profundidad.

---

### 🟠 A-02 — `getDashboardStats()` sin ningún control de acceso

**Archivo:** `Code.gs:752`

```javascript
function getDashboardStats() {   // sin parámetro de identidad, sin gate
```

Devuelve estadísticas agregadas del negocio: volumen de cotizaciones por mes, **cotizaciones por usuario** (`quotesPerUser`), últimos 7 días, actividad del día y **últimas cotizaciones** (`lastQuotes`). Invocable por cualquiera con acceso al dominio. Aunque el panel avanzado sí protege otras funciones (`getSupervisionQuotes`, `getResumenMetricasCorreos`), ésta quedó sin proteger.

**Remediación:** añadir `secIdentidadAvanzada_()` como en `getSupervisionQuotes` (`Code.gs:880`).

---

### 🟠 A-03 — La búsqueda expone toda la base de cotizaciones

**Archivo:** `Code.gs:554`, `Code.gs:600-615`

Documentado como decisión intencional (`Code.gs:600-603`): *"Cuando hay término de búsqueda se busca en TODO el sistema (no solo las cotizaciones propias)"*. El problema es la interacción con la búsqueda difusa:

- El emparejamiento es tolerante a errores (`fuzzyScore_`), por lo que un término genérico como `"a"` o `"@"` devuelve prácticamente **todo el conjunto de datos**.
- La búsqueda cubre folio, **nombre del cliente y correo del cliente** (`Code.gs:609`).
- El parámetro `callingUserEmail` no se verifica (ver C-02) y, en modo búsqueda, es irrelevante: no filtra nada.

Resultado: volcado completo de la base de clientes con un solo llamado, para cualquier usuario del dominio.

**Remediación:** exigir longitud mínima del término (≥4 caracteres), limitar el número de resultados, exigir coincidencia exacta de folio para cotizaciones ajenas, y registrar las búsquedas amplias para detección de exfiltración.

---

### 🟠 A-04 — Alcances OAuth excesivos con ejecución como el desplegador

**Archivo:** `appsscript.json`

```json
"oauthScopes": [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",          ← Drive COMPLETO
  "https://www.googleapis.com/auth/script.external_request",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/script.send_mail",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://mail.google.com/"                        ← Gmail COMPLETO
],
"webapp": { "executeAs": "USER_DEPLOYING", "access": "DOMAIN" }
```

**`https://mail.google.com/`** es el alcance más amplio de Gmail: leer, enviar, modificar y **borrar permanentemente** cualquier correo de la cuenta. **`.../auth/drive`** concede acceso total al Drive de esa cuenta, no solo a las carpetas del proyecto.

Con `executeAs: USER_DEPLOYING`, **todo el código se ejecuta con estos privilegios para cualquier usuario del dominio.** Combinado con C-02 y A-01, cualquier defecto explotable en el código opera sobre el buzón y el Drive completos de la cuenta desplegadora.

**Remediación:**
- Sustituir `https://mail.google.com/` por `https://www.googleapis.com/auth/gmail.send` (solo envío) — es suficiente para el uso real del proyecto salvo `GmailApp.getAliases()`, que requiere `gmail.settings.basic`.
- Sustituir `.../auth/drive` por `.../auth/drive.file` (solo archivos creados por la app), verificando el flujo de la plantilla CCL.
- Desplegar bajo una **cuenta de servicio dedicada** sin buzón personal ni Drive con información ajena al proyecto, nunca bajo la cuenta personal de un empleado.

---

### 🟠 A-05 — Archivos subidos se publican con acceso "cualquiera con el enlace"

**Archivo:** `Portal.gs:709-731`

```javascript
file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
```

Toda imagen subida mediante `subirImagenAnuncio` queda **accesible desde Internet público**, sin autenticación, de forma permanente. El gate previo (`portalGateAvanzado_`) es evadible según C-02, por lo que cualquier usuario del dominio puede subir hasta 8 MB de contenido arbitrario —etiquetado como `image/*` pero sin verificación real del contenido— y obtener una URL pública alojada en el Drive corporativo.

**Riesgos:** publicación involuntaria de material interno (capturas con datos de cliente son habituales en anuncios); uso del Drive corporativo como alojamiento de contenido no autorizado; enlaces que sobreviven al borrado del anuncio.

**Remediación:** mantener el acceso restringido al dominio (`DriveApp.Access.DOMAIN_WITH_LINK`); validar los *magic bytes* del archivo, no solo el MIME declarado; eliminar el archivo de Drive al eliminar el anuncio; auditar el contenido ya publicado en la carpeta `1CPLtO65_xRWgL2IAuOG-n8UFMyMg8R97`.

---

### 🟠 A-06 — Clickjacking: `ALLOWALL` en todas las páginas

**Archivo:** `Code.gs:106`, `Code.gs:130`

```javascript
.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
```

Se aplica **a todas las páginas, incluidas las autenticadas** (`servirPagina_` lo establece tanto en la rama del Portal como en la del sistema de cotizaciones). Desactiva la protección por defecto de Apps Script y permite que cualquier sitio web embeba la aplicación en un `<iframe>` invisible.

**Impacto:** clickjacking sobre acciones sensibles (publicar/eliminar anuncios, enviar correo, descargar PDF), y captura de interacción del usuario mediante superposición.

**Remediación:** usar `XFrameOptionsMode.DEFAULT` salvo que exista un requisito documentado de embebido. Si lo hay, restringirlo al origen concreto que lo necesite.

---

## 5. Hallazgos medios

### 🟡 M-01 — Hash de contraseñas criptográficamente insuficiente

**Archivo:** `Seguridad.gs:321-325`, `Code.gs:176`
**CWE:** CWE-916 (Hash de contraseña con esfuerzo computacional insuficiente), CWE-759 (Hash sin sal por usuario)

```javascript
Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password) + sal);
```

Tres deficiencias acumuladas:

1. **SHA-256 de una sola pasada.** Diseñado para ser rápido; una GPU moderna calcula miles de millones por segundo. Se requiere una función de derivación con factor de trabajo (PBKDF2, bcrypt, scrypt, Argon2).
2. **Sal única global**, compartida por todos los usuarios (`HASH_SALT`). No aporta protección diferenciada: dos usuarios con la misma contraseña tienen el mismo hash, y una sola tabla precomputada sirve para toda la organización. La sal debe ser aleatoria **por usuario**.
3. **La sal está en el código fuente** (ver **C-01**), lo que anula su propósito.

Sumado a una longitud mínima de **6 caracteres** sin requisitos de complejidad (`Code.gs:176`), y a que los hashes residen en una hoja de cálculo (`Registros`, columna `PasswordHash`) accesible a quien tenga el enlace y permisos de la hoja.

**Remediación:** migrar a PBKDF2 con ≥100 000 iteraciones y sal aleatoria por usuario almacenada junto al hash; elevar el mínimo a 12 caracteres; **o**, preferentemente, **eliminar por completo el sistema de contraseñas propio** y apoyarse en la autenticación de Google Workspace (que ya cubre MFA, políticas de contraseña y detección de anomalías). Esta última opción resuelve simultáneamente C-02 y M-01.

---

### 🟡 M-02 — Dependencias de CDN externo sin control de integridad

**Archivos:** ver inventario §2.2(a)
**CWE:** CWE-829 (Inclusión de funcionalidad desde fuente no confiable), CWE-1104 (Componentes de terceros sin mantener)

Seis scripts se cargan desde `cdnjs.cloudflare.com` y `cdn.jsdelivr.net` **sin atributo `integrity` (SRI)**. Uno de ellos, `cdn.jsdelivr.net/npm/chart.js` (`inicio_avanzado.html:7`), **ni siquiera fija la versión**: sirve lo que el registro publique en cada momento.

**Impacto:** un compromiso del CDN, un secuestro de paquete npm, o un ataque a la resolución DNS permite ejecutar JavaScript arbitrario con acceso completo al DOM y a `localStorage` de la aplicación. Dado que `SplitText` y `DrawSVG` se cargan **en `inicioDeSesion.html` y `registro.html`**, el atacante estaría presente en la página donde se teclean las credenciales.

Adicionalmente, la disponibilidad de la aplicación queda condicionada a la de terceros y a la política de la red corporativa.

**Remediación:** replicar la solución ya aplicada a Tailwind — descargar las librerías, incluirlas como archivos del proyecto y servirlas desde el propio Apps Script. Si por alguna razón deben permanecer en CDN: fijar versión exacta **y** añadir `integrity="sha384-…" crossorigin="anonymous"` en todas.

---

### 🟡 M-03 — Activos de marca servidos desde sitios de terceros

**Archivos:** `Correos.gs:180`, `Correos.gs:465`, `cotizacion.html:117`, `cotizado_preview.html:385`, `cotizado_preview.html:450`, `consulta_cotizacion.html:305`, `Index.html:1450-1555`

El logotipo institucional de Liverpool se carga desde `upload.wikimedia.org` **en los correos que se envían a clientes** y en los documentos de cotización. Otros logotipos de socios comerciales se cargan en el Portal desde blogs y bancos de imágenes sin relación contractual (`1000marcas.net`, `vectorseek.com`, `iconlogovector.com`, `funocomercial.com`).

**Riesgos:**
- **Integridad de marca:** el contenido de esos hosts puede cambiar o ser sustituido en cualquier momento; el correo al cliente mostraría la imagen que el tercero decida.
- **Fuga de metadatos:** cada apertura de un correo de cotización notifica a Wikimedia la IP y el momento de lectura del cliente.
- **Disponibilidad:** imágenes rotas en documentos comerciales.
- **Cumplimiento:** uso de activos de marca desde fuentes no autorizadas.

**Remediación:** alojar todos los activos en infraestructura de Liverpool (`assetspwa.liverpool.com.mx`, ya en uso en `correo_cliente.html:308`) o incrustarlos como `data:` URI en los correos.

---

### 🟡 M-04 — Limitación de intentos evadible

**Archivos:** `Seguridad.gs:270-293`, `Code.gs:225-229`

El contador de intentos fallidos se indexa **por correo** y reside en `CacheService`:

- Un ataque de rociado de contraseñas (una contraseña común contra muchos correos) **no se frena**: cada correo tiene su propio contador de 8.
- `CacheService` no garantiza persistencia: las entradas pueden desalojarse antes de los 900 segundos, reiniciando el contador.
- No hay limitación por origen (Apps Script no expone la IP del cliente), ni bloqueo progresivo, ni alerta al usuario o al SOC tras bloqueos repetidos.

**Remediación:** persistir el contador en la hoja o en `PropertiesService`; añadir un contador global de fallos por ventana de tiempo que dispare alerta; notificar por correo al titular tras N bloqueos. La adopción de la autenticación de Workspace (ver M-01) hace innecesario este control.

---

### 🟡 M-05 — SSRF ciego en la verificación de imágenes

**Archivo:** `Correos.gs:770-799`

```javascript
if (preferredUrl && String(preferredUrl).indexOf('http') === 0 && responde200(preferredUrl))
```

`preferredUrl` procede del cliente (campo `imageUrl` de cada producto, propagado desde `sendQuoteByEmail` → `Correos.gs:354`) y se solicita desde el servidor sin validación de destino. La única comprobación es que la cadena empiece por `http`.

**Impacto acotado:** `UrlFetchApp` se ejecuta en la infraestructura de Google, no en la red corporativa de Liverpool, por lo que **no permite alcanzar servicios internos** — el escenario clásico de SSRF no aplica. El impacto real es:
- El código de respuesta es observable indirectamente (la URL se usa o no), permitiendo sondeo ciego de hosts públicos desde infraestructura de Google.
- Uso de la aplicación corporativa como *proxy* para peticiones salientes no atribuibles.
- Confirmación de recepción tipo "píxel de rastreo" hacia servidores controlados por el atacante.
- La URL resultante se **incrusta en el correo enviado al cliente**, permitiendo colocar contenido remoto arbitrario en comunicaciones institucionales.

**Remediación:** validar `preferredUrl` contra una lista blanca de dominios (`*.liverpool.com.mx`, `assets*.liverpool.com.mx`), exigir esquema `https`, y rechazar todo lo demás en lugar de intentar la petición.

---

### 🟡 M-06 — Inyección de atributo HTML en anuncios del Portal

**Archivos:** `Index.html:4932-4938`, `Index.html:4980`
**CWE:** CWE-79 (XSS almacenado)

`safeUrl()` valida correctamente el esquema, pero **no escapa el resultado para contexto de atributo**:

```javascript
function safeUrl(u){ u = String(u||'').trim(); return /^https?:\/\//i.test(u) ? u : ''; }
// …
`<a class="anc-cta" href="${u}" target="_blank" rel="noopener">`      // línea 4936
`<div class="anc-card-img" style="background-image:url('${img}')">`   // línea 4980
```

Una URL como `https://x" onmouseover="…` supera la validación de esquema y **escapa del atributo**. Igualmente, una comilla simple rompe el contexto `url('…')`. El anuncio se almacena en la hoja y se renderiza para **todos los usuarios del Portal** (XSS almacenado, no reflejado).

Requiere rol avanzado para publicar — pero ese rol es obtenible según **C-02**.

**Mitigante:** el resto del renderizado del Portal aplica `esc()` de forma consistente y correcta; la higiene general de escapado en el proyecto es buena (`app_core.html:611`, `Seguridad.gs:302`). Éste es un punto ciego puntual, no un patrón sistémico.

**Remediación:** aplicar `esc()` también a la salida de `safeUrl()` antes de interpolarla en cualquier atributo. Revisar el mismo patrón en `anuncios.html:337, 387-389`, donde la vista previa construye HTML sin escapar a partir de los campos del formulario.

---

### 🟡 M-07 — Divulgación de información técnica en errores y registros

**Archivos:** `Code.gs:89`, `Code.gs:96`, `Code.gs:477`, y ~40 bloques `catch` en todos los `.gs`

```javascript
// Code.gs:89 — mensaje de error mostrado al usuario final
'Detalle técnico: ' + secEscapeHtml_(error.message)

// Code.gs:96 — se registran TODOS los parámetros de la petición
Logger.log("Parámetros doGet: " + JSON.stringify(e && e.parameter));

// Code.gs:477 — se registra la cotización COMPLETA, con PII del cliente
Logger.log("saveQuoteAndGoToPreview - Datos recibidos: " + JSON.stringify(quoteDataFromClient));
```

Los mensajes devueltos al cliente (`error.toString()`, presente en la mayoría de los `catch`) revelan nombres de hojas, columnas, IDs de archivo y estructura interna, información útil para un atacante en fase de reconocimiento.

Más relevante: **`Logger.log` escribe PII de clientes en Stackdriver** (`exceptionLogging: "STACKDRIVER"`), un almacén con política de retención, control de acceso y jurisdicción distintos a los de la hoja de cálculo, y probablemente fuera del inventario de tratamiento de datos personales de la organización.

**Remediación:** devolver mensajes genéricos al usuario con un identificador de correlación, y registrar el detalle solo en el servidor. Eliminar el volcado de objetos con PII de los registros o enmascarar los campos sensibles. Revisar que la retención de Cloud Logging cumpla la política de datos personales aplicable.

---

## 6. Hallazgos bajos y observaciones de higiene

| ID | Hallazgo | Archivo | Nota |
|---|---|---|---|
| **B-01** | Sesión en `localStorage` sin caducidad ni invalidación en servidor. Persiste tras cerrar el navegador; accesible a cualquier script del origen. No existe token de sesión emitido por el servidor. | `app_core.html:51-90` | Se resuelve con **C-02** |
| **B-02** | El control de acceso a pantallas es exclusivamente de cliente: `requireSession()` redirige, pero los datos siguen siendo obtenibles vía `google.script.run`. | `app_core.html:598-603` | Consecuencia de **A-01** |
| **B-03** | Identificadores de infraestructura en código: `PORTAL_SHEET_ID`, `CCL_TEMPLATE_SHEET_ID`, `PORTAL_ANUNCIOS_FOLDER_ID`, `PORTAL_CALENDAR_ID`. No son secretos, pero cartografían el patrimonio de datos y facilitan intentos de acceso dirigido. | `Portal.gs:21,269,453`, `Formatos.gs:25` | Migrar a Script Properties junto con **C-01** |
| **B-04** | `include(filename)` es una función global y por tanto invocable desde el cliente; devuelve el contenido de cualquier archivo HTML del proyecto. | `Code.gs:138` | Impacto mínimo (es código de cliente), pero facilita el reconocimiento. Renombrar a `include_` o validar contra lista blanca |
| **B-05** | `reportBrokenLink` usa una clave de límite compartida (`'reporte_anonimo'`) cuando no se resuelve el usuario, permitiendo agotar la cuota global de otros. | `Portal.gs:750` | Menor |
| **B-06** | Metadatos en el código: nombre y alias del autor, y mención de las IA generadoras. La versión declarada es "0.9 Pruebas de control" para un sistema que ya trata PII real de clientes. | `Code.gs:3-5` | Formalizar el paso a producción con aceptación de riesgo firmada |

---

## 7. Controles correctamente implementados

En interés de una evaluación equilibrada, se hace constar que el proyecto presenta un nivel de higiene de seguridad **superior al habitual** en desarrollos de Apps Script:

| Control | Ubicación | Valoración |
|---|---|---|
| Comparación de hashes en **tiempo constante** | `Seguridad.gs:312-318` | Correcta. Previene fuga por análisis temporal |
| Escapado HTML **consistente** en cliente y servidor | `app_core.html:611`, `Seguridad.gs:302`, `Index.html:6191` | Aplicado de forma sistemática, con el punto ciego de M-06 |
| Escapado específico para contexto JavaScript | `app_core.html:621-628` | Distingue correctamente los contextos de escapado |
| Limitación de intentos de inicio de sesión | `Code.gs:225-229` | Presente (mejorable, ver M-04) |
| Mensajes de error de login **genéricos** | `Code.gs:220, 251, 272` | No revelan si el correo existe. Correcto |
| Validación de destinatarios y adjuntos | `CorreoCliente.gs:25-36, 80-90` | Formato, cantidad y tamaño acotados |
| `LockService` para condiciones de carrera en folios | `Code.gs:509-512` | Correcto |
| Validación de esquema en URLs | `Index.html:4932` | Bloquea `javascript:` (escapado pendiente, M-06) |
| Normalización de correos | `Seguridad.gs:105-107` | Elimina inconsistencias de comparación |
| Capa de identidad **centralizada** | `Seguridad.gs` completo | Arquitectura correcta; el defecto está en la fuente del dato, no en el diseño |
| Infraestructura de gestión de secretos **ya construida** | `Seguridad.gs:45-75`, `Admin.gs:164-170` | Implementada y con verificación automática; solo falta ejecutarla |
| Retirada del CDN de Tailwind | `app_tailwind.html:6-20` | Excelente precedente; replicar con GSAP y Chart.js |
| Documentación interna del riesgo | `Seguridad.gs:32-34` | El equipo identificó y documentó la debilidad de C-02 por sí mismo |

---

## 8. Plan de remediación priorizado

### Fase 1 — Inmediata (antes de cualquier uso con datos reales)

| # | Acción | Hallazgo | Esfuerzo |
|---|---|---|---|
| 1 | **Rotar el webhook de Google Chat** (borrar y recrear) | C-01 | 15 min |
| 2 | Ejecutar `secGuardarConfiguracion()` y **vaciar** las constantes de `Code.gs:29-30` | C-01 | 30 min |
| 3 | **Cambiar a `secFijarModoAuth('estricto')`** — cierra la suplantación | C-02 | 1 h + pruebas |
| 4 | Añadir gate de identidad a `getQuoteDetails`, `downloadQuotePdf`, `openQuoteInSheets`, `getDashboardStats` | A-01, A-02 | 2 h |
| 5 | Cambiar `ANYONE_WITH_LINK` → `DOMAIN_WITH_LINK` y auditar la carpeta de anuncios | A-05 | 30 min |

### Fase 2 — Corto plazo (2–4 semanas)

| # | Acción | Hallazgo | Esfuerzo |
|---|---|---|---|
| 6 | Renderizar el HTML de los correos **en el servidor** desde plantilla | C-03 | 1–2 sem |
| 7 | Rotar `HASH_SALT` y migrar a PBKDF2 con sal por usuario (o eliminar contraseñas propias en favor de Workspace) | C-01, M-01 | 1 sem |
| 8 | Descargar GSAP y Chart.js al proyecto, o fijar versión + SRI | M-02 | 4 h |
| 9 | Alojar los activos de marca en infraestructura de Liverpool | M-03 | 4 h |
| 10 | Reducir alcances OAuth y desplegar bajo cuenta de servicio dedicada | A-04 | 1 sem |
| 11 | Corregir el escapado de atributos en `safeUrl`/`ctaHtml` | M-06 | 1 h |
| 12 | `XFrameOptionsMode.DEFAULT` en las páginas autenticadas | A-06 | 30 min |

### Fase 3 — Medio plazo (1–3 meses)

| # | Acción | Hallazgo |
|---|---|---|
| 13 | Lista blanca de dominios en `getVerifiedImageUrl` | M-05 |
| 14 | Acotar la búsqueda global (longitud mínima, límite de resultados, registro de auditoría) | A-03 |
| 15 | Depurar PII de `Logger.log` y unificar el manejo de errores | M-07 |
| 16 | Migrar identificadores de infraestructura a Script Properties | B-03 |
| 17 | Endurecer la limitación de intentos y añadir alertas al SOC | M-04 |
| 18 | Registro de auditoría con la identidad **verificada** y trazabilidad de envíos | C-02, C-03 |

---

## 9. Conclusión

El proyecto está **bien construido desde la perspectiva de ingeniería**: la arquitectura de seguridad está centralizada y correctamente diseñada, el escapado es consistente, existe comparación en tiempo constante, limitación de intentos, validación de entradas y control de concurrencia. Se aprecia intención de seguridad genuina, y el equipo llegó a documentar por escrito la debilidad principal antes que esta revisión.

El problema es de **ejecución sobre un supuesto equivocado**: el sistema construyó puertas sólidas y después decidió aceptar como llave un dato que el visitante escribe él mismo. La consecuencia es que ninguno de los controles de autorización —todos ellos correctos en su lógica— resiste una llamada directa a `google.script.run`.

Respecto a la preocupación concreta planteada:

- **¿Servicios externos?** Sí, pero **acotados y de bajo riesgo intrínseco**: CDNs de librerías de animación y gráficas, tipografías de Google, e imágenes alojadas en sitios de terceros. Ninguno recibe datos de cliente. Todos son sustituibles con esfuerzo bajo, y el equipo ya demostró saber hacerlo con Tailwind.
- **¿Filtración de información?** **No hay exfiltración deliberada ni encubierta.** Existe una fuga de metadatos hacia terceros (IP, `Referer`, momento de uso) por los recursos externos, y —esto es lo relevante— **una exposición interna severa**: cualquier empleado del dominio puede leer la base completa de cotizaciones con PII de clientes y enviar correo desde el alias corporativo.

La corrección con mayor relación impacto/esfuerzo de todo el informe es de **una línea**: ejecutar `secFijarModoAuth('estricto')`. El modo ya está implementado, probado y documentado en `Seguridad.gs`. Por sí solo neutraliza C-02 y reduce sustancialmente C-03, A-01, A-03 y A-05.

---

*Informe elaborado mediante análisis estático del código fuente. No se ejecutó ninguna prueba dinámica, ni se accedió a los sistemas en producción, ni se verificaron credenciales, ni se invocó ninguna de las funciones descritas. Las cadenas de explotación son análisis conceptual sobre el código. Se recomienda complementar con una prueba de intrusión autorizada sobre el despliegue real una vez completada la Fase 1.*
