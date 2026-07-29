# Arquitectura técnica

Cómo está armado el Sistema Integral Ventel y por qué está armado así. Para quien va a mantener,
extender o auditar el código.

La estructura sigue la plantilla **arc42**, recortada a lo que este proyecto realmente necesita.
Las decisiones con historia viven en [`decisiones/`](../decisiones/); aquí se resume el resultado.

---

## 1. Objetivos y restricciones

### Qué tiene que lograr

| Objetivo de calidad | Cómo se traduce en el código |
|---|---|
| **Que cargue rápido** | Caché en dos capas. Ninguna pantalla relee la hoja completa si no cambió nada. |
| **Que nunca se rompa en la cara del asesor** | `doGet` atrapa cualquier fallo y sirve una pantalla de error legible. Si GSAP no carga, la app se ve sin animar. Si la caché falla, se lee de la hoja. |
| **Que un no técnico pueda operarlo** | El contenido del Portal vive en hojas de cálculo. Los anuncios se publican desde una pantalla. Nadie toca código para cambiar contenido. |
| **Que se pueda mantener con una sola persona** | Comentarios en español, una capa por responsabilidad, cero abstracciones especulativas. |
| **Que el dato no salga del dominio** | Sin analítica, sin telemetría, sin APIs de terceros con datos de cliente. |

### Restricciones que vienen dadas

- Google Apps Script (V8). No hay proceso de build, ni `npm`, ni módulos: **todos los `.gs`
  comparten un solo ámbito global**.
- Google Sheets como base de datos. Sin transacciones, sin índices, sin tipos.
- Cuotas de Apps Script: tiempo de ejecución, envíos de correo, llamadas a servicios.
- `CacheService`: ~100 KB por valor, 6 h de expiración máxima.
- El HTML se sirve dentro de un iframe con sandbox. Sin cookies propias, sin sesión de servidor.
- Un solo desarrollador.

---

## 2. Contexto

```
                    ┌──────────────────────────────┐
   Asesor Ventel ──▶│                              │
   (navegador,      │   Sistema Integral Ventel    │
    dominio         │   Google Apps Script (V8)    │
    Liverpool)      │   Web app · executeAs USER_  │
   Supervisión ────▶│   DEPLOYING · access DOMAIN  │
                    └───────────┬──────────────────┘
                                │
      ┌──────────────┬──────────┼───────────┬──────────────┐
      ▼              ▼          ▼           ▼              ▼
 ┌──────────┐  ┌──────────┐ ┌────────┐ ┌─────────┐  ┌────────────┐
 │ BD Cotiz.│  │ Hoja del │ │ Gmail  │ │  Drive  │  │  Calendar  │
 │ (ligada) │  │  Portal  │ │ (alias)│ │ (PDF/   │  │ (promos    │
 │          │  │ (por ID) │ │        │ │ imágenes)│  │  90 días)  │
 └──────────┘  └──────────┘ └────────┘ └─────────┘  └────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │ Google Chat   │
                        │ (webhook de   │
                        │  nuevo folio) │
                        └───────────────┘
```

### Interfaces externas

| Con quién | Para qué | Qué sale |
|---|---|---|
| Google Sheets (BD ligada) | Usuarios, cotizaciones, detalle, métricas, bitácora | Todo, dentro del dominio |
| Google Sheets (Portal, por ID) | Contenido del Portal, promociones, anuncios, reportes | Todo, dentro del dominio |
| Gmail | Envío desde el alias institucional | Cotizaciones y correos de plantilla |
| Drive | PDF generados, hojas CCL, imágenes de anuncios | Documentos del área |
| Google Calendar | Calendario comercial a 90 días | Solo lectura |
| Google Chat (webhook) | Aviso de folio nuevo | **Solo el folio.** Sin PII |
| `ss*.liverpool.com.mx` | Verificar imagen de producto por SKU | El SKU. Infraestructura propia |
| CDN públicos (cdnjs, jsdelivr, Google Fonts) | GSAP, Chart.js, tipografías | Metadatos de conexión del navegador |

El último renglón es la única fuga de perímetro real. Está documentada en el
[informe de seguridad](../../INFORME-SEGURIDAD.md).

---

## 3. Estrategia de solución

Cinco decisiones que explican casi todo el código:

1. **Un solo proyecto de Apps Script para todo.** Portal, cotizaciones y correos comparten sesión,
   diseño y despliegue. Ver
   [ADR-0003](../decisiones/ADR-0003-HOMOLOGAR-TRES-HERRAMIENTAS-EN-UN-SOLO-SISTEMA.md).
2. **Enrutador por parámetro.** `doGet` lee `?page=` y sirve la plantilla que toca. Sin marco de
   trabajo.
3. **Una capa por responsabilidad.** Identidad en `Seguridad.gs`, caché en `Cache.gs`, contenido del
   Portal en `Portal.gs`. Nada de lógica duplicada entre archivos.
4. **Todo se arma por nombre de columna, nunca por posición.** Insertar o mover una columna en una
   hoja no debe desalinear nada en silencio.
5. **La caché se invalida por escritura, no por tiempo.** Ver
   [ADR-0005](../decisiones/ADR-0005-CACHE-INVALIDADA-POR-ESCRITURA.md).

---

## 4. Vista de bloques

### 4.1 Backend — archivos `.gs`

| Archivo | Responsabilidad | No hace |
|---|---|---|
| `Code.gs` | Enrutador (`doGet`), registro y login, CRUD de cotizaciones, folios, estadísticas del dashboard, webhook. | No decide identidad: la delega. |
| `Seguridad.gs` | **Capa única de identidad y permisos.** Modos de autenticación, normalización de correo, hash, freno de fuerza bruta, escape de HTML, configuración sensible. | No lee cotizaciones. |
| `Cache.gs` | **Capa única de caché** de la BD de cotizaciones. Generación, troceado, TTL por tipo de dato. | Nunca cachea errores ni escrituras. |
| `Portal.gs` | Lectura del contenido del Portal y de promociones. Escritura de anuncios y reportes de enlace roto. | No toca la BD de cotizaciones. |
| `Correos.gs` | Armado del HTML de la cotización, envío con PDF adjunto, verificación de imagen por SKU. | No valida sesión: la delega. |
| `CorreoCliente.gs` | Correos de plantilla al cliente. Validación de destinatarios y bitácora. | No acepta la plantilla de cotización. |
| `Formatos.gs` | Catálogo de formatos, generación de PDF (HTML y CCL), habilitar/deshabilitar. | — |
| `Metricas.gs` | Registro unificado de todos los envíos y su resumen. | Nunca tumba un envío si falla el registro. |
| `Admin.gs` | Diagnóstico: `revisionMaestra()`, verificación de versión del código, salud para el panel. | — |

**Ojo con el ámbito global.** En Apps Script todos los `.gs` comparten espacio de nombres. Por eso
cada capa usa prefijo: `sec*` en Seguridad, `cot*` en Caché, `portal*` en Portal, `met*` en
Métricas, `cc*` en Correo a cliente, `ccl*` en el formato CCL. **No rompas esta convención**: es lo
único que evita colisiones.

### 4.2 Frontend — archivos `.html`

Dos familias.

**Pantallas** (una por vista, cada una con su `<html>` completo):

| Archivo | Ruta | Sesión |
|---|---|---|
| `Index.html` | `?page=portal` *(predeterminada)* | No |
| `Promociones.html` | `?page=promociones` | No |
| `inicioDeSesion.html` | `?page=login` | — |
| `registro.html` | `?page=registro` | — |
| `inicio.html` | `?page=dashboard` | Sí |
| `inicio_avanzado.html` | `?page=inicio_avanzado` | Sí, rol avanzado |
| `cotizacion.html` | `?page=cotizacion` | Sí |
| `cotizado_preview.html` | `?page=cotizado_preview` | Sí |
| `consulta_cotizacion.html` | `?page=consulta_cotizacion` | Sí |
| `correoventel.html` | `?page=correoventel` | Sí |
| `correo_cliente.html` | `?page=correo_cliente` | Sí |
| `anuncios.html` | `?page=anuncios` | Sí, rol avanzado |

Cualquier `?page=` desconocido cae al Portal.

**Parciales** (se insertan con `<?!= include('nombre'); ?>`):

| Archivo | Qué aporta |
|---|---|
| `app_core.html` | `AppUrl`, `AppSession`, `AppCache`, `AppRun`, `requireSession()`. El núcleo. |
| `app_theme.html` | Tokens, tipografía, 3 temas, componentes `v-*`. El sistema de diseño. |
| `app_shell.html` | Barra lateral y topbar. Se monta con `AppShell.mount({...})`. |
| `app_icons.html` | Los SVG de la interfaz. `Icons.render()` / `Icons.svg()`. |
| `app_motion.html` | GSAP + helpers de animación. Degrada solo si GSAP no carga. |
| `app_auth.html` | Escenario visual de login y registro. |
| `app_tailwind.html` | Tailwind **compilado**. Ver [ADR-0006](../decisiones/ADR-0006-TAILWIND-COMPILADO-EN-LUGAR-DE-CDN.md). |
| `app_support.html` | Modal de soporte. Sustituye los `mailto`. |
| `ViewPrefsPartial.html` | Preferencias de vista. Va lo más arriba posible del `<head>`. |
| `LoaderPartial.html` | Loader de marca con morph del isotipo. |

**Orden de inclusión en el `<head>`** — no es arbitrario, define qué regla de CSS gana:

```
1. ViewPrefsPartial   ← antes de pintar, para que no haya parpadeo de tema
2. app_theme          ← tokens y sistema de diseño
3. <style> propio de la pantalla
4. app_tailwind       ← al final, igual que la hoja que inyectaba el CDN
```

Y al final del `<body>`: `app_core` → `app_icons` → `app_motion` → `app_shell` / `app_support`.

`Index.html` y `Promociones.html` **no incluyen** `app_theme`: duplican los tokens a mano. Si
cambias de familia tipográfica, cámbiala en los tres lados.

---

## 5. Vista en ejecución

### 5.1 Abrir una pantalla

```
Navegador → doGet(e)
              ├─ ?page= no está en PAGES  → Portal (Index.html)
              └─ ?page= sí está           → PAGES[page]
                    ├─ inyecta baseUrl, folio, action, format, q, tpl
                    ├─ evalúa la plantilla (resuelve los include)
                    └─ devuelve HTML  ·  cualquier fallo → pantalla de error legible
```

Los parámetros se inyectan al renderizar y no se piden por red después: el iframe del sandbox no
siempre conserva el query string, y pedirlos por red dejaba la navegación colgada cuando fallaba.

### 5.2 Guardar una cotización

```
cotizacion.html
   → saveQuoteAndGoToPreview(datos)
        → genera folio LVP-AAMMDD-NNNN (consecutivo del día)
        → saveQuoteDataToSheets(...)
             ├─ arma la fila por NOMBRE de columna
             ├─ si ya existía: conserva columnas ajenas y preserva FÓRMULAS
             ├─ auto-crea 'Formato' e 'ImagenUrl' si faltan
             ├─ reemplaza el detalle del folio en DetalleCotizaciones
             ├─ si es nueva → sendWebhookNotification(folio)
             └─ cotInvalidarCache_()   ← AL FINAL, a propósito
   → redirige a cotizado_preview
```

`cotInvalidarCache_()` va al final porque si algo de arriba falla, la caché vigente sigue siendo la
verdad.

### 5.3 Enviar una cotización

```
correoventel.html → sendQuoteByEmail(emailData)
   1. metVerificarAsesor_(asesor)        ← gate de sesión
   2. valida destinatarios (máx. 3)      ← ANTES de generar el PDF
   3. generateQuotePdfBlob(folio, formato)
        ├─ 'actual'        → HTML → PDF
        └─ 'ccl_liverpool' → copia plantilla → llena → exporta a PDF
   4. getQuoteDetails(folio) → arma el HTML del correo
   5. getVerifiedImageUrl(sku, url) por producto
   6. GmailApp: alias si existe, si no la cuenta propia · replyTo = asesor
   7. metRegistrarEnvio_(...)            ← nunca lanza
```

El orden importa: validar antes de generar evita que el asesor espere el PDF completo para
enterarse de que el correo estaba mal escrito.

### 5.4 Leer con caché

```
getQuotesForUser(email, término, forzar)
   → cotCacheado_('listaAsesor:'+hash, TTL, productor, aceptar, forzar)
        ├─ clave = prefijo + generación actual + nombre
        ├─ ¿hay valor?  → devuélvelo
        └─ no hay       → productor() → si aceptar() → guarda troceado
```

La **generación** es un contador en Script Properties que forma parte de todas las claves. Cada
escritura lo incrementa, así que las claves viejas dejan de existir. Es lo único que evita el
clásico *"guardé y sigue saliendo lo anterior"*.

TTL por tipo de dato:

| Dato | TTL | Por qué |
|---|---|---|
| `listaAsesor` | 180 s | El asesor quiere ver lo suyo recién guardado. |
| `busqueda` | 90 s | Barrido completo + tolerancia a errores: lo más caro. |
| `supervision` | 240 s | Mismo dato para todos los avanzados. |
| `metricas` | 600 s | Agregado de 30 días, tolera estar un rato viejo. |
| `remitente` | 21600 s | Los alias de Gmail casi nunca cambian. |

El Portal tiene su propia caché, más simple: 10 minutos por llave, sin generación.

---

## 6. Conceptos transversales

### 6.1 Identidad

**La sesión que manda es la del portal**, no la cuenta de Google del navegador. Un asesor puede
tener abierta otra cuenta de Google y aun así trabajar con su usuario del portal.

La identidad se guarda en `localStorage` con prefijo `ventel-` (las web apps de Apps Script se
sirven desde un origen compartido: una clave genérica chocaría con otro script) y se valida contra
la hoja `Registros`.

Modos, en la propiedad de script `AUTH_MODO`:

| Modo | Quién manda |
|---|---|
| `portal` *(predeterminado)* | El correo del portal. Debe estar en `Registros`. Sin correo declarado, cae a la cuenta de Google. |
| `auto` | La cuenta de Google si está registrada; si no, el correo del portal. |
| `estricto` | Solo la cuenta de Google, y debe estar registrada. |
| `legado` | Como `portal`, sin respaldo. Compatibilidad. |

**Limitación conocida y deliberada:** en modo `portal` el correo lo declara el navegador. El
servidor comprueba que exista en `Registros`, pero **no puede probar que sea de quien dice ser**.
Es el hallazgo C-02 del informe de seguridad y es bloqueante para producción. Ver
[ADR-0004](../decisiones/ADR-0004-CAPA-UNICA-DE-IDENTIDAD.md) y
[Seguridad](../operacion/SEGURIDAD.md).

Todos los controles de rol pasan por un solo lugar:

```
isAdvancedUser(email)     ─┐
portalGateAvanzado_(email) ├─▶ secIdentidadAvanzada_(email) ─▶ columna 'Avanzado'
metVerificarAsesor_(email) ┘                                    en Registros
```

Antes cada archivo lo resolvía distinto —uno comparaba `'Si'` exacto, otro en minúsculas—. Hoy hay
una sola definición y tolera `Si`, `si`, `SI`, `Sí`.

### 6.2 Configuración y secretos

`secConfig_(clave, respaldo)` lee la propiedad del script y, si no existe, usa la constante del
archivo. Así nada se rompe al desplegar y la migración se puede hacer sin downtime.

`secGuardarConfiguracion()` mueve los valores a Script Properties. **Se ejecuta una vez, a mano, y
después se vacían las constantes.**

Propiedades del proyecto:

| Propiedad | Para qué |
|---|---|
| `HASH_SALT` | Sal del hash de contraseñas. |
| `WEBHOOK_URL` | Webhook de Google Chat. |
| `PORTAL_SHEET_ID` | Hoja del Portal. |
| `PORTAL_CALENDAR_ID` | Calendario de promociones. |
| `PORTAL_ANUNCIOS_FOLDER_ID` | Carpeta de imágenes de anuncios. |
| `CCL_TEMPLATE_SHEET_ID` | Plantilla del formato CCL. |
| `AUTH_MODO` | Modo de autenticación. |
| `formatos_habilitados` | JSON con el estado de cada formato. |
| `COT_CACHE_GEN` | Generación de la caché. La escribe el sistema. |

> **Estado real:** la migración a propiedades **todavía no se ha ejecutado**. Los valores siguen en
> el código. Es el hallazgo C-01. Ver [Configuración](GUIA-DE-DESPLIEGUE.md).

### 6.3 Manejo de errores

Tres reglas, aplicadas en todo el código:

1. **Las funciones expuestas al cliente no lanzan.** Devuelven `{success:false, message}` o
   `{status:'error', error}`.
2. **Lo accesorio nunca tumba lo principal.** Si falla el registro de métricas, el correo ya salió y
   solo se anota en el `Logger`. Si falla la caché, se lee de la hoja.
3. **El asesor nunca ve la pantalla amarilla de Apps Script.** `doGet` atrapa todo y sirve una
   pantalla legible con la hora y el detalle técnico.

### 6.4 Escape de HTML

Todo lo que viene del usuario y se inserta en HTML —correos, PDF, pantalla de error— pasa por
`secEscapeHtml_()`. Sin excepción.

### 6.5 Degradación

El sistema se cae hacia abajo, nunca hacia el vacío:

| Si falla | Qué pasa |
|---|---|
| GSAP no carga | Todo se muestra sin animar. |
| `prefers-reduced-motion` activo | Igual: sin animación. |
| `CacheService` falla | Se lee de la hoja. Más lento, nada más. |
| El alias de Gmail no existe | El correo sale desde la cuenta propia. |
| La carpeta de anuncios no abre por ID | Se busca por nombre; si no existe, se crea. |
| Falta la columna `Formato` o `ImagenUrl` | Se crea sola. |
| El calendario no responde | El Monitor se muestra sin eventos. |

### 6.6 Límites de abuso

| Acción | Tope |
|---|---|
| Intentos de login por correo | 8 en 15 min |
| Reportes de enlace roto por usuario | 20 por hora |
| Destinatarios en *Para* | 3 |
| Largo del asunto | 250 caracteres |

Los contadores viven en la caché del script: se limpian solos y no ensucian las hojas.

---

## 7. Despliegue

Un solo proyecto de Apps Script, ligado a la BD de Cotizaciones, publicado como web app:

```json
{
  "timeZone": "America/Mexico_City",
  "runtimeVersion": "V8",
  "exceptionLogging": "STACKDRIVER",
  "webapp": { "executeAs": "USER_DEPLOYING", "access": "DOMAIN" }
}
```

**`executeAs: USER_DEPLOYING`** — el script corre con los permisos de quien despliega. Por eso el
alias de Gmail tiene que estar en **esa** cuenta, y por eso esa cuenta necesita acceso a las dos
hojas y a la carpeta de Drive.

**`access: DOMAIN`** — cualquier cuenta `@liverpool.com.mx` puede abrir la web app. Combinado con
que en Apps Script **toda función global `.gs` es invocable desde `google.script.run`**, esto
significa que las funciones globales son un API abierto al dominio. Es la mitad del hallazgo C-02.

Permisos que pide (`oauthScopes`): Sheets, Drive, peticiones externas, Calendar (lectura), envío de
correo, correo del usuario y Gmail completo.

Paso a paso en [Guía de despliegue](GUIA-DE-DESPLIEGUE.md).

---

## 8. Riesgos y deuda técnica

| # | Riesgo | Impacto | Qué hacer |
|---|---|---|---|
| 1 | **La identidad la declara el cliente** (C-02) | Suplantación y elevación de privilegio | Bloqueante. Ver [Seguridad](../operacion/SEGURIDAD.md). |
| 2 | **Secretos en el código** (C-01) | Webhook y sal expuestos | Rotar y ejecutar `secGuardarConfiguracion()`. |
| 3 | **Scripts de CDN sin SRI**, incluso en login | Un CDN comprometido ejecuta JS donde se teclea la contraseña | Servir GSAP local, como ya se hizo con Tailwind. |
| 4 | **Chart.js sin versión fijada** | Un cambio ajeno rompe el panel | Fijar versión y servir local. |
| 5 | **Google Sheets no es transaccional** | Dos escrituras simultáneas al mismo folio pueden pisarse | Aceptado en el volumen actual. Vigilar. |
| 6 | **Lecturas de hoja completa** | El costo crece con el histórico | La caché lo amortigua. Archivar por año cuando pese. |
| 7 | **Logotipo institucional servido desde Wikipedia** en correos a cliente | Dependencia externa en material que ve el cliente | Cambiar a `assets.liverpool.com.mx`. |
| 8 | **Sin pruebas automatizadas** | Las regresiones se detectan en uso | `revisionMaestra()` cubre lo estructural. |
| 9 | **Un solo desarrollador** | Riesgo de continuidad | Esta documentación es parte de la mitigación. |
| 10 | **Tokens tipográficos duplicados** en 3 archivos | Se desincronizan | Consolidar cuando se toque el tema. |

El detalle de los hallazgos de seguridad —22 en total— está en el
[informe de seguridad](../../INFORME-SEGURIDAD.md).

---

## 9. Glosario

Ver [Glosario](../proyecto/GLOSARIO.md).
