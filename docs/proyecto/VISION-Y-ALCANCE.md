# Visión y alcance

Qué problema resuelve el Sistema Integral Ventel, qué hace hoy y qué deliberadamente no hace.
Léelo si vas a decidir sobre el proyecto, financiarlo, validarlo o entrar a colaborar.

---

## 1. El problema

Un asesor de Ventel abre su turno y necesita cuatro cosas que viven en cuatro lugares distintos:

- Los enlaces y accesos de las herramientas del área.
- Las promociones vigentes y sus fechas.
- Un formato de cotización que tiene que llenar a mano y exportar a PDF.
- Una plantilla de correo que copia de un documento y pega en Gmail.

Cada cambio de contexto cuesta minutos. Cada minuto se multiplica por asesor, por turno y por mes.
Y el resultado depende de que cada quien tenga la versión correcta del formato, del precio y del
texto.

**El costo real no es la lentitud. Es la inconsistencia**: dos asesores mandan la misma cotización
con dos formatos distintos, y la corrección la paga el cliente.

---

## 2. La visión

> Que un asesor abra una sola pantalla y desde ahí resuelva todo su día: consultar, cotizar,
> enviar y comprobar. Sin pedirle permiso a nadie y sin preguntarle a nadie cómo se hace.

Tres principios que ordenan cada decisión del proyecto:

- **Una sola puerta.** Antes eran tres herramientas separadas. Se homologaron en un solo sistema
  con una sola sesión y un solo diseño. Ver [ADR-0003](../decisiones/ADR-0003-HOMOLOGAR-TRES-HERRAMIENTAS-EN-UN-SOLO-SISTEMA.md).
- **Cero instalación.** Corre sobre la cuenta de Google que el asesor ya tiene. No hay software que
  instalar, ni servidor que administrar, ni licencia que comprar.
- **Que se use porque conviene, no porque se ordenó.** La adopción es gradual y por recomendación.
  Ver [Plan de adopción](../operacion/PLAN-DE-ADOPCION.md).

---

## 3. Qué hace hoy

### Portal Ventel — consulta, sin sesión

La pantalla de entrada. Concentra lo que el asesor consulta a diario:

- **Herramientas** — accesos del área con su descripción y cómo entrar.
- **Presentaciones, paqueterías, formatos y puntos de pago** — enlaces vivos, no capturas.
- **Plantillas de correo** — texto listo para copiar, con sus consideraciones.
- **Anuncios** — avisos del área en cuatro formatos: banner, destacado, tarjeta y modal.
- **Monitor de promociones** — promociones y Marketplace con vigencias, más el calendario comercial
  a 90 días.
- **Buscador global** — busca en todo lo anterior y lleva directo al resultado.
- **Botón Reportar** — cualquier enlace roto se reporta desde la tarjeta, sin escribir un correo.

### Sistema de cotizaciones — con sesión

- **Cotizar** — captura de productos con SKU, cantidad, precio, descuento público y descuento
  adicional. Calcula subtotal, IVA y total.
- **Folio automático** — formato `LVP-AAMMDD-NNNN`, consecutivo que se reinicia cada día.
- **Dos formatos de salida** — el formato propio del sistema (con fotos de producto) y el formato
  oficial CCL Liverpool, generado desde la plantilla de Google Sheets para conservar su fidelidad.
- **Envío por correo** — la cotización sale en PDF desde el alias institucional, con las respuestas
  dirigidas al asesor.
- **Correos a clientes** — plantillas (ticket, estado de cuenta, validación exitosa, formato, texto
  plano) que el asesor llena, revisa en pantalla y confirma antes de enviar.
- **Consulta de folio** — buscar cualquier cotización propia, con tolerancia a errores de dedo.

### Panel de supervisión — solo rol avanzado

- Todas las cotizaciones del área, con filtros y rango de fechas.
- Métricas de correos enviados: por tipo, por día, por asesor, con los últimos 20 envíos.
- Estado del sistema en pantalla, sin abrir el editor de Apps Script.
- Interruptores para habilitar o deshabilitar formatos de cotización.
- Constructor de anuncios del Portal.

---

## 4. Qué NO hace (y no está planeado que haga)

Decirlo explícito evita expectativas que después se cobran:

- **No lee correos.** Las pantallas de correo solo envían. Las respuestas del cliente llegan al
  buzón del asesor y al grupo del área.
- **No es un CRM.** No da seguimiento a la cotización después de enviarla, ni registra si el
  cliente compró.
- **No consulta inventario ni precios en tiempo real.** El precio lo captura el asesor.
- **No factura ni cobra.** Cotiza; el cierre pasa por los sistemas oficiales.
- **No sustituye a los sistemas institucionales.** Es una capa de productividad encima de ellos.
- **No maneja datos fuera del dominio de Google Workspace.** Ver [Seguridad](../operacion/SEGURIDAD.md).

---

## 5. Para quién es

| Perfil | Qué usa | Rol técnico |
|---|---|---|
| Asesor Ventel | Portal, cotizaciones, correos a cliente | Normal |
| Supervisora de área | Todo lo anterior + panel de supervisión y anuncios | Avanzado |
| Coordinación | Panel de supervisión, métricas, reportes | Avanzado |
| Responsable técnico | Editor de Apps Script, propiedades, despliegue | Administrador del script |

El rol se define en la columna `Avanzado` de la hoja `Registros`. Ver
[Referencia de datos](../tecnico/REFERENCIA-DE-DATOS.md).

---

## 6. Restricciones que condicionan el diseño

Estas no se eligieron: vienen dadas y explican por qué el sistema es como es.

- **Sin servidor propio ni presupuesto de infraestructura.** De ahí Google Apps Script.
  Ver [ADR-0001](../decisiones/ADR-0001-GOOGLE-APPS-SCRIPT-COMO-PLATAFORMA.md).
- **Sin base de datos administrada.** De ahí Google Sheets.
  Ver [ADR-0002](../decisiones/ADR-0002-GOOGLE-SHEETS-COMO-BASE-DE-DATOS.md).
- **Cuotas de Apps Script.** Tiempo de ejecución, envíos de correo y llamadas a servicios tienen
  tope diario. Por eso existe la capa de caché.
  Ver [ADR-0005](../decisiones/ADR-0005-CACHE-INVALIDADA-POR-ESCRITURA.md).
- **Un solo desarrollador.** El código privilegia claridad sobre elegancia: comentarios en español,
  nombres largos, y ninguna abstracción que no se pague sola.
- **Los datos son confidenciales.** PII de clientes, precios y descuentos. Esto marca el techo de
  lo que se puede liberar sin cerrar los hallazgos de seguridad abiertos.

---

## 7. Estado actual

**Versión 0.9 — Pruebas de control.** El sistema funciona de punta a punta y está en manos de un
grupo reducido. No está abierto a toda la operación.

Lo que falta para liberar, en orden:

1. Cerrar los tres hallazgos críticos del [informe de seguridad](../../INFORME-SEGURIDAD.md).
2. Terminar la validación funcional con el grupo semilla.
3. Escalar a coordinación y gerencia para el visto bueno de apertura.
4. Abrir por fases, según el [plan de adopción](../operacion/PLAN-DE-ADOPCION.md).

---

## 8. Historia corta

- **Mayo 2025** — arranca el desarrollo. Tres herramientas separadas: portal, cotizador y correos.
- **2025–2026** — se homologan en un solo sistema, con una sesión y un sistema de diseño único.
- **Julio 2026** — versión 0.9. Se levanta la revisión de seguridad y se documenta el proyecto
  completo.
