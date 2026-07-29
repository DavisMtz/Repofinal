# ADR-0002 — Google Sheets como base de datos

| | |
|---|---|
| **Estado** | Aceptada |
| **Fecha** | Mayo 2025 |
| **Decide** | David Martínez |

## Contexto

Con Google Apps Script como plataforma ([ADR-0001](ADR-0001-GOOGLE-APPS-SCRIPT-COMO-PLATAFORMA.md)),
había que decidir dónde viven los datos: usuarios, cotizaciones, detalle de productos, métricas y el
contenido del Portal.

Dos cosas pesaban además de lo técnico:

- **El contenido del Portal lo administra gente del área, no el desarrollador.** Herramientas,
  formatos, plantillas y promociones cambian seguido y los actualiza quien los conoce.
- **Los datos tenían que ser auditables sin herramientas.** Supervisión necesita poder abrir la
  información y verla, sin pedirle un reporte a nadie.

## Decisión

Los datos viven en **Google Sheets**, en dos archivos separados:

| Base | Cómo se abre | Qué guarda |
|---|---|---|
| **BD de Cotizaciones** | Hoja **ligada** al script | Usuarios, cotizaciones, detalle, métricas, bitácora |
| **Hoja del Portal** | **Por ID**, en propiedad de script | Contenido del Portal, promociones, anuncios, reportes |

Y una regla que aplica a todo el código: **las columnas se localizan por nombre, nunca por
posición.**

## Alternativas descartadas

**Firebase / Firestore.**
Base de datos de verdad, con tiempo real. Pero saca los datos del tenant de Google Workspace hacia
un proyecto de Google Cloud, y para PII de clientes eso abre una conversación de gobierno de datos
que el proyecto no podía sostener en su etapa inicial. Además, supervisión perdería la posibilidad
de abrir los datos y verlos.

**Base SQL externa.**
Requiere servidor, credenciales y administración. Todo lo que [ADR-0001](ADR-0001-GOOGLE-APPS-SCRIPT-COMO-PLATAFORMA.md)
descartó.

**Propiedades del script como almacén.**
Sirven para configuración, no para datos. Tope de tamaño bajo y sin forma de consultar.

**Una sola hoja para todo.**
Se descartó a propósito: el contenido del Portal lo edita gente del área, y no debe compartir
archivo con la base que guarda PII de clientes. La separación es de seguridad, no de orden.

## Consecuencias

**A favor**

- **Cualquiera del área puede editar contenido** sin tocar código ni pedirle nada al desarrollador.
- **Auditable a simple vista.** Supervisión abre la hoja y ve los datos.
- **Respaldo e historial gratis.** Google Sheets guarda versiones.
- **Permisos por archivo**, con el modelo de Drive que la organización ya usa.
- **Cero costo y cero administración.**
- **Exportar es trivial.** CSV, Excel, lo que se necesite.

**En contra**

- **No hay transacciones.** Dos escrituras simultáneas al mismo folio pueden pisarse. Se mitiga con
  `LockService` en la generación de folios, pero no está resuelto en general.
- **No hay tipos.** Un número puede llegar como texto. Todo el código convierte a la defensiva.
- **No hay índices.** Las lecturas leen la hoja completa. Es la razón principal de que exista la
  caché.
- **No hay integridad referencial.** Nada impide que quede detalle huérfano si alguien borra una
  fila de `Cotizaciones` a mano.
- **Se rompe al renombrar una columna.** Reordenar o insertar está bien; renombrar no.
- **El costo crece con el histórico.** Llegado un punto habrá que archivar por año.
- **Editable a mano.** La misma flexibilidad que la hace útil la hace frágil.

**Qué obliga a hacer**

- **Localizar columnas por nombre**, siempre. Insertar o mover una columna no debe desalinear nada
  en silencio.
- **Preservar fórmulas y columnas ajenas** al actualizar una fila. Si una celda tiene fórmula, se
  relee con `getFormulas()` y se reescribe la fórmula, no su resultado.
- **Auto-crear columnas** que puedan faltar (`Formato`, `ImagenUrl`) en lugar de fallar.
- **Validar la estructura** antes de escribir: si al armar una fila se localizan menos de 5 columnas
  por nombre, se lanza error explícito.
- **Caché en toda lectura.** Ver [ADR-0005](ADR-0005-CACHE-INVALIDADA-POR-ESCRITURA.md).
- **Búsqueda flexible de encabezado** en las hojas del Portal, que edita gente del área: el código
  busca que el nombre *contenga* cierta palabra, así `Liga`, `LIGA`, `Enlace`, `Link` y `URL`
  funcionan igual.
- **`revisionMaestra()`** verifica que las columnas requeridas existan.

## Cuándo revisar esto

Cuando el histórico haga las lecturas inviables incluso con caché, cuando aparezcan colisiones de
escritura en el uso real, o cuando el sistema salga del piloto y la organización asigne una base de
datos administrada.

La migración natural sería a Firestore conservando Sheets como vista de solo lectura para el área,
pero eso es un ADR nuevo, no una edición de este.
