# Documentación · Sistema Integral Ventel

Todo lo que hay que saber sobre el Sistema Integral Ventel, ordenado por a quién le sirve.
Si vas llegando, empieza por [Visión y alcance](proyecto/VISION-Y-ALCANCE.md).

**Sistema Integral Ventel** — el sistema interno del Centro de Contacto Liverpool que junta en una
sola herramienta el Portal de consulta, la generación de cotizaciones, el envío de correos a
clientes y el panel de supervisión.

| Dato | Valor |
|---|---|
| Versión documentada | 0.9 — *Pruebas de control* |
| Plataforma | Google Apps Script (V8) + Google Sheets |
| Zona horaria | `America/Mexico_City` |
| Estado | Piloto controlado. **No liberado a producción abierta** — ver [Seguridad](operacion/SEGURIDAD.md) |
| Última revisión de esta documentación | 29 de julio de 2026 |

---

## Encuentra lo que buscas

### Vas a usar la herramienta

| Documento | Para qué sirve |
|---|---|
| [Guía de usuario](guias/GUIA-DE-USUARIO.md) | Cotizar, consultar folios y mandar correos, paso a paso. |
| [Guía de supervisión](guias/GUIA-DE-SUPERVISION.md) | Panel avanzado: métricas, reportes y control de formatos. |
| [Manual de anuncios](guias/MANUAL-DE-ANUNCIOS.md) | Publicar avisos en el Portal sin tocar la hoja de cálculo. |
| [Preguntas frecuentes](guias/PREGUNTAS-FRECUENTES.md) | Lo que más se pregunta, respondido en una línea. |

### Vas a mantener el código

| Documento | Para qué sirve |
|---|---|
| [Arquitectura técnica](tecnico/ARQUITECTURA-TECNICA.md) | Cómo está armado el sistema y por qué. |
| [Referencia de datos](tecnico/REFERENCIA-DE-DATOS.md) | Cada hoja, cada columna, qué escribe y qué lee. |
| [Referencia de funciones](tecnico/REFERENCIA-DE-FUNCIONES.md) | El API que el navegador puede llamar. |
| [Sistema de diseño](tecnico/SISTEMA-DE-DISENO.md) | Tokens, temas, iconos y animación. |
| [Guía de despliegue](tecnico/GUIA-DE-DESPLIEGUE.md) | Cómo dejar el sistema corriendo desde cero. |

### Vas a operar o decidir sobre el proyecto

| Documento | Para qué sirve |
|---|---|
| [Visión y alcance](proyecto/VISION-Y-ALCANCE.md) | Qué problema resuelve, qué sí hace y qué no. |
| [Equipo y roles](proyecto/EQUIPO-Y-ROLES.md) | Quién participa y de qué responde cada quien. |
| [Impacto operativo](proyecto/IMPACTO-OPERATIVO.md) | Cómo se mide el ahorro en horas. |
| [Oportunidades de mejora](proyecto/OPORTUNIDADES-DE-MEJORA.md) | Qué falta en flujos, interacción y experiencia de uso, priorizado. |
| [Catálogo de métricas](proyecto/CATALOGO-DE-METRICAS.md) | Todo lo que se puede medir, qué cuesta cada nivel y qué lo frena. |
| [Plan de adopción](operacion/PLAN-DE-ADOPCION.md) | Las fases de liberación, del grupo semilla al resto. |
| [Runbook](operacion/RUNBOOK.md) | Qué hacer cuando algo se rompe. |
| [Seguridad](operacion/SEGURIDAD.md) | Riesgos abiertos y qué falta antes de producción. |
| [Glosario](proyecto/GLOSARIO.md) | Los términos del proyecto, definidos. |

### Vas a contribuir

| Documento | Para qué sirve |
|---|---|
| [Guía de contribución](contribuir/GUIA-DE-CONTRIBUCION.md) | Cómo proponer y entregar un cambio. |
| [Estándares de código](contribuir/ESTANDARES-DE-CODIGO.md) | Cómo se escribe código en este proyecto. |
| [Bitácora de cambios](contribuir/BITACORA-DE-CAMBIOS.md) | Qué cambió en cada versión. |
| [Decisiones de arquitectura](decisiones/README.md) | Por qué el sistema es como es, decisión por decisión. |

---

## Cómo está organizada esta documentación

La división es **por audiencia, no por módulo**. Nadie debería leer cuatro documentos para hacer una
sola cosa: si eres asesor entras a `guias/` y ya; si vas a tocar código entras a `tecnico/` y ya.

La estructura sigue prácticas que ya están probadas en proyectos grandes:

- **Diátaxis** — separa guías de uso (orientadas a tarea), referencia (orientada a consulta) y
  explicación (orientada a entender). Por eso *Guía de usuario* y *Referencia de datos* son
  documentos distintos aunque hablen de lo mismo.
- **arc42** — la plantilla de [Arquitectura técnica](tecnico/ARQUITECTURA-TECNICA.md) usa sus
  secciones: contexto, estrategia, bloques, vista en ejecución, despliegue, conceptos transversales,
  riesgos y glosario.
- **ADR (Architecture Decision Records)** — cada decisión de peso queda escrita con su contexto y
  sus consecuencias, en [`decisiones/`](decisiones/). Sirve para que dentro de un año nadie
  pregunte "¿y esto por qué se hizo así?".
- **Keep a Changelog + SemVer** — el formato de la
  [bitácora de cambios](contribuir/BITACORA-DE-CAMBIOS.md) y de la numeración de versiones.

**Convención de nombres:** carpetas en minúsculas, archivos en `MAYUSCULAS-CON-GUIONES.md`.
Los ADR llevan número consecutivo: `ADR-0001-TITULO-CORTO.md`.

---

## Reglas de esta documentación

1. **Un documento, una audiencia.** Si un archivo empieza a servirle a dos públicos distintos, se
   parte en dos.
2. **Nada de secretos aquí.** Llaves, sales, tokens e IDs sensibles viven en las *Propiedades del
   script*. En la documentación solo aparece el **nombre** de la propiedad, nunca su valor.
3. **Si cambias el código, cambia el documento en el mismo movimiento.** Documentación vieja hace
   más daño que documentación ausente.
4. **El impacto se escribe en horas, no en adjetivos.**

---

## Contacto

- **Responsable técnico:** David Martínez — `dmartineza02@liverpool.com.mx`
- **Reportes de falla desde la app:** botón *Reportar* en las tarjetas del Portal, o el modal de
  soporte que abre desde el pie de página de cualquier pantalla.
- **Roles y responsables:** ver [Equipo y roles](proyecto/EQUIPO-Y-ROLES.md).
