# Bitácora de cambios

Qué cambió en cada versión del Sistema Integral Ventel. Consúltala para saber qué trae la versión
que está corriendo, o para ubicar cuándo entró un comportamiento.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el versionado sigue
[Versionado Semántico](https://semver.org/lang/es/).

**Lo más reciente va arriba.**

---

## Cómo se numera

`MAYOR.MENOR.PARCHE`

| Parte | Sube cuando |
|---|---|
| **MAYOR** | Un cambio rompe algo: estructura de hojas, contrato de una función, o hay que migrar datos. |
| **MENOR** | Entra funcionalidad nueva sin romper lo anterior. |
| **PARCHE** | Corrección de fallas y mejoras internas. |

**La 1.0 llega cuando el sistema esté liberado a producción**, con los hallazgos críticos de
seguridad cerrados. Mientras tanto se mantiene en `0.x`. Ver [Seguridad](../operacion/SEGURIDAD.md).

### Tipos de cambio

`Agregado` · `Cambiado` · `Obsoleto` · `Eliminado` · `Corregido` · `Seguridad`

---

## [Sin publicar]

### Agregado

- Documentación completa del proyecto en `docs/`, dividida por audiencia: guías de uso, referencia
  técnica, operación, decisiones de arquitectura y contribución.
- Siete registros de decisión de arquitectura (ADR) con el contexto y las consecuencias de las
  decisiones estructurales del proyecto.
- `EQUIPO-Y-ROLES.md` con los responsables del proyecto y la matriz de responsabilidades.
- `OPORTUNIDADES-DE-MEJORA.md`: revisión de experiencia de usuario sobre los cuatro flujos del
  sistema, con recomendaciones priorizadas por relación valor/esfuerzo y las que conviene descartar.
- `CATALOGO-DE-METRICAS.md`: inventario de 91 métricas en cuatro niveles según lo que cuesta
  llegar al dato, los nueve frenos técnicos que lo limitan y la arquitectura de medición que los
  resuelve (hoja `Eventos`, escritura por lote y consolidado nocturno).

---

## [0.9] — Julio 2026 · *Pruebas de control*

Versión en manos del grupo semilla. **No liberada a producción abierta.**

### Agregado

- **Panel de supervisión** con indicadores del mes, actividad por día, cotizaciones por asesor y
  descarga de reporte en CSV con los filtros aplicados.
- **Métricas de correos** unificadas para los dos canales —cotizaciones con PDF y correos de
  plantilla— en la hoja `MetricasCorreos`. Resumen por tipo, por día y por asesor.
- **Constructor de Anuncios** (`anuncios.html`) con cuatro formatos —banner, destacado, tarjeta y
  modal—, vista previa en vivo, programación por fechas y control de orden. Ver
  [ADR-0007](../decisiones/ADR-0007-ANUNCIOS-COMO-PUBLICACIONES-JSON.md).
- **Formato de cotización CCL Liverpool**, generado desde la plantilla de Google Sheets para
  conservar la fidelidad del formato oficial. Con interruptores para habilitar y deshabilitar
  formatos desde el panel.
- **Correos a clientes** con seis plantillas, vista previa en vivo, ventana de verificación antes de
  enviar y adjuntos.
- **Monitor de Promociones** con promociones, Marketplace y calendario comercial a 90 días.
- **Buscador global del Portal**, con enlace directo a plantillas de correo ya seleccionadas.
- **Botón Reportar** en las tarjetas del Portal, con tope de 20 reportes por usuario por hora.
- **Estado del sistema en pantalla** para rol avanzado, sin abrir el editor de Apps Script.
- **Importación desde la extensión de Chrome** *Ventel Extractor de Bolsa*, pegando el JSON que
  genera.
- **Preferencias de vista compartidas** entre app y Portal: tres temas, densidad, escala de texto y
  alto contraste.
- **Modal de soporte**, en sustitución de los enlaces `mailto` del pie de página.
- **`revisionMaestra()`** — diagnóstico completo del sistema en una sola ejecución.
- **`verificarVersionDelCodigo()`** — detecta archivos `.gs` duplicados que hacen ganar código
  viejo en silencio.

### Cambiado

- **Las tres herramientas se homologaron en un solo sistema**, con una URL, una sesión y un sistema
  de diseño. Ver
  [ADR-0003](../decisiones/ADR-0003-HOMOLOGAR-TRES-HERRAMIENTAS-EN-UN-SOLO-SISTEMA.md).
- **Capa única de identidad** en `Seguridad.gs`. `isAdvancedUser`, `portalGateAvanzado_` y
  `metVerificarAsesor_` ahora delegan en una sola definición. Antes cada una comparaba distinto.
  Ver [ADR-0004](../decisiones/ADR-0004-CAPA-UNICA-DE-IDENTIDAD.md).
- **Capa única de caché** con invalidación por escritura. Ver
  [ADR-0005](../decisiones/ADR-0005-CACHE-INVALIDADA-POR-ESCRITURA.md).
- **Las filas se arman por nombre de columna, no por posición.** Antes, insertar o mover una columna
  desalineaba en silencio todas las cotizaciones nuevas.
- **Tipografía reducida de tres familias a dos**: Inter para toda la interfaz —con eje óptico
  14..32— y JetBrains Mono para folios y claves. La jerarquía la hace el peso.
- **Sistema de iconos unificado**: lienzo 24×24, trazo 1.6, `currentColor`. Antes cada pantalla
  incrustaba SVG con geometrías dispares.
- **Pantallas de acceso rediseñadas.** El rosa vuelve a ser acento y no fondo; el isotipo de
  Liverpool se dibuja a trazo y sirve de marca, sello e indicador de carga.
- **Los parámetros de navegación se inyectan al renderizar** en lugar de pedirse por red. El iframe
  del sandbox no siempre conserva el query string, y pedirlos por red dejaba la navegación colgada
  cuando fallaba.
- **Los correos se validan antes de generar el PDF.** Antes se descubría el correo mal escrito
  después de minuto y medio de trabajo.

### Corregido

- **"Guardé la cotización y sigue saliendo la anterior."** Resuelto con la invalidación por
  escritura.
- **Quien se registraba con mayúsculas no podía volver a entrar.** Los correos se normalizan al
  guardar y al comparar.
- **Se perdían las fórmulas** de columnas ajenas al actualizar una cotización. Ahora se releen con
  `getFormulas()` y se reescribe la fórmula, no su resultado.
- **Se borraba el enlace del PDF** al actualizar sin uno nuevo. Ahora `LinkPDF` solo se escribe si
  llega valor.
- **El loader pintaba medio isotipo con el color invertido** — se coloreaba por par/impar en lugar
  de por islas.
- **El loader no animaba en algunas vistas** por falta de MorphSVGPlugin.
- **Los fallos al renderizar mostraban la pantalla amarilla de Apps Script.** Ahora `doGet` sirve
  una pantalla de error legible.

### Seguridad

- **Freno de fuerza bruta** en el login: 8 intentos por correo en 15 minutos. El contador vive en
  caché, se limpia solo y no ensucia la hoja.
- **Comparación de hashes en tiempo constante.**
- **Mensajes de error de login genéricos**, que no revelan si un correo existe.
- **`LockService`** en la generación de folios, contra condiciones de carrera.
- **Escapado de HTML consistente** en cliente y servidor, con contextos distinguidos.
- **Validación de destinatarios y adjuntos**: formato, cantidad y tamaño acotados.
- **Tope de reportes** de enlace roto: 20 por usuario por hora. Es la única escritura abierta del
  Portal.
- **CDN de Tailwind retirado**, sustituido por CSS compilado local. Ver
  [ADR-0006](../decisiones/ADR-0006-TAILWIND-COMPILADO-EN-LUGAR-DE-CDN.md).
- **Infraestructura de gestión de secretos** construida: `secConfig_`,
  `secGuardarConfiguracion()` y verificación automática en `Admin.gs`.

### Riesgos abiertos

Documentados en el [informe de seguridad](../../INFORME-SEGURIDAD.md) del 28 de julio de 2026.
**22 hallazgos: 3 críticos, 6 altos, 7 medios y 6 bajos.**

- **C-01** — La migración de secretos a propiedades del script **está construida pero no se ha
  ejecutado.** La sal y el webhook siguen en el código.
- **C-02** — La identidad la declara el navegador. Permite suplantación y elevación de privilegio.
  **Bloqueante.**
- **C-03** — El HTML de los correos llega armado desde el cliente. Permite envío arbitrario desde el
  alias corporativo.

**Esta versión no debe abrirse a producción hasta cerrar la Fase 1** del
[plan de seguridad](../operacion/SEGURIDAD.md).

---

## [0.x] — Mayo 2025 a 2026

Desarrollo inicial, previo a la homologación. No hay registro versionado de esta etapa; lo que se
sabe está reconstruido del historial del repositorio y de los comentarios del código.

- **Mayo 2025** — arranca el desarrollo. Portal, cotizador y correos como herramientas separadas.
- **2025–2026** — cada herramienta evoluciona por su cuenta, con su propia sesión y su propio
  aspecto.
- **2026** — coordinación recomienda homologarlas. Empieza la fusión que da la versión 0.9.

---

## Cómo se escribe una entrada

1. **Todo cambio se anota en `[Sin publicar]`**, en el mismo movimiento que el código.
2. Al liberar, `[Sin publicar]` se convierte en la versión nueva con su fecha, y se abre un
   `[Sin publicar]` vacío.
3. **Escribe para quien usa el sistema, no para quien lo programó.**

```markdown
### Corregido
❌ Arreglado bug en getQuotesForUser
✅ "Guardé la cotización y sigue saliendo la anterior." Resuelto con la
   invalidación por escritura.
```

4. Si el cambio rompe algo, ponlo **al principio** de su sección y di qué hay que hacer.
5. Enlaza al ADR cuando la entrada explique una decisión, no solo un cambio.
