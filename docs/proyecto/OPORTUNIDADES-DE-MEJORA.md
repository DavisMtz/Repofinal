# Oportunidades de mejora

Revisión completa del Sistema Integral Ventel v0.9 con foco en **experiencia de usuario**: flujos,
interacciones, algoritmos y funciones que faltan. Léelo si vas a priorizar el trabajo de las
próximas versiones.

Cada recomendación lleva **dónde se toca**, **qué cuesta** y **qué gana el asesor**. Las que ya
están cubiertas por otro documento se señalan en lugar de repetirse: los hallazgos de seguridad
viven en [INFORME-SEGURIDAD.md](../../INFORME-SEGURIDAD.md) y las métricas en
[Catálogo de métricas](CATALOGO-DE-METRICAS.md).

| Dato | Valor |
|---|---|
| Versión revisada | 0.9 — *Pruebas de control* |
| Alcance | 9 archivos `.gs`, 23 `.html`, toda la documentación |
| Fecha de la revisión | 30 de julio de 2026 |

---

## 0. El hallazgo que ordena a todos los demás

**El Portal público está mucho más cuidado que la aplicación con sesión.**

`Index.html` tiene buscador global con tolerancia a errores, atajos de teclado (`/`, `Ctrl+K`,
`g`+tecla), búsquedas recientes, colecciones de accesos favoritos, historial de copiados,
coachmark de bienvenida y estados vacíos escritos a mano. Es una pieza de producto madura.

`cotizacion.html` —la pantalla donde el asesor pasa más tiempo y donde un error cuesta dinero— no
tiene ni autoguardado, ni atajos, ni autocompletado, ni validación en vivo.

La brecha no es de talento: el Portal se trabajó después y con más iteraciones. **La mayor parte de
lo que sigue es llevar a la app con sesión el nivel que el Portal ya alcanzó.** En varios casos el
código ya existe y solo hay que reutilizarlo.

---

## 1. Flujo de cotización

Es el flujo crítico. Nueve recomendaciones, ordenadas por relación valor/costo.

### 1.1 Autoguardado del borrador · **prioridad máxima**

**Hoy:** el formulario vive únicamente en el DOM. `stashPreviewData()` guarda en `AppCache`, pero
**solo después** de que el servidor confirmó el guardado (`cotizacion.html:337`). Si el navegador se
recarga, se cierra la pestaña por error, se agota la batería o Apps Script devuelve un error de red
a la mitad, **se pierde toda la captura**: cliente, productos, precios y observaciones.

Una cotización de ocho productos son varios minutos de tecleo. Perderla es la peor experiencia que
el sistema puede dar hoy, y no está registrada en ningún lado porque nadie la reporta: el asesor
simplemente vuelve a capturar y se resigna.

**Qué hacer:** `AppCache` ya resuelve el 90 % del problema —tiene TTL, esquema versionado, respaldo
en memoria y purga por cuota—. Falta conectarlo:

```js
// cotizacion.html — junto a stashPreviewData()
const DRAFT_KEY = 'borrador-cotizacion';
const DRAFT_TTL = 12 * 60 * 60 * 1000;   // 12 h: cubre un turno completo

/** Vuelca el formulario al almacén local. Nunca lanza: un borrador no puede romper la captura. */
function guardarBorrador() {
  try {
    if (!AppSession.isLoggedIn()) return;
    AppCache.set(DRAFT_KEY, {
      folio: currentQuoteFolioInput.value || '',
      asesor: AppSession.userEmail,          // no se recupera un borrador de otra persona
      campos: leerCamposDelFormulario(),     // el mismo objeto que arma requestReviewButton
      guardadoEn: Date.now()
    }, { ttl: DRAFT_TTL });
  } catch (e) {}
}

// Se dispara con rebote: teclear no debe escribir en disco en cada tecla.
let debounceBorrador;
document.addEventListener('input', function () {
  clearTimeout(debounceBorrador);
  debounceBorrador = setTimeout(guardarBorrador, 1200);
}, true);
```

Al cargar la pantalla, si hay borrador del mismo asesor y no se viene de `action=edit`, se ofrece
una barra —no un modal, que interrumpe—: *«Tienes una cotización sin terminar de hace 20 minutos.
[Recuperar] [Descartar]»*. Se borra al guardar con éxito y en `AppSession.clear()`, junto con las
claves `pendingQuoteData*` que ya se limpian ahí (`app_core.html:88`).

**Ojo con la privacidad:** el borrador trae nombre, correo y teléfono del cliente. Debe entrar en la
lista de limpieza del cierre de sesión desde el primer día, igual que los borradores de vista previa.

**Costo:** ~60 líneas, un solo archivo. **Gana:** deja de existir la pérdida de trabajo.

---

### 1.2 Revisor de cotización (avisos suaves antes de guardar)

**Hoy:** la validación es de tres reglas, secuencial y de una en una — nombre de cliente, al menos
un producto, al menos un SKU o descripción (`cotizacion.html:709-733`). El asesor corrige, vuelve a
pulsar, descubre el segundo error, corrige, vuelve a pulsar.

Y no hay ninguna validación **comercial**. Nada avisa de:

| Situación | Qué pasa hoy | Qué debería pasar |
|---|---|---|
| Dos filas con el mismo SKU | Se guarda duplicado | Aviso: «SKU 1234567 está dos veces, ¿lo juntas?» |
| Cantidad en 0 | Línea que vale $0 en el PDF del cliente | Aviso amarillo |
| Precio unitario en 0 con descripción llena | Cotización en $0 al cliente | Aviso amarillo |
| Descuento efectivo > 50 % | Sale tal cual | Aviso: «Descuento de 68 %, ¿es correcto?» |
| Total general en $0 | Se envía | Bloqueo |
| Correo de cliente mal escrito | Se descubre en la pantalla de envío, minutos después | Aviso al capturar |

**Qué hacer:** un `revisarCotizacion()` puro en el cliente que devuelva
`[{nivel:'error'|'aviso', campo, mensaje}]` y se pinte como lista de avisos con ancla al campo
—clic en el aviso, foco en la celda—. Los `error` bloquean; los `aviso` solo informan y se pueden
ignorar con un clic. Es la diferencia entre un sistema que regaña y uno que cuida.

La regla de negocio ya está escrita y probada en `calculateRow()`: el revisor solo la lee.

**Costo:** ~120 líneas de cliente, cero servidor. **Gana:** menos cotizaciones mal capturadas
llegando al cliente, que es el costo real que el
[documento de visión](VISION-Y-ALCANCE.md#1-el-problema) identifica como el más caro.

---

### 1.3 Autocompletado de SKU con el histórico propio

**Hoy:** el asesor teclea SKU, descripción y precio a mano, producto por producto, incluso cuando es
un producto que el área ya cotizó cien veces. El importador de la extensión de Chrome cubre el caso
de la Bolsa de Liverpool; la captura manual no tiene ninguna ayuda.

**Qué hacer:** `DetalleCotizaciones` ya es un catálogo de facto. Una función de servidor cacheada
6 h devuelve los N SKUs más cotizados con su última descripción y su último precio:

```js
/** Catálogo de sugerencias armado con lo que el área ya cotizó. Cacheado: cambia poco. */
function getCatalogoSugerido() {
  return cotCacheado_('catalogo_sku', 21600, function () {
    // Recorre DetalleCotizaciones una vez, agrupa por SKU y se queda con
    // { sku, descripcion (la más reciente), precio (el más reciente), veces }
    // Tope de 500 entradas: es un <datalist>, no una base de datos.
  });
}
```

En el cliente, un `<datalist>` por fila. Al elegir un SKU se rellenan descripción y precio, ambos
editables. El campo `veces` sirve para ordenar: lo más cotizado, primero.

**Nota de diseño:** esto **no** es "consultar precios en tiempo real" —que la visión descarta
explícitamente—. Es recordar lo que el propio equipo escribió. El precio sugerido debe mostrarse
como *«último precio capturado: $X, el 12 de julio»*, nunca como precio vigente.

**Costo:** ~80 líneas servidor + ~40 cliente. **Gana:** es la mejora que más minutos quita por
cotización después del autoguardado.

---

### 1.4 Duplicar una cotización

**Hoy:** existe `?page=cotizacion&folio=X&action=edit`, que **modifica** el folio existente. No
existe forma de partir de una cotización anterior para hacer una nueva. Un cliente que pide lo mismo
con un producto cambiado obliga a recapturar todo.

**Qué hacer:** un `action=clone` que reutilice `populateQuoteForm()` tal cual y solo omita fijar
`currentQuoteFolioInput.value` — así el guardado genera folio nuevo. El botón va en la tabla del
panel, junto a los de ver/editar/reenviar que ya existen (`inicio.html:151-180`).

**Costo:** ~15 líneas. **Gana:** desproporcionado para lo que cuesta.

---

### 1.5 El descuento total, visible mientras se captura

**Hoy:** el resumen muestra subtotal, IVA y total. El **ahorro del cliente** —el número que el
asesor dice en voz alta por teléfono— se calcula por línea en `calculateRow()` pero nunca se suma ni
se muestra.

**Qué hacer:** una línea más en el resumen, *«Ahorro del cliente: $X (Y %)»*, con `aria-live="polite"`
para que se anuncie al cambiar. Es una suma que ya está hecha.

**Costo:** ~10 líneas. **Gana:** el asesor deja de calcularlo en la calculadora del celular.

---

### 1.6 Atajos de teclado en la tabla de productos

**Hoy:** cada fila nueva exige ir al ratón y pulsar «Añadir producto». Capturar ocho productos son
ocho viajes al ratón. El Portal, en cambio, tiene un sistema de atajos completo y hasta una pantalla
de ayuda que los lista (`Index.html:3854`).

**Qué hacer:** `Enter` en la última celda de una fila crea la siguiente y pone el foco en su SKU.
`Ctrl+Enter` guarda. `Ctrl+D` duplica la fila actual. Y la misma hoja de ayuda con `?` que ya tiene
el Portal, reutilizando su estilo.

**Costo:** ~50 líneas. **Gana:** captura sin soltar el teclado.

---

### 1.7 Detección de cotización duplicada

**Hoy:** nada impide cotizar dos veces lo mismo al mismo cliente en el mismo día — pasa cuando la
primera navegación falló y el asesor no está seguro de si se guardó.

**Qué hacer:** al guardar, comparar contra las cotizaciones del asesor de las últimas 24 h. Si
coinciden cliente y conjunto de SKUs, devolver `{success:true, posibleDuplicado:'LVP-...'}` y que el
cliente pregunte antes de continuar. Con la lista del asesor ya cacheada (`COT_TTL.listaAsesor`), la
comparación es en memoria.

**Costo:** ~40 líneas servidor. **Gana:** menos folios basura, panel de supervisión más limpio.

---

### 1.8 El importador de JSON, más honesto

**Hoy:** `handleAutoPasteImport()` lee el portapapeles al abrir el modal. Si Chrome deniega el
permiso, el fallo se traga en un `console.log` (`cotizacion.html:880`) y el asesor ve un cuadro
vacío sin saber por qué no pasó nada.

**Qué hacer:** tres estados explícitos en el modal — *«JSON detectado y pegado»* (ya existe),
*«Pega aquí el JSON de la extensión»* y *«Tu navegador no permitió leer el portapapeles; pega con
Ctrl+V»*. Además, una vista previa de lo que se va a importar (n productos, total estimado, cuántos
son de proveedor externo) **antes** de tocar el formulario, en vez del resumen que hoy aparece
después (`cotizacion.html:960`).

**Costo:** ~50 líneas. **Gana:** el importador deja de sentirse mágico-e-impredecible.

---

### 1.9 Recuperar el estado tras un fallo de guardado

**Hoy:** si `saveQuoteAndGoToPreview` falla, se muestra el mensaje de error y el botón se rehabilita.
Correcto. Pero no hay reintento con un clic, y con el autoguardado de 1.1 en su sitio, tampoco hay
motivo para no ofrecerlo.

**Qué hacer:** el mensaje de error incorpora un botón *«Reintentar»* que reenvía el mismo payload.

---

## 2. Flujo de envío al cliente

Aquí hay una **asimetría difícil de justificar**: el correo que más importa es el que sale peor
acompañado.

`correo_cliente.html` —plantillas administrativas— tiene vista previa en vivo, un paso de
verificación con modal, resumen de destinatarios y confirmación explícita (`revisarEnvio()` →
`confirmarEnvio()`).

`correoventel.html` —la cotización con PDF, la que ve el cliente y lleva el precio— envía en un solo
clic, sin previsualizar y sin confirmar (`correoventel.html:handleSendEmail`).

### 2.1 Paso de verificación antes de enviar la cotización · **prioridad alta**

**Qué hacer:** reutilizar el patrón de `correo_cliente.html` tal cual: modal con destinatarios
resueltos, asunto, primeras líneas del cuerpo, formato del PDF elegido y remitente real. Un botón
«Enviar ahora» y otro «Volver a revisar». El código de referencia ya está escrito y probado en la
otra pantalla.

**Costo:** ~80 líneas, casi todo copiado. **Gana:** cierra la vía más directa a mandarle a un cliente
un PDF con el precio equivocado.

### 2.2 Vista previa del correo

Mismo argumento. `generateQuoteHtml(folio)` ya arma el HTML completo en el servidor
(`Correos.gs:68`); exponerlo como `getVistaPreviaCorreo(folio, formato)` y pintarlo en un `iframe`
con `sandbox` es media hora de trabajo.

### 2.3 CC y CCO

`sendQuoteByEmail` ya valida con `ccListaCorreos_` y `metRegistrarEnvio_` **ya tiene columnas `CC` y
`CCO`** que hoy siempre se escriben en `0` (`Correos.gs:731`). La estructura completa está montada;
falta la interfaz. Es habitual que el asesor quiera copiarse a sí mismo o a su supervisora.

### 2.4 Buscar el folio sin teclearlo completo

**Hoy:** `handleSearchQuote` exige el folio exacto. El sistema **ya tiene** búsqueda tolerante a
errores (`fuzzyScore_`, `Code.gs:1026`) usada en el panel, pero esta pantalla no la aprovecha.

**Qué hacer:** un campo con sugerencias de las últimas 20 cotizaciones del asesor —dato que ya se
cachea— y, al teclear tres caracteres, la búsqueda difusa del servidor. Llegar desde el panel con
`?folio=` ya funciona; el caso a cubrir es el del asesor que entra directo.

### 2.5 Reintento cuando Gmail falla

**Hoy:** si el envío falla por cuota de Gmail o por tiempo de ejecución agotado generando el PDF, el
asesor ve un toast rojo y pierde el trabajo. La métrica de error sí se registra
(`Correos.gs:757`) — el asesor es el único que no recibe nada útil.

**Qué hacer, en dos niveles:**

1. **Mínimo:** no limpiar el formulario ante el error (ya se hace) y ofrecer «Reintentar» con
   diagnóstico legible: cuota agotada, PDF no generado, destinatario inválido — no `error.message`.
2. **Completo:** una cola de reintento. El envío fallido por cuota se guarda en
   `PropertiesService` y un disparador cada 15 minutos lo reintenta con espera creciente. El asesor
   ve *«En cola, se reintentará solo»* en lugar de *«Falló»*.

El nivel 1 es media hora; el nivel 2 es un día y solo vale la pena si las métricas muestran que los
fallos por cuota son frecuentes — razón de más para tener las métricas primero.

### 2.6 El cuerpo del correo, editable sin tocar código

**Hoy:** el texto base (*«Estimado(a) …, Junto con saludar…»*) está incrustado en el JavaScript del
cliente (`correoventel.html:handleSearchQuote`). Cambiar una coma exige un despliegue.

**Qué hacer:** moverlo a la hoja del Portal, como ya vive el resto del contenido editable
(`readPortalSheet_`). Es coherente con el objetivo de calidad declarado en la arquitectura: *«que un
no técnico pueda operarlo»*.

---

## 3. Ciclo de vida de la cotización

### 3.1 Estados que la interfaz ya dibuja y el backend nunca escribe · **hallazgo**

`inicio_avanzado.html` tiene definidas clases de color para los estatus `autorizada`, `rechazada`,
`en-revision`, `enviada-por-correo` y `folio-generado` (`STATUS_CLASSES`).

El backend escribe exactamente **dos**: `"Folio Generado"` (`Code.gs:524`) y `"Enviada por Correo"`
(`Correos.gs:714`). Las otras tres son ramas muertas: alguien diseñó un ciclo de vida completo y
nunca se conectó.

**Consecuencia:** el sistema no sabe qué pasó con una cotización después de enviarla. Ni el asesor,
ni supervisión, ni las métricas. Es el hueco más grande del modelo de datos.

**Qué hacer:** un cambio de estatus manual desde el panel y desde la consulta de folio. La
infraestructura está completa — `setQuoteColumnValue_(folio, columna, valor)` existe y funciona
(`Formatos.gs:550`); solo falta exponerlo con control de permiso:

```js
/** Cambia el estatus de una cotización. Solo el asesor dueño o un avanzado. */
function cambiarEstatusCotizacion(folio, nuevoEstatus, emailSolicitante) {
  const ESTATUS_VALIDOS = ['Folio Generado', 'Enviada por Correo', 'En Revisión',
                           'Autorizada', 'Rechazada', 'Cancelada'];
  const id = secIdentidad_(emailSolicitante);
  if (!id.ok) return { success: false, message: id.error };
  if (ESTATUS_VALIDOS.indexOf(nuevoEstatus) < 0) return { success: false, message: 'Estatus no válido.' };
  // Dueño o avanzado; escribe, registra el cambio en bitácora e invalida la caché.
}
```

Con eso el sistema deja de ser «un generador de PDF» y empieza a poder responder *«de las 400
cotizaciones del mes, ¿cuántas se cerraron?»* — que es la pregunta que hará quien decida si el
proyecto se amplía. Nada de esto lo convierte en un CRM, que la visión descarta: es un campo de
estado y su bitácora.

### 3.2 Seguimiento de cotizaciones que se enfrían

Con el estatus vivo, un disparador diario puede resumirle a cada asesor: *«Tienes 6 cotizaciones
enviadas hace más de 5 días sin respuesta»*, por correo o en el panel. Es el uso más natural del
webhook de Google Chat que ya está montado (`sendWebhookNotification`) y hoy solo avisa de folios
nuevos.

---

## 4. Búsqueda y rendimiento

### 4.1 La búsqueda global no tiene tope ni paginación

`leerCotizacionesDeUsuario_` con término de búsqueda recorre **toda** la hoja, puntúa cada fila con
`fuzzyScore_` y devuelve **todos** los resultados (`Code.gs:605-615`). Con unos cientos de folios
funciona; el costo crece de forma lineal y el TTL de 90 s existe precisamente porque es la operación
más cara del sistema (así lo dice `Cache.gs:34`).

Es además el hallazgo A-03 del informe de seguridad, por otra razón: expone toda la base.

**Qué hacer:** tope de 50 resultados con *«Mostrando 50 de 312 — afina la búsqueda»*, más el corte
por relevancia mínima. Menos ruido para el asesor y menos trabajo para el servidor: la misma
decisión resuelve las dos cosas.

### 4.2 Levenshtein con corte temprano

`levenshtein_()` calcula la matriz completa aunque la distancia ya haya superado la tolerancia. Para
un término de 8 caracteres contra un texto de 60, se hacen cientos de operaciones cuyo resultado ya
se sabe que se va a descartar.

**Qué hacer:** el corte de Ukkonen — si el mínimo de la fila actual ya supera la tolerancia, no hay
forma de que el total quede por debajo; se aborta:

```js
function levenshtein_(a, b, tolerancia) {
  // ... igual que hoy ...
  for (let i = 1; i <= al; i++) {
    let minFila = Infinity;
    for (let j = 1; j <= bl; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < minFila) minFila = cur[j];
    }
    // Si toda la fila ya excede lo tolerable, el resultado final también lo hará.
    if (tolerancia !== undefined && minFila > tolerancia) return tolerancia + 1;
    prev = cur;
  }
  return prev[bl];
}
```

Un prefiltro previo cierra el resto: si el término no comparte ni un bigrama con el texto, no hace
falta ni entrar. **Costo:** ~15 líneas. **Gana:** búsqueda notablemente más rápida sobre el mismo
histórico, y espacio para subir el TTL o quitarlo.

### 4.3 El panel de supervisión no escala más allá del corte visual

`MAX_VISIBLE_ROWS = 150` limita lo que se pinta, pero el filtrado se hace en cliente sobre el
arreglo completo, que viaja entero desde el servidor. Hoy está bien. Cuando el histórico crezca, el
orden correcto es: filtrar en servidor, paginar, y archivar por año — el riesgo 6 que la propia
arquitectura ya tiene anotado.

---

## 5. Portal

El Portal está bien resuelto. Tres cosas concretas:

### 5.1 El contenido de procesos está incrustado en el HTML

`Index.html` pesa **506 KB**. La mayor parte son las tablas de procesos —Big Ticket, SoftLine,
Mensajerías, MarketPlace, Tienda Física, Generales— escritas a mano en el HTML, mientras que
herramientas, paqueterías, formatos y plantillas sí viven en la hoja del Portal y los administra el
área (`readPortalSheet_`).

Es una inconsistencia con consecuencias: cambiar un tiempo de reporte de un proceso exige que el
desarrollador edite HTML y despliegue. Peor: el buscador mantiene **índices estáticos duplicados**
en JavaScript (`Índice estático de Formas de Pago`, `de Big Ticket`, `de Soft Line`…), que se
desincronizan del contenido en cuanto uno de los dos cambia.

**Qué hacer:** migrar los procesos a hojas del Portal con el mismo `readPortalSheet_` que ya
funciona, y generar el índice del buscador desde los datos en vez de mantenerlo a mano. Es la
inversión de mantenimiento con mejor retorno del Portal, aunque no se vea en pantalla.

### 5.2 Las colecciones son manuales; podrían aprenderse solas

El Portal ya tiene colecciones de accesos favoritos, y funcionan bien. Pero exigen que el asesor las
arme. Un contador de uso en `localStorage` con decaimiento temporal —el modelo *frecency*: puntaje
por número de aperturas, envejecido por antigüedad— permite una fila *«Lo que más usas»* que se
llena sola desde el primer turno, sin configurar nada:

```js
// score = Σ (peso por apertura) donde el peso decae con la antigüedad
// apertura de hoy = 1.0 · de hace 7 días = 0.5 · de hace 30 días = 0.1
```

Es puro cliente, no sale ningún dato del navegador, y complementa las colecciones en lugar de
competir con ellas.

### 5.3 El reporte de enlace roto no cierra el círculo

`reportBrokenLink` escribe en la hoja `Reportes` y responde `{status:'ok'}`. Quien reporta nunca se
entera de si se arregló, así que a la tercera deja de reportar. Una columna `Estado` y un aviso en
el Portal cuando el enlace que reportaste vuelve a funcionar mantiene vivo el canal.

---

## 6. Transversal

### 6.1 Los errores hablan en técnico

Casi todos los mensajes al usuario terminan concatenando `error.message`:

```js
showGeneralMessage('Error de comunicación al guardar cotización: ' + error.message, true, false);
```

Eso le muestra al asesor texto que no puede accionar, y además es el hallazgo M-07 del informe de
seguridad (divulgación de información técnica).

**Qué hacer:** una tabla de traducción en `app_core.html` — causa técnica → qué pasó, qué hacer
ahora, y el detalle técnico plegado tras un *«Ver detalle»* para cuando se reporta la falla.

### 6.2 Ningún error del cliente se registra

No existe un `window.onerror` global en ninguna pantalla. Si un asesor encuentra un fallo de
JavaScript, el sistema no se entera nunca: lo único que existe es el botón de soporte, que depende
de que la persona se moleste en escribir. Ver la métrica 74 del
[catálogo](CATALOGO-DE-METRICAS.md).

### 6.3 Sin conexión, la app no lo dice

`AppRun` rechaza la promesa y cada pantalla decide. No hay una señal única de *«estás sin
conexión»*. Con `navigator.onLine` más `AppCache`, la app puede pintar lo último conocido con una
barra honesta: *«Sin conexión — mostrando datos de hace 12 minutos»*. El almacén ya tiene
`ageLabel()` escrito exactamente para esto (`app_core.html:458`) y hoy casi no se usa.

### 6.4 Accesibilidad: lo que falta sobre una base buena

`ViewPrefsPartial` con tema, densidad, escala de texto y contraste es más de lo que suele tener un
sistema interno. Los pendientes son puntuales:

- Los totales del resumen cambian sin `aria-live`: quien usa lector de pantalla no se entera.
- Los toasts de `AppMotion` no declaran `role="status"`.
- Las filas de producto se construyen con `innerHTML` sin `<label>` asociado a cada celda.
- El contraste del texto sobre `--brand` (#E10098) debe verificarse contra AA en los tres temas.

### 6.5 Sin pruebas automatizadas

Riesgo 8 de la arquitectura. `revisionMaestra()` cubre lo estructural —que las hojas y columnas
existan— pero ninguna regla de negocio. Y hay lógica pura, sin dependencias de Sheets, perfectamente
comprobable:

| Función | Por qué importa que no se rompa |
|---|---|
| `fuzzyScore_` / `levenshtein_` | Si se degrada, la búsqueda deja de encontrar y nadie lo nota |
| El cálculo de línea (`calculateRow` y su gemelo servidor) | Un error aquí llega al cliente con precio equivocado |
| `generateLvpFolio` | Folios duplicados |
| `parseVigencia_` | Promociones vencidas mostradas como vigentes |
| `secEsAfirmativo_` | Permisos mal resueltos |

Un `Pruebas.gs` con `probarTodo()` que corra casos en memoria y escriba ✔/✖ en el `Logger`, en la
misma línea que `revisionMaestra()`, cuesta un día y cubre lo que más duele.

**Y hay una duplicación que las pruebas harían evidente:** el cálculo de la línea de producto está
escrito **tres veces** —en `cotizacion.html` (`calculateRow`), en `Correos.gs` (armado del correo) y
en `cotizado_preview.html` (`computeCclRow`)—. Tres copias de la misma regla comercial es una
divergencia esperando su turno.

---

## 7. Prioridades sugeridas

Ordenado por valor entregado sobre esfuerzo, asumiendo un solo desarrollador.

### Antes que nada

Los tres hallazgos críticos de seguridad. Nada de esta lista importa si el sistema no puede tratar
datos reales. Ver [Seguridad](../operacion/SEGURIDAD.md).

### Tanda 1 — una semana, impacto inmediato

| # | Mejora | Esfuerzo |
|---|---|---|
| 1.1 | Autoguardado del borrador de cotización | 1 día |
| 2.1 | Paso de verificación antes de enviar la cotización | 0.5 día |
| 1.5 | Descuento total visible en el resumen | 1 hora |
| 1.4 | Duplicar cotización | 1 hora |
| 4.1 | Tope y paginación en la búsqueda | 0.5 día |
| 6.1 | Traducción de errores a lenguaje de negocio | 0.5 día |

### Tanda 2 — dos a tres semanas

| # | Mejora | Esfuerzo |
|---|---|---|
| 1.2 | Revisor de cotización con avisos suaves | 2 días |
| 1.3 | Autocompletado de SKU desde el histórico | 2 días |
| 3.1 | Ciclo de vida real de la cotización (estatus) | 2 días |
| 2.2–2.4 | Vista previa del correo, CC/CCO, búsqueda de folio | 3 días |
| 6.5 | `Pruebas.gs` con la lógica pura | 1 día |
| — | Nivel 1 del catálogo de métricas (agregación, sin instrumentar) | 3 días |

### Tanda 3 — el trimestre

| # | Mejora | Esfuerzo |
|---|---|---|
| 5.1 | Migrar el contenido de procesos del Portal a hojas | 1 semana |
| 3.2 | Seguimiento de cotizaciones frías | 3 días |
| 2.5 | Cola de reintento de envíos | 2 días |
| — | Hoja `Eventos` + rollup nocturno (ver catálogo de métricas) | 1 semana |
| 4.3 | Filtrado en servidor y archivado por año | 3 días |
| 6.4 | Repaso de accesibilidad | 2 días |

---

## 8. Lo que conviene *no* hacer

Tan importante como la lista anterior. Estas ideas suenan bien y saldrían caras:

- **Un marco de trabajo de frontend.** El proyecto es mantenible por una persona precisamente porque
  no lo tiene. Ver [ADR-0001](../decisiones/ADR-0001-GOOGLE-APPS-SCRIPT-COMO-PLATAFORMA.md).
- **Migrar de Sheets a una base real, hoy.** Es la decisión correcta a la larga y la equivocada
  ahora: cuesta semanas y no resuelve ninguno de los problemas de esta lista.
- **Seguimiento de apertura de correo (pixel).** Daría una métrica atractiva a cambio de romper el
  perímetro de datos y de una conversación de privacidad que el proyecto no necesita.
- **Convertirlo en CRM.** La visión lo descarta explícitamente y con razón. El estatus de 3.1 es un
  campo de estado, no seguimiento comercial.
- **Métricas de productividad individual publicadas** antes de cerrar C-02. Con una identidad que el
  navegador declara, un número por persona no es defendible. Ver
  [Catálogo de métricas](CATALOGO-DE-METRICAS.md#8-la-advertencia-que-no-puede-faltar).

---

*Revisión de oportunidades — 30 de julio de 2026. Uso interno de Liverpool.*
