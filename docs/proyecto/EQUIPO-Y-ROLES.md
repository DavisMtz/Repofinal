# Equipo y roles

Quién participa en el Sistema Integral Ventel y de qué responde cada quien. Léelo si necesitas
saber a quién buscar para una decisión, una validación o un permiso.

Este documento se actualiza cuando alguien entra, sale o cambia de responsabilidad. No es un
organigrama del área: describe la participación **en este proyecto**.

---

## El equipo

### David Martínez — Autor y responsable técnico

**Área:** Ventel · Centro de Contacto Liverpool
**Responde de:** todo el ciclo técnico del sistema.

- Diseño, desarrollo y mantenimiento del código completo (backend, frontend y sistema de diseño).
- Arquitectura y decisiones técnicas.
- Despliegue, configuración y respuesta a incidentes.
- Documentación.

Punto de contacto para cualquier falla, cambio o duda técnica.

---

### Jorge Armando Alcaraz López — Patrocinador operativo y mentor de implementación

**Cargo:** Coordinador de las áreas Ventel, Confirmaciones y Centros de Servicio.
**Responde de:** que el proyecto tenga camino dentro de la organización.

Es el pilar de la estrategia de implementación. Su aportación:

- **Dirección de producto.** La decisión de dejar de mantener tres herramientas separadas y
  homologarlas en un solo sistema salió de él. Es la decisión estructural más importante que ha
  tomado el proyecto — quedó registrada en
  [ADR-0003](../decisiones/ADR-0003-HOMOLOGAR-TRES-HERRAMIENTAS-EN-UN-SOLO-SISTEMA.md).
- **Ruta de validación.** Define hacia quién se escala, en qué orden y con qué argumento.
- **Mentoría.** Acompaña cómo presentar el proyecto ante jefatura y ante las áreas que tienen que
  dar el visto bueno.
- **Gestión de agenda.** Coordina las reuniones con las personas clave de cada etapa.

---

### Yunuen Giselle Alvarado Chávez — Validación funcional y enlace operativo

**Cargo:** Supervisora del área Ventel. Supervisora directa del autor.
**Responde de:** que lo que se construye sirva en piso y que el proyecto tenga condiciones para
avanzar.

- **Punto de validación.** Revisa las herramientas y da opinión y retroalimentación antes de que
  algo se abra a más gente. Es el filtro previo a cualquier liberación.
- **Facilitación operativa.** Gestiona los tiempos y las condiciones para que el desarrollo y las
  reuniones con coordinación puedan ocurrir sin chocar con la operación.
- **Coordinación de reuniones.** Convoca y da seguimiento para que las sesiones de validación
  sucedan.
- **Impulso.** Sostiene el proyecto en la parte que no es técnica y sí es decisiva.

---

### Élida Alejandra Castro Guillén — Aportación funcional

**Cargo:** Supervisora del área Ventel.
**Responde de:** aportar la mirada del área sobre qué debería hacer el sistema.

- **Origen del módulo de Anuncios.** La idea de que el Portal publicara avisos del área —hoy una de
  las funciones principales del sistema, con cuatro formatos y su propio constructor— es suya. Ver
  [Manual de anuncios](../guias/MANUAL-DE-ANUNCIOS.md).
- **Aportación de ideas** sobre funcionalidades y prioridades.
- **Apoyo en la gestión** del avance del proyecto.

---

## Quién decide qué

Tabla de responsabilidades. **R** = responsable de hacerlo · **A** = aprueba · **C** = se consulta ·
**I** = se le informa.

| Decisión o actividad | David M. | Jorge A. | Yunuen A. | Élida C. |
|---|:--:|:--:|:--:|:--:|
| Arquitectura y decisiones técnicas | **R/A** | I | I | I |
| Alcance funcional (qué se construye) | R | **A** | C | C |
| Nuevas ideas de funcionalidad | R | C | C | **C** |
| Validación funcional antes de liberar | R | C | **A** | C |
| Ruta de escalamiento y presentación a jefatura | C | **R/A** | C | I |
| Agenda de reuniones de validación | C | R | **R** | I |
| Apertura de una fase de adopción | R | **A** | **A** | I |
| Configuración, secretos y despliegue | **R/A** | I | I | — |
| Respuesta a incidentes | **R** | I | I | I |
| Publicación de anuncios en el Portal | C | R | **R** | **R** |
| Cierre de hallazgos de seguridad | **R** | A | I | I |

---

## Agradecimientos

Gente que ha empujado el proyecto sin tener un rol formal en él.

- **David Gary Bayo Orozco** — por el apoyo en la coordinación de una de las reuniones clave del
  proyecto. Sin esa gestión, la conversación con las áreas que validan habría tardado semanas más.

---

## Cómo se entra al equipo

El proyecto está abierto a que más gente participe. La participación se registra aquí cuando es
sostenida y verificable, no por asistir a una reunión.

Tres formas de sumarse:

1. **Aportación funcional** — proponer o afinar una funcionalidad que termina construida.
2. **Validación** — probar de forma sistemática y devolver retroalimentación accionable.
3. **Contribución técnica** — código o documentación. Ver
   [Guía de contribución](../contribuir/GUIA-DE-CONTRIBUCION.md).

Si aportaste algo y no aparece aquí, avísale al responsable técnico. Se corrige.

---

## Notas sobre este documento

- Los cargos son los vigentes a la fecha de la última revisión (29 de julio de 2026).
- Cuando alguien deja de participar, no se borra: se mueve a **Agradecimientos** con el periodo en
  que colaboró. Lo que se aportó no se deshace.
- La gerencia del área aún no tiene participación formal en el proyecto. Cuando la tenga, entra en
  la tabla como aprobador de apertura general.
