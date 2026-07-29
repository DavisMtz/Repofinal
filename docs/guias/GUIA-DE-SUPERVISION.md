# Guía de supervisión

El Panel de Supervisión: qué muestra, cómo se lee y qué puedes controlar desde ahí. Para quien tiene
rol avanzado — supervisión y coordinación.

Todo lo de la [Guía de usuario](GUIA-DE-USUARIO.md) también aplica para ti. Esto es lo que tienes
**de más**.

---

## Cómo se entra

Entras con tu correo y contraseña, igual que cualquier asesor. Si tu cuenta tiene rol avanzado, el
sistema te manda directo al **Panel de Supervisión** en lugar del Dashboard normal.

El rol avanzado se activa poniendo `Si` en la columna `Avanzado` de la hoja `Registros`. Lo hace el
responsable técnico. No hay pantalla para autoasignárselo.

> Si entraste y ves el Dashboard normal, tu cuenta todavía no tiene el rol. Pídelo.

---

## Los indicadores de arriba

Cuatro números que resumen el mes:

| Indicador | Qué te dice |
|---|---|
| **Cotizaciones este Mes** | Cuántas se generaron en el mes en curso. Al lado va la comparación contra el mes anterior. |
| **Monto Cotizado (Mes)** | La suma de los totales del mes actual. |
| **Asesores activos** | Cuántas personas distintas generaron al menos una cotización este mes. |
| **Correos enviados** | Total de envíos registrados, con el desglose de exitosos y con error. |

Debajo hay dos gráficas:

- **Actividad Últimos 7 Días** — cotizaciones por día.
- **Actividad de Hoy** — lo generado en la jornada.
- **Cotizaciones por Asesor (Mes Actual)** — el ranking del mes.

---

## Supervisión de cotizaciones

La tabla con **todas** las cotizaciones del sistema, no solo las tuyas.

Columnas: folio, fecha, asesor, cliente, total, formato y estatus.

### Filtros

- **Buscar** — folio, asesor o cliente.
- **Desde / Hasta** — rango de fechas.
- **Estatus** — todos, o solo uno.

Los filtros se aplican en tu navegador, así que responden al instante.

### Descargar Reporte (CSV)

Baja lo que estás viendo **con los filtros ya aplicados**. Si filtraste de julio a la fecha y por un
asesor, eso es lo que se descarga.

Ábrelo con Google Sheets o Excel. Sirve para el reporte mensual sin consolidar nada a mano.

### Acciones por fila

- **Editar** — abre la cotización.
- **Reenviar** — te lleva a la pantalla de envío con el folio cargado.

---

## Métricas de Correos

Aquí se ve la actividad real de envío, de los dos canales: cotizaciones con PDF y correos de
plantilla.

| Bloque | Qué muestra |
|---|---|
| **Total / Exitosos / Con error** | El estado de todos los envíos registrados. |
| **Por tipo de correo** | Cuántos de cotización y cuántos de cada plantilla. |
| **Envíos por día (últimos 14)** | La tendencia. |
| **Top asesores por envíos** | Quién manda más, con su tasa de éxito. |
| **Últimos envíos** | Los 20 más recientes, con fecha, tipo, referencia, asesor, destinatario, asunto y resultado. |

**Cómo leerlo:** un envío "con error" no significa que el asesor hizo algo mal. Casi siempre es un
correo de cliente mal escrito o un tope de cuota de Gmail. Revisa la columna de detalle antes de
sacar conclusiones.

Estas métricas se guardan 10 minutos en memoria. Si acabas de mandar un correo y no aparece,
recarga en un rato.

---

## Formatos de Cotización

El bloque de interruptores. Controla con qué formatos puede cotizar el área.

- **Actual** — el formato del sistema, con fotos de producto.
- **CCL Liverpool** — el formato oficial, generado desde la plantilla de Google Sheets.

Apagar un formato lo quita del selector de **todos** los asesores de inmediato. Las cotizaciones ya
guardadas con ese formato no se tocan.

**Siempre tiene que quedar al menos uno encendido.** Si intentas apagar el último, el sistema te lo
impide: dejaría al área sin forma de imprimir.

Si un formato aparece con la nota **"No se puede usar todavía"**, no es que esté apagado: es que su
plantilla no está accesible. El mensaje dice exactamente qué falta. Pásalo tal cual al responsable
técnico.

---

## Estado del sistema

Desde el panel puedes correr la revisión completa sin abrir el editor de Apps Script. Revisa:

- Acceso a las dos bases de datos —la de Cotizaciones y la del Portal— y que sus columnas estén
  completas.
- Que los formatos de cotización se puedan generar.
- Que el alias de correo institucional esté dado de alta.
- Que el calendario de promociones responda.
- Que la caché funcione.
- Que los secretos ya estén en las propiedades del script y no en el código.

Cada línea sale con ✔ o ✖. **Una línea con ✖ dice exactamente qué se rompió.** Cópiala y pásala al
responsable técnico; con eso se resuelve sin adivinar.

Cuándo correrla: después de cualquier cambio en las hojas, después de un redespliegue, o cuando
alguien reporte algo raro y no sepas por dónde empezar.

---

## Publicar anuncios

El **Constructor de Anuncios** también es de rol avanzado. Tiene su propio documento:
[Manual de anuncios](MANUAL-DE-ANUNCIOS.md).

---

## Lo que el panel NO hace

- **No modifica cotizaciones de otros a tu nombre.** Si editas, la cotización sigue siendo del
  asesor que la creó.
- **No borra cotizaciones.** No hay botón de borrar, a propósito.
- **No cambia roles.** El rol avanzado se da en la hoja `Registros`.
- **No manda correos masivos.** Cada envío es uno a uno, con máximo 3 destinatarios.

---

## Qué mirar cada semana

Una rutina corta que se hace en cinco minutos:

1. **Cotizaciones del mes contra el mes anterior.** ¿La tendencia va donde debe?
2. **Asesores activos.** Si el número no crece, la adopción está estancada —
   ver [Plan de adopción](../operacion/PLAN-DE-ADOPCION.md).
3. **Correos con error.** Si suben de golpe, algo se rompió.
4. **Hoja de Reportes del Portal.** Los enlaces rotos que la gente reportó. Arréglalos ahí mismo en
   la hoja.
5. **Estado del sistema.** Que no haya ✖.

Para convertir esto en la cifra que se presenta a jefatura, usa
[Impacto operativo](../proyecto/IMPACTO-OPERATIVO.md).
