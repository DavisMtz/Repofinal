# Impacto operativo

Cómo se mide lo que ahorra el Sistema Integral Ventel, y cómo se presenta ese ahorro a quien decide.
Léelo si vas a justificar el proyecto, pedir apertura de una fase o armar la presentación a
jefatura.

**Advertencia de honestidad:** las cifras de este documento son el **método**, no el resultado. Los
números marcados como `[medir]` se llenan con la medición real del área. No presentes una cifra
estimada como si fuera medida: un dato inflado tumba la credibilidad de todo lo demás.

---

## 1. La regla: horas, no adjetivos

Nada de "mejora la eficiencia" ni "optimiza el proceso". El impacto se dice así:

> Minutos por asesor al día → horas por equipo al día → horas al mes → **jornadas equivalentes**.

La última traducción es la que entiende quien decide. "Ahorramos 1,668 horas al mes" no significa
nada hasta que dices "equivale a ≈ 11.7 jornadas efectivas: como sumar casi 12 asesores al equipo,
sin contratar a nadie".

---

## 2. Cómo se mide

### Paso 1 — Cronometra el AsIs

Antes de tocar nada, mide cuánto tarda hoy la tarea. Con cronómetro, sobre gente real, mínimo cinco
mediciones por tarea y por asesor distinto. Toma la **mediana**, no el promedio: un solo caso
atípico distorsiona el promedio.

### Paso 2 — Cronometra el ToBe

La misma tarea, con la herramienta, con gente que ya la sabe usar. Nunca midas la primera vez de
alguien: eso mide el aprendizaje, no la herramienta.

### Paso 3 — Escalona

| Nivel | Cómo se calcula |
|---|---|
| Por asesor / día | (minutos AsIs − minutos ToBe) × veces que se hace al día |
| Por equipo / día | anterior × número de asesores activos |
| Por equipo / mes | anterior × días laborales del mes |
| Jornadas equivalentes | horas al mes ÷ horas de una jornada efectiva |

### Paso 4 — Cierra con la equivalencia humana

"Equivale a X jornadas efectivas al mes" o "libera el tiempo de X asesores completos".

---

## 3. Tabla AsIs → ToBe

Rellena la columna de minutos con la medición real. La columna *Qué cambió* ya está escrita porque
describe el sistema, no la medición.

| Tarea | AsIs (min) | ToBe (min) | Qué cambió |
|---|---|---|---|
| Armar una cotización completa | `[medir]` | `[medir]` | Captura en pantalla con cálculo automático de subtotal, IVA, descuento público y descuento adicional. Antes: formato a mano y cálculo aparte. |
| Generar el PDF en formato CCL | `[medir]` | `[medir]` | Un clic. Antes: copiar la plantilla, llenarla, ajustar impresión y exportar. |
| Enviar la cotización al cliente | `[medir]` | `[medir]` | Sale con PDF adjunto desde el alias institucional, con las respuestas dirigidas al asesor. Antes: adjuntar a mano en Gmail. |
| Mandar un correo de plantilla | `[medir]` | `[medir]` | Se elige plantilla, se llenan datos, se verifica y se confirma. Antes: buscar el texto, copiar, pegar y editar. |
| Consultar un folio anterior | `[medir]` | `[medir]` | Buscador con tolerancia a errores de dedo. Antes: buscar en la hoja o preguntar. |
| Encontrar un enlace o formato del área | `[medir]` | `[medir]` | Buscador global del Portal. Antes: preguntar en el chat del equipo. |
| Consultar promociones vigentes | `[medir]` | `[medir]` | Monitor con vigencias y calendario a 90 días. Antes: revisar varios documentos. |
| Enterarse de un aviso del área | `[medir]` | `[medir]` | Anuncio visible al abrir el Portal. Antes: correo o mensaje que se pierde. |
| Sacar el reporte de cotizaciones del mes | `[medir]` | `[medir]` | Panel de supervisión con filtros y rango de fechas. Antes: consolidar a mano. |

---

## 4. Plantilla del cálculo

Sustituye las variables y queda listo para presentar.

```
AHORRO POR ASESOR / DÍA
  Suma de (AsIs − ToBe) × frecuencia diaria .......... [A] minutos

AHORRO POR EQUIPO / DÍA
  [A] × [N] asesores activos ......................... [B] minutos
  [B] ÷ 60 ........................................... [C] horas

AHORRO POR EQUIPO / MES
  [C] × [D] días laborales ........................... [E] horas

EQUIVALENCIA
  [E] ÷ [J] horas por jornada efectiva ............... [K] jornadas
  → "Como sumar [K] asesores al equipo, sin contratar a nadie."
```

**Ejemplo del formato de salida** (cifras ilustrativas, del método de referencia — **no son la
medición de Ventel**):

> 130 min por asesor al día · 75.8 h por equipo al día · 1,668 h al mes.
> Equivale a ≈ 11.7 jornadas efectivas: como sumar casi 12 asesores más al equipo, sin contratar
> a nadie.

---

## 5. Lo que el sistema ya mide solo

No todo hay que cronometrarlo. Estos datos salen del propio sistema y sirven como evidencia dura:

| Dato | De dónde sale |
|---|---|
| Cotizaciones del mes actual y del anterior | Panel avanzado → `getDashboardStats` |
| Cotizaciones por asesor | Panel avanzado, mes en curso |
| Cotizaciones por día (últimos 7 días y hoy) | Panel avanzado |
| Correos enviados: total, exitosos y fallidos | Hoja `MetricasCorreos` → `getResumenMetricasCorreos` |
| Correos por tipo, por día (30 días) y por asesor | Misma hoja |
| Enlaces rotos reportados | Hoja `Reportes` del Portal |

Detalle en [Referencia de datos](../tecnico/REFERENCIA-DE-DATOS.md).

**Úsalos así:** el volumen que ya está registrado es la frecuencia real. Si la hoja dice que el
equipo genera 40 cotizaciones al día, ese 40 es tu multiplicador — no una estimación.

---

## 6. Impacto que no se mide en horas

Vale mencionarlo, pero siempre después de las horas, nunca en lugar de ellas.

- **Consistencia de salida.** Todas las cotizaciones salen en el mismo formato, desde el mismo
  remitente institucional, con el mismo cálculo de descuentos.
- **Trazabilidad.** Cada cotización y cada correo queda registrado con folio, asesor, destinatario y
  resultado. Antes no había registro.
- **Autonomía.** El asesor deja de preguntar dónde está tal formato o cuál es la promoción vigente.
- **Menos error de captura.** El cálculo lo hace el sistema; el folio lo genera el sistema.

---

## 7. Cómo presentar esto

1. **Una sola cifra al frente.** La equivalencia en jornadas. Todo lo demás es respaldo.
2. **Muestra el AsIs → ToBe de una tarea**, la más reconocible. Que quien escucha se vea a sí mismo
   en el proceso viejo.
3. **Enseña el dato que ya está registrado**, no la estimación. El volumen real convence.
4. **Di qué falta.** Los hallazgos de seguridad abiertos son parte de la conversación honesta. Ver
   [Seguridad](../operacion/SEGURIDAD.md).
5. **Cierra con la fase que estás pidiendo**, no con la apertura total. Ver
   [Plan de adopción](../operacion/PLAN-DE-ADOPCION.md).
