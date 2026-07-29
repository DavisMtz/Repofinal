# ADR-0007 — Anuncios como publicaciones en JSON

| | |
|---|---|
| **Estado** | Aceptada |
| **Fecha** | 2026 |
| **Decide** | David Martínez |
| **Origen de la idea** | Élida Alejandra Castro Guillén (supervisión Ventel) |

## Contexto

La primera versión de los avisos del Portal era una hoja `Avisos` con tres columnas: `Mensaje`,
`Tipo` y `Hasta`. Servía para una franja de texto y nada más.

La propuesta del área fue que el Portal se volviera el canal oficial de comunicación interna: no
solo una franja, sino avisos con imagen, con botón, con detalle — cosas que se ven distinto según
qué tan importantes son.

El problema de diseño era concreto: **cada formato de aviso necesita campos distintos.** Un banner
necesita mensaje y tono. Una tarjeta necesita título, descripción, imagen y botón. Un modal necesita
todo eso más el cuerpo.

Con el enfoque de una columna por campo, agregar un formato significaba agregar columnas a la hoja —
y las columnas que un formato no usa quedan vacías en todas sus filas. Con cuatro formatos, la hoja
se convierte en un tablero mayormente vacío que nadie quiere editar.

## Decisión

Cada anuncio es **una fila** de la hoja `Anuncios`, con las columnas de control fijas y **el
contenido en JSON** en una sola columna.

| Columna | Qué es |
|---|---|
| `ID` | `anc-<base36>`, generado |
| `Formato` | `banner` · `destacado` · `tarjeta` · `modal` |
| `Activo` | Se ve o no |
| `Orden` | Menor sube |
| `Desde` | Publicación programada |
| `Hasta` | Expiración, **inclusiva de todo su día** |
| `Datos (JSON)` | **El contenido** |
| `Autor` | Quién publicó |
| `Creado` | Cuándo |

Y como la hoja deja de ser editable a mano de forma cómoda, se construye una pantalla dedicada:
**`anuncios.html`**, el Constructor de Anuncios, con vista previa en vivo.

## Alternativas descartadas

**Una columna por campo.**
Con cuatro formatos que no comparten campos, la hoja se llena de columnas vacías. Y cada formato
nuevo obliga a tocar la estructura de la hoja.

**Una hoja por formato.**
Cuatro hojas que leer, ordenar y mezclar por prioridad. Más código y más lugares donde equivocarse
al editar.

**Solo un formato, más rico.**
Se pensó. Pero el formato **es** parte del mensaje: un modal y una tarjeta comunican urgencias
distintas. Unificarlos habría quitado justo lo que hacía útil la idea.

**Dejar que se edite la hoja a mano.**
Editar JSON a mano en una celda de Google Sheets es una fuente garantizada de comillas rotas. De ahí
el constructor.

## Consecuencias

**A favor**

- **Un formato nuevo no toca la hoja.** Se agrega a la lista de formatos válidos y se le dan campos
  en el constructor.
- **Cada formato usa solo sus campos.** Sin columnas vacías.
- **Programación y expiración de fábrica**, con las tres condiciones de visibilidad claras.
- **Autoría registrada.** La columna `Autor` dice quién publicó qué.
- **Compatibilidad hacia atrás.** La hoja `Avisos` se sigue leyendo y sus filas se convierten a
  formato `banner`, con orden 1000+ para que queden debajo de lo nuevo. Nada se rompió al migrar.
- **El constructor valida** el formato, arma el JSON y limpia la caché. El área publica sin tocar la
  hoja.
- **Vista previa en vivo:** se ve exactamente cómo va a quedar antes de publicar.

**En contra**

- **El JSON no se puede consultar desde la hoja.** No hay forma de filtrar "todos los anuncios con
  botón" con una fórmula.
- **Editar a mano es frágil.** Un JSON mal formado deja el anuncio sin contenido. **Se degrada, no
  se cae** —el Portal sigue funcionando— pero el anuncio sale vacío.
- **La estructura del JSON no está validada por la hoja.** El contrato vive en el código y en la
  [Referencia de datos](../tecnico/REFERENCIA-DE-DATOS.md).
- **Hay que mantener el constructor.** Un formato nuevo implica agregarle campos.
- **Doble lectura mientras exista `Avisos`.** Deuda a saldar migrando lo que quede.

**Qué obliga a hacer**

- **Un JSON roto nunca tumba el Portal.** Si `JSON.parse` falla, el anuncio sale con datos vacíos.
- **Un formato desconocido se ignora en silencio**, no rompe la lectura.
- **Publicar, borrar, activar y mover invalidan la caché del Portal.** Si no, el cambio no se ve
  hasta 10 minutos después.
- **Todas las funciones de escritura de anuncios exigen rol avanzado**, con
  `portalGateAvanzado_()`.
- **Lo que venga del constructor y vaya a HTML tiene que escaparse.** Hoy hay un punto ciego en el
  escapado de atributos (hallazgo M-06 del [informe de seguridad](../../INFORME-SEGURIDAD.md)).
  **Al tocar esta parte, ciérralo.**

## Cuándo revisar esto

Si los anuncios llegan a necesitar consultas sobre su contenido —"cuántos anuncios con botón se
publicaron este mes"—, o si el volumen crece hasta que la hoja deje de ser el lugar adecuado. En ese
caso lo natural es mover los anuncios a una colección de verdad y dejar la hoja como vista.
