# Sistema Integral Ventel

El sistema interno del Centro de Contacto Liverpool que junta en una sola herramienta el Portal de
consulta, la generación de cotizaciones, el envío de correos a clientes y el panel de supervisión.

Corre sobre Google Apps Script y Google Sheets. Sin servidor, sin instalación: el asesor abre una
URL con la cuenta que ya tiene.

| Dato | Valor |
|---|---|
| **Versión** | 0.9 — *Pruebas de control* |
| **Plataforma** | Google Apps Script (V8) + Google Sheets |
| **Zona horaria** | `America/Mexico_City` |
| **Estado** | Piloto controlado. **No liberado a producción abierta** |
| **En desarrollo desde** | Mayo 2025 |

> ⚠️ **Este sistema no está liberado a producción.** Hay tres hallazgos críticos de seguridad
> abiertos que deben cerrarse antes de tratar datos reales de clientes en abierto. Ver
> [docs/operacion/SEGURIDAD.md](docs/operacion/SEGURIDAD.md).

---

## 📚 Documentación

**Toda la documentación vive en [`docs/`](docs/README.md).** Está dividida por audiencia:

| Si vas a… | Empieza por |
|---|---|
| **Usar la herramienta** | [Guía de usuario](docs/guias/GUIA-DE-USUARIO.md) |
| **Supervisar** | [Guía de supervisión](docs/guias/GUIA-DE-SUPERVISION.md) |
| **Publicar anuncios** | [Manual de anuncios](docs/guias/MANUAL-DE-ANUNCIOS.md) |
| **Mantener el código** | [Arquitectura técnica](docs/tecnico/ARQUITECTURA-TECNICA.md) |
| **Desplegar** | [Guía de despliegue](docs/tecnico/GUIA-DE-DESPLIEGUE.md) |
| **Resolver una falla** | [Runbook](docs/operacion/RUNBOOK.md) |
| **Decidir sobre el proyecto** | [Visión y alcance](docs/proyecto/VISION-Y-ALCANCE.md) |
| **Priorizar lo que sigue** | [Oportunidades de mejora](docs/proyecto/OPORTUNIDADES-DE-MEJORA.md) |
| **Saber qué se puede medir** | [Catálogo de métricas](docs/proyecto/CATALOGO-DE-METRICAS.md) |
| **Contribuir** | [Guía de contribución](docs/contribuir/GUIA-DE-CONTRIBUCION.md) |
| **Entender por qué algo es así** | [Decisiones de arquitectura](docs/decisiones/README.md) |

---

## Qué hace

**Portal Ventel** — la pantalla de entrada, sin sesión. Herramientas, presentaciones, paqueterías,
formatos, puntos de pago, plantillas de correo, anuncios del área y buscador global. Más el Monitor
de Promociones, con vigencias y calendario comercial a 90 días.

**Cotizaciones** — captura con cálculo automático de descuentos, IVA y total. Folio
`LVP-AAMMDD-NNNN`. Dos formatos de PDF: el del sistema, con fotos de producto, y el formato oficial
CCL Liverpool. Envío por correo desde el alias institucional.

**Correos a clientes** — seis plantillas con vista previa en vivo y verificación antes de enviar.

**Panel de supervisión** — todas las cotizaciones con filtros y reporte en CSV, métricas de correos,
estado del sistema y control de formatos.

---

## Estructura del repositorio

```
Repofinal/
├── README.md                  ← estás aquí
├── INFORME-SEGURIDAD.md       ← revisión de seguridad, 28 jul 2026
├── appsscript.json            ← configuración del proyecto de Apps Script
│
├── docs/                      ← 📚 toda la documentación
│   ├── proyecto/              ·  visión, equipo, impacto, oportunidades, métricas, glosario
│   ├── guias/                 ·  uso, supervisión, anuncios, FAQ
│   ├── tecnico/               ·  arquitectura, datos, funciones, diseño, despliegue
│   ├── operacion/             ·  runbook, adopción, seguridad
│   ├── decisiones/            ·  ADR
│   └── contribuir/            ·  contribución, estándares, bitácora
│
├── *.gs                       ← backend (9 archivos)
│   ├── Code.gs                ·  enrutador, login, CRUD de cotizaciones
│   ├── Seguridad.gs           ·  identidad, permisos, configuración sensible
│   ├── Cache.gs               ·  caché con invalidación por escritura
│   ├── Portal.gs              ·  contenido del Portal y anuncios
│   ├── Correos.gs             ·  envío de cotizaciones con PDF
│   ├── CorreoCliente.gs       ·  correos de plantilla
│   ├── Formatos.gs            ·  formatos de cotización y generación de PDF
│   ├── Metricas.gs            ·  registro y resumen de envíos
│   └── Admin.gs               ·  diagnóstico
│
└── *.html                     ← frontend (23 archivos)
    ├── Index, Promociones     ·  Portal público
    ├── inicioDeSesion, registro
    ├── inicio, inicio_avanzado
    ├── cotizacion, cotizado_preview, consulta_cotizacion
    ├── correoventel, correo_cliente, anuncios
    └── app_*, *Partial        ·  parciales compartidos
```

---

## Arranque rápido para desarrollo

1. Lee [Arquitectura técnica](docs/tecnico/ARQUITECTURA-TECNICA.md).
2. Sigue la [Guía de despliegue](docs/tecnico/GUIA-DE-DESPLIEGUE.md) para montar un entorno propio.
3. Ejecuta `revisionMaestra()` desde el editor de Apps Script. Autoriza los permisos y revisa que
   todo salga con ✔.
4. Antes de tu primer cambio, lee los [Estándares de código](docs/contribuir/ESTANDARES-DE-CODIGO.md).

> **Ojo con dos cosas** antes de tocar nada: todos los archivos `.gs` comparten un solo ámbito
> global, y toda función global es invocable desde el navegador. Las dos están explicadas en la
> arquitectura.

---

## Equipo

Desarrollo: **David Martínez** — `dmartineza02@liverpool.com.mx`

El proyecto lo sostienen además supervisión y coordinación del área Ventel, en dirección de
producto, validación funcional y ruta de implementación. Ver
[Equipo y roles](docs/proyecto/EQUIPO-Y-ROLES.md).

---

## Seguridad

Si encuentras una falla de seguridad, **no la publiques**. Escríbele directo al responsable técnico.
Ver [Seguridad](docs/operacion/SEGURIDAD.md).

---

*Uso interno de Liverpool. No distribuir fuera de la organización.*
