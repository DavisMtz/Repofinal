# Catálogo de métricas

Todo lo que el Sistema Integral Ventel **podría** medir, ordenado por lo que cuesta llegar a cada
dato. Y, con la misma honestidad, **por qué medirlo todo no es gratis** y qué hay que construir
antes.

Este documento responde tres preguntas concretas:

1. ¿Cuántas cosas se pueden medir con el sistema tal como está hoy?
2. ¿Cuáles ya se miden y cuáles no?
3. ¿Por qué no están todas, si el dato parece estar ahí?

Complementa a [Impacto operativo](IMPACTO-OPERATIVO.md), que explica cómo se traduce una medición en
horas ahorradas. Aquí se trata del **inventario**, no del método.

| Dato | Valor |
|---|---|
| Métricas identificadas | **91** |
| Se miden hoy | 10 |
| Alcanzables sin escribir ni un dato nuevo | 40 más |
| Requieren instrumentación ligera | 31 |
| Requieren cambio estructural o decisión de negocio | 10 |

---

## 1. La respuesta corta

**Se puede medir muchísimo más de lo que se mide, y la mitad no cuesta casi nada.**

De 91 métricas identificadas, **50 salen de datos que el sistema ya está escribiendo en las hojas
todos los días**. Hoy se aprovechan 10. Las otras 40 solo necesitan que alguien las agregue y las
pinte — cero instrumentación, cero cambio de esquema, cero riesgo.

El techo real no es el dato. Es que **Google Sheets no es una base analítica**, y a partir de cierto
volumen la forma de calcular deja de funcionar antes de que se agoten las ideas. Eso se explica en
la sección 5.

---

## 2. Nivel 0 — Lo que ya se mide (10)

| # | Métrica | De dónde sale |
|---|---|---|
| 1 | Cotizaciones del mes actual | `getDashboardStats` |
| 2 | Cotizaciones del mes anterior | `getDashboardStats` |
| 3 | Cotizaciones por asesor, mes en curso | `getDashboardStats` |
| 4 | Cotizaciones de hoy | `getDashboardStats` |
| 5 | Cotizaciones de los últimos 7 días | `getDashboardStats` |
| 6 | Correos enviados: total | `getResumenMetricasCorreos` |
| 7 | Correos enviados con éxito | `getResumenMetricasCorreos` |
| 8 | Correos con error | `getResumenMetricasCorreos` |
| 9 | Correos por tipo, por día (30) y por asesor | `getResumenMetricasCorreos` |
| 10 | Reportes de enlace roto | Hoja `Reportes` (sin panel: hay que abrir la hoja) |

Es un buen punto de partida y está bien construido: `MetricasCorreos` registra los dos canales de
envío en una sola hoja con 15 columnas, lo que evita el problema clásico de tener dos fuentes que no
cuadran.

**El límite:** todo lo que se mide hoy es **volumen**. Cuántas cotizaciones, cuántos correos.
Ninguna métrica habla de dinero, de calidad, de tiempo ni de resultado.

---

## 3. Nivel 1 — Alcanzables sin escribir ni un dato nuevo (40)

Estas 40 métricas se calculan **agregando columnas que ya se llenan**. No hay que instrumentar nada,
ni cambiar esquema, ni tocar el camino crítico de ninguna operación. Es puro código de lectura.

### 3.1 Dinero y descuento — hoja `Cotizaciones` (7)

| # | Métrica | Columnas |
|---|---|---|
| 11 | Monto total cotizado (día / semana / mes) | `TotalGeneral` |
| 12 | Ticket promedio por cotización | `TotalGeneral` |
| 13 | **Mediana** del ticket | `TotalGeneral` |
| 14 | Distribución del ticket (p25 / p50 / p90) | `TotalGeneral` |
| 15 | Descuento monetario total otorgado | `Subtotal` vs detalle |
| 16 | Descuento medio ponderado (%) | `DetalleCotizaciones` |
| 17 | Cotizaciones con descuento adicional vs sin él | `AplicaDescAdicional` |

> La 13 importa más que la 12. Una cotización de $400,000 mueve el promedio del mes entero; la
> mediana describe la realidad del turno. Es la misma advertencia que ya hace
> [Impacto operativo](IMPACTO-OPERATIVO.md#paso-1--cronometra-el-asis) para los cronometrajes.

### 3.2 Operación y patrones de uso (10)

| # | Métrica | Por qué sirve |
|---|---|---|
| 18 | Mix de formato: `actual` vs `ccl_liverpool` | ¿Vale la pena mantener los dos? |
| 19 | Cotizaciones por hora del día | Curva de carga real del turno |
| 20 | Cotizaciones por día de la semana | Dónde poner refuerzo |
| 21 | Cotizaciones sin correo de cliente | Calidad del dato capturado |
| 22 | Cotizaciones sin teléfono | Ídem |
| 23 | Cotizaciones con observaciones | Cuánto se usa el campo libre |
| 24 | Clientes únicos (por `CorreoCliente`) | Alcance real |
| 25 | Clientes recurrentes (mismo correo en >1 folio) | Señal de relación, no de transacción |
| 26 | Top clientes por monto acumulado | Conversación con quien decide |
| 27 | Cotizaciones por asesor — **histórico completo** | Hoy solo existe el mes en curso |

### 3.3 Adopción (3)

| # | Métrica | Por qué sirve |
|---|---|---|
| 28 | Asesores activos por semana | El número que pide el [Plan de adopción](../operacion/PLAN-DE-ADOPCION.md) |
| 29 | Asesores registrados **sin ninguna cotización** | Adopción que se cayó y nadie vio |
| 30 | Antigüedad del folio más viejo sin enviar | Trabajo estancado |

La 29 es de las más útiles y de las más baratas: `Registros` menos los `AsesorCorreo` distintos de
`Cotizaciones`. Una resta de conjuntos que hoy nadie hace.

### 3.4 Producto — hoja `DetalleCotizaciones` (7)

| # | Métrica | Por qué sirve |
|---|---|---|
| 31 | Productos por cotización (promedio y distribución) | Dimensiona el esfuerzo de captura |
| 32 | SKUs más cotizados | Alimenta el autocompletado (mejora 1.3) |
| 33 | SKUs con mayor monto acumulado | Dónde está el dinero |
| 34 | Precio unitario promedio por SKU **y su dispersión** | Dispersión alta = captura errónea |
| 35 | % de líneas con «pago único» | Uso real de la promoción |
| 36 | % de líneas de marketplace vs Liverpool | Mezcla comercial |
| 37 | Líneas con precio 0 o cantidad 0 | Errores que llegaron al cliente |

> La 34 es un detector de errores disfrazado de métrica: si el mismo SKU se capturó a $8,999 y a
> $899, alguien se equivocó de tecla y el cliente recibió el precio malo.

### 3.5 Envíos — hoja `MetricasCorreos` (7)

| # | Métrica | Por qué sirve |
|---|---|---|
| 38 | Tasa de éxito de envío, global y por asesor | Salud del canal |
| 39 | Envíos con alias institucional vs cuenta propia | Si sube el segundo, el alias se rompió |
| 40 | Destinatarios promedio por envío | — |
| 41 | Envíos con adjunto vs sin adjunto | — |
| 42 | **Reenvíos**: mismo folio enviado N veces | Reenviar tres veces es una señal de problema |
| 43 | Errores agrupados por causa (columna `Detalle`) | Qué arreglar primero |
| 44 | Envíos por hora del día | Pico contra cuota de Gmail |

### 3.6 El cruce que hoy nadie hace (6) · **el más valioso del documento**

`Cotizaciones` y `MetricasCorreos` **comparten el folio**: `Folio` en una, `Referencia` en la otra.
Nadie las une. De ese `JOIN` —una vuelta en memoria sobre dos arreglos ya leídos— salen las seis
métricas que de verdad describen el proceso:

| # | Métrica | Cómo se calcula |
|---|---|---|
| 45 | **Tasa de conversión folio → enviado** | Folios con al menos un envío ÷ folios totales |
| 46 | **Lead time captura → envío** | `MetricasCorreos.Fecha` − `Cotizaciones.Timestamp` |
| 47 | **Cotizaciones huérfanas** (generadas, nunca enviadas) | Folios sin ninguna fila en métricas |
| 48 | **Monto cotizado que nunca salió al cliente** | Suma de `TotalGeneral` de las huérfanas |
| 49 | Lead time por asesor | La 46, agrupada |
| 50 | Cotizaciones modificadas después de enviarse | `Timestamp` posterior al envío |

La 47 y la 48 son la métrica que responde *«¿dónde se está fugando el trabajo?»*. Si el 30 % de las
cotizaciones nunca se envía, eso son horas de captura tiradas, y hoy nadie tiene forma de saberlo.

**Coste de todo el nivel 1:** una función de agregación por bloque y un panel donde pintarlo.
Estimado: **tres días de trabajo** para las 40. Es la mejor inversión de medición del proyecto.

---

## 4. Nivel 2 — Requieren instrumentación ligera (31)

Aquí hay que **escribir un dato que hoy no se escribe**. No cambia el esquema de negocio: se añade
un registro de evento. La sección 6 explica cómo hacerlo sin degradar el sistema.

### 4.1 Tiempo real de trabajo (6) · **automatiza `[medir]`**

| # | Métrica | Cómo |
|---|---|---|
| 51 | **Tiempo real de captura** (abrir formulario → guardar) | Marca al abrir, resta al guardar |
| 52 | Abandono del formulario (se abrió y no se guardó) | Evento de apertura sin evento de guardado |
| 53 | Importador JSON vs captura manual | Bandera en el evento de guardado |
| 54 | Tiempo ahorrado por el importador | 51, segmentada por 53 |
| 55 | Correcciones de una fila antes de guardar | Contador en cliente |
| 56 | Uso del botón «Actualizar» (forzar recarga) | Señal de desconfianza en la caché |

> **La 51 vale por sí sola todo el nivel 2.** El documento de
> [Impacto operativo](IMPACTO-OPERATIVO.md#3-tabla-asis--tobe) tiene hoy **nueve celdas marcadas
> `[medir]`** que se supone se llenan con cronómetro, sobre gente real, cinco veces por tarea. La
> mitad de esas celdas —las del ToBe— **el sistema puede medirlas solo, sobre la población
> completa y de forma continua**, en vez de con una muestra de cinco. Sigue haciendo falta
> cronometrar el AsIs, pero eso se hace una vez y ya.

### 4.2 Adopción y uso (8)

| # | Métrica |
|---|---|
| 57 | Vistas por pantalla (`?page=`) — qué se usa y qué no |
| 58 | Usuarios activos diarios / semanales / mensuales |
| 59 | Curva de adopción por fase del plan |
| 60 | Sesiones por asesor por turno |
| 61 | Descargas de PDF por formato |
| 62 | Aperturas en Sheets (`openQuoteInSheets`) |
| 63 | Copias de enlace directo (`copyLink`) |
| 64 | Cambios de tema / densidad / contraste — accesibilidad realmente usada |

### 4.3 Portal (6)

| # | Métrica | Por qué sirve |
|---|---|---|
| 65 | Términos buscados (**clasificados, no crudos** — ver 7.2) | Qué busca la gente |
| 66 | **Búsquedas sin resultado** | El mejor indicador de contenido que falta |
| 67 | Clics por herramienta / formato / plantilla | Qué justifica su lugar en la pantalla |
| 68 | Herramientas nunca abiertas | Candidatas a retirar |
| 69 | Anuncios: impresiones y clics por anuncio | Si un aviso se ve o no |
| 70 | Uso de colecciones y del historial de copiados | Si las funciones nuevas prendieron |

> La 66 es la métrica más rentable del Portal. Cada búsqueda sin resultado es alguien que necesitaba
> algo y no lo encontró, y hoy esa señal se pierde por completo.

### 4.4 Salud técnica (7)

| # | Métrica | Por qué sirve |
|---|---|---|
| 71 | **Errores JS del cliente** por pantalla y navegador | Hoy no existe ningún `window.onerror` |
| 72 | Latencia por llamada de servidor (p50 / p95 por función) | Qué pantalla es lenta de verdad |
| 73 | Aciertos y fallos de caché | Si la caché sirve o solo complica |
| 74 | Uso del enlace manual de navegación (`mostrarEnlaceManual`) | Mide un problema conocido del iframe |
| 75 | Reintentos de envío | Dimensiona la cola de la mejora 2.5 |
| 76 | Consumo de cuota de Apps Script | Cuánto margen queda antes del tope |
| 77 | Tiempo de generación del PDF por formato | CCL contra HTML, con datos |

La 74 merece un comentario: `AppUrl.go()` tiene un camino de respaldo bien pensado para cuando el
navegador ignora la navegación desde el iframe (`app_core.html:186`). Nadie sabe con qué frecuencia
se activa. Si es el 40 % de las veces, es un problema grave que se está tolerando a ciegas.

### 4.5 Seguridad y ciclo de usuario (4)

| # | Métrica |
|---|---|
| 78 | Logins fallidos y bloqueos por fuerza bruta |
| 79 | Altas de usuario por semana |
| 80 | Reportes de enlace roto por sección y tiempo hasta su resolución |
| 81 | Accesos denegados por falta de rol avanzado |

---

## 5. Nivel 3 — Cambio estructural o decisión de negocio (10)

| # | Métrica | Qué hace falta |
|---|---|---|
| 82 | **Conversión cotización → venta** | El ciclo de vida real del estatus ([mejora 3.1](OPORTUNIDADES-DE-MEJORA.md#31-estados-que-la-interfaz-ya-dibuja-y-el-backend-nunca-escribe--hallazgo)) |
| 83 | Motivo de rechazo del cliente | Campo nuevo + que alguien lo llene |
| 84 | Tiempo de respuesta del cliente | Leer el buzón — **fuera de alcance por decisión de la visión** |
| 85 | Tasa de apertura del correo | Pixel de seguimiento — **no recomendado**, ver 7.1 |
| 86 | Ahorro en horas, calculado solo | AsIs cronometrado una vez + métrica 51 |
| 87 | Satisfacción del asesor (NPS interno) | Encuesta corta dentro de la app |
| 88 | Margen por cotización | El sistema no conoce el costo |
| 89 | Avance contra el objetivo del área | Que exista una meta cargada |
| 90 | Precisión del precio capturado vs catálogo real | Integración de catálogo — la visión la descarta |
| 91 | Cotizaciones que terminaron en reclamación | Cruce con otro sistema institucional |

De estas, **solo la 82, la 86 y la 87 valen la pena**. Las demás piden romper una frontera que el
proyecto puso a propósito, y el precio no compensa.

---

## 6. Por qué no están todas: los nueve frenos reales

Esta es la parte que interesa. No es falta de ideas ni de tiempo: hay razones técnicas concretas, y
conviene nombrarlas para no repetir el diagnóstico cada seis meses.

### 6.1 Sheets no es una base analítica

Cada evento medido es un `appendRow`. Un `appendRow` **serializa** —bloquea la hoja—, tarda entre
200 y 500 ms, y compite con las escrituras de negocio. Instrumentar cada clic del Portal con una
escritura directa degradaría el sistema de forma perceptible.

Y hay techos duros: una hoja de cálculo admite **10 millones de celdas**. Un registro de eventos de
7 columnas con 5,000 eventos diarios llega ahí en poco más de **siete meses**. No es una hipótesis
lejana: es el segundo año del proyecto.

### 6.2 La agregación es O(n) sobre todo el histórico, cada vez

`calcularResumenMetricas_()` hace `sheet.getDataRange().getValues()` y recorre **la hoja completa**
para producir un resumen de 30 días (`Metricas.gs:122`). Lo mismo hace `calcularDashboardStats_()`
sobre `Cotizaciones`.

Funciona con miles de filas. Con cientos de miles se topa con el límite de **6 minutos por ejecución**
de Apps Script y la función simplemente deja de responder. El TTL de 600 s de `COT_TTL.metricas` no
resuelve eso: solo esconde el costo hasta que crece lo suficiente.

**Es el freno estructural más importante.** Cada métrica nueva que se agregue de esta forma acerca
ese muro. La solución está en 7.3.

### 6.3 La identidad la declara el cliente (C-02)

Toda métrica por persona es tan confiable como el correo que envía el navegador. En modo `portal`
—el predeterminado— el servidor comprueba que el correo exista en `Registros` pero **no puede probar
que sea de quien dice ser** (`Seguridad.gs:34`).

Se puede medir. **No se puede publicar como evaluación de desempeño.** Ver la sección 8.

### 6.4 No hay reloj confiable para medir duración

Medir «tiempo de captura» exige una marca de inicio. Ponerla en el cliente la hace manipulable y
sensible al reloj del equipo. Ponerla en el servidor cuesta una llamada extra al abrir el formulario
—cientos de milisegundos y cuota— justo cuando el asesor quiere empezar a teclear.

**Salida razonable:** una llamada ligerísima `iniciarCaptura()` que devuelva un identificador con
sello de tiempo del servidor, disparada **después** del primer pintado para que no estorbe. Para lo
que se busca —una mediana sobre cientos de capturas— la precisión sobra.

### 6.5 Cada métrica hoy exige su propio esquema

`MetricasCorreos` tiene 15 columnas fijas para un solo tipo de evento. Añadir «tiempo de captura»
significa otra hoja, otras cabeceras, otro lector, otro agregador, otra sección de panel.

Con 31 métricas de nivel 2, eso son 31 mini-proyectos. **Nadie los va a hacer así, y ese es
exactamente el motivo por el que hoy solo hay una.** La salida es un esquema genérico de eventos
(7.1).

### 6.6 Las escrituras van en el camino crítico

`metRegistrarEnvio_` corre **síncrono** justo después de mandar el correo. Está bien resuelto —nunca
lanza, y si falla solo lo anota en el `Logger` (`Metricas.gs:85`)— pero suma su latencia a lo que el
asesor espera. Con un evento es imperceptible. Con veinte, se nota.

### 6.7 Choca de frente con un objetivo de calidad declarado

La arquitectura dice, textualmente, entre los objetivos de calidad:

> **Que el dato no salga del dominio** — Sin analítica, sin telemetría, sin APIs de terceros con
> datos de cliente.

Instrumentar el uso **es** telemetría. La tensión es real y no se resuelve ignorándola.

**Reencuadre honesto:** lo que ese objetivo prohíbe es analítica **de terceros** con datos de
cliente —Google Analytics, Mixpanel, un pixel—. Medición propia, dentro del mismo dominio de
Workspace, en las mismas hojas donde ya vive todo, es otra cosa. Pero la distinción hay que
**escribirla en un ADR**, no darla por supuesta, y hay que **avisarle a la gente** que se está
midiendo el uso. Un sistema interno que mide en silencio a sus usuarios se gana una crisis de
confianza que cuesta más que cualquier métrica.

### 6.8 Medir uso puede capturar PII sin querer

Guardar el término de búsqueda crudo del Portal parece inocuo hasta que un asesor teclea el nombre
de un cliente en el buscador. Ahí se acaba de crear un registro de PII en una hoja que nadie
clasificó como tal.

**Regla:** los eventos guardan **categorías y conteos**, no texto libre del usuario. Para la métrica
66 —búsquedas sin resultado— basta con guardar el término *cuando no arroja resultados* y **solo si
no parece PII** (sin `@`, sin dígitos largos, longitud acotada). Se pierde algo de detalle; se gana
no tener que explicar por qué hay nombres de clientes en la hoja de analítica.

### 6.9 No hay capa de visualización reutilizable

`inicio_avanzado.html` usa Chart.js una sola vez, para una dona. Las demás gráficas son `div` con
`style="height:X%"` calculado a mano en la plantilla (`mc-daychart`, `mc-track-fill`). Cada métrica
nueva significa HTML nuevo escrito a mano.

Sin un componente de tarjeta KPI y uno de gráfica de barras reutilizables, **el cuello de botella
deja de ser el dato y pasa a ser pintarlo**. Es un día de trabajo que multiplica la velocidad de
todo lo demás.

---

## 7. Lo que hay que construir para desbloquear todo

Tres piezas. Con ellas, añadir una métrica pasa de ser un mini-proyecto a ser una línea de código.

### 7.1 Una hoja `Eventos` genérica

Un solo esquema para todo lo que se quiera medir de ahora en adelante:

| Columna | Contenido |
|---|---|
| `Fecha` | Sello de tiempo del servidor |
| `Tipo` | `cotizacion.guardada`, `portal.busqueda.vacia`, `error.js`, … |
| `Actor` | Correo del asesor, o `''` si es anónimo o agregado |
| `Objeto` | Folio, nombre de herramienta, pantalla… |
| `Valor` | Un número: duración en ms, cantidad, tamaño |
| `Meta` | JSON corto para lo que no cabe arriba |

Con esto, las 31 métricas del nivel 2 dejan de necesitar hojas nuevas. `MetricasCorreos` se queda
como está: funciona, tiene historia y no hay motivo para migrarla.

### 7.2 Escritura por lote, nunca en el camino crítico

El evento **no** se escribe al ocurrir. Se acumula en `CacheService` y un disparador cada 5 minutos
lo vuelca de una sola vez con `setValues()` —una escritura para N eventos, en vez de N escrituras—:

```js
/** Encola un evento. Nunca escribe en la hoja: solo acumula. Nunca lanza. */
function evtRegistrar_(tipo, actor, objeto, valor, meta) {
  try {
    const cache = CacheService.getScriptCache();
    const buffer = JSON.parse(cache.get('evt_buffer') || '[]');
    buffer.push([new Date().toISOString(), tipo, actor || '', objeto || '',
                 valor || 0, meta ? JSON.stringify(meta) : '']);
    // Tope de seguridad: si el volcado falla, el buffer no puede crecer sin control.
    if (buffer.length > 400) buffer.splice(0, buffer.length - 400);
    cache.put('evt_buffer', JSON.stringify(buffer), 3600);
  } catch (e) { /* medir jamás puede tumbar lo que se está midiendo */ }
}

/** Disparador cada 5 min: vuelca el buffer a la hoja en UNA sola escritura. */
function evtVolcar() {
  const cache = CacheService.getScriptCache();
  const buffer = JSON.parse(cache.get('evt_buffer') || '[]');
  if (!buffer.length) return;
  cache.remove('evt_buffer');
  const sheet = evtHoja_();
  sheet.getRange(sheet.getLastRow() + 1, 1, buffer.length, 6).setValues(buffer);
}
```

Se acepta a propósito perder los eventos del último intervalo si el script se reinicia. Es
telemetría, no contabilidad: una métrica con 99 % de los datos sirve igual, y esa concesión es lo
que permite que medir no cueste nada en la pantalla del asesor.

### 7.3 Rollup nocturno · **la pieza que resuelve el freno 6.2**

Un disparador diario consolida el día cerrado en una hoja `MetricasDiarias` con **una fila por día**:

```
Fecha | Cotizaciones | MontoTotal | TicketMediano | CorreosOK | CorreosErr |
AsesoresActivos | LeadTimeMedianoMin | Huerfanas | ...
```

A partir de ahí, el panel lee **365 filas al año**, no el histórico completo. La agregación pesada
corre de madrugada, cuando nadie espera, y sin límite de paciencia humana. El histórico crudo se
puede archivar por año —el riesgo 6 que la arquitectura ya tiene anotado— sin perder ninguna serie
de tiempo.

**Esto es lo que convierte «medir más» en algo sostenible en vez de una bomba de tiempo.** Sin el
rollup, cada métrica nueva es deuda; con él, el costo de consultar deja de depender del tamaño del
histórico.

---

## 8. La advertencia que no puede faltar

**No publiques métricas de desempeño individual hasta cerrar C-02.**

El sistema puede calcular hoy mismo cuántas cotizaciones hizo cada asesor, cuánto tardó y cuántos
correos le fallaron. Y sería un error hacerlo público, por dos razones distintas:

**Técnica.** La identidad la declara el navegador. Un número por persona sobre una identidad
falsificable no se sostiene ante el primer cuestionamiento —y quien sea comparado
desfavorablemente lo va a cuestionar—.

**Humana.** Una herramienta que se adopta *«porque conviene, no porque se ordenó»* —el tercer
principio de la [visión](VISION-Y-ALCANCE.md#2-la-visión)— deja de convenir el día que se convierte
en el instrumento con el que te evalúan. La adopción voluntaria y la vigilancia individual no
conviven; si hay que elegir, la adopción vale más que el tablero.

**Cómo sí:**

- **Agregados del área**, no rankings individuales, en lo que se comparte hacia arriba.
- **Su propio dato, para cada asesor.** Que cada quien vea el suyo y se compare con la mediana del
  área, sin nombres ajenos, es motivador. Un ranking público no lo es.
- **Métricas de sistema, no de persona.** «El lead time mediano es de 4 horas» dice qué arreglar.
  «Fulano tarda 6» solo señala a alguien.
- **Transparencia.** Que esté escrito qué se mide y por qué, y que se pueda leer desde la app.

---

## 9. Resumen ejecutivo

| Pregunta | Respuesta |
|---|---|
| ¿Cuánto se puede medir? | **91 métricas** identificadas. Realistas y útiles: unas 70. |
| ¿Cuánto se mide hoy? | **10**, todas de volumen. Ninguna de dinero, tiempo, calidad ni resultado. |
| ¿Cuánto está a la mano? | **40 más sin escribir ni un dato nuevo.** Tres días de trabajo. |
| ¿Ha sido difícil? | No se ha intentado. Lo que existe está bien hecho; lo que falta, falta por prioridad, no por dificultad. |
| ¿Por qué sería difícil meterlas todas? | Por Sheets: escrituras serializadas, agregación O(n) contra un tope de 6 min, y 10 M de celdas por hoja. Ver sección 6. |
| ¿Qué desbloquea el resto? | Hoja `Eventos` + escritura por lote + **rollup nocturno**. Una semana de trabajo. |
| ¿Qué no hay que hacer? | Publicar métricas individuales antes de cerrar C-02. Y no medir apertura de correo con pixel. |

**Si solo se hace una cosa:** las seis métricas del cruce folio ↔ envío (sección 3.6). Son las que
responden dónde se fuga el trabajo, salen de datos que ya existen, y no cuestan más de un día.

---

*Catálogo de métricas — 30 de julio de 2026. Uso interno de Liverpool.*
