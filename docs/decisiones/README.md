# Decisiones de arquitectura (ADR)

Por qué el Sistema Integral Ventel es como es, decisión por decisión. Cada documento registra qué se
decidió, en qué contexto, qué se descartó y qué costó.

**Para qué sirve esto:** para que dentro de un año —o cuando entre alguien más al proyecto— nadie
tenga que preguntar "¿y esto por qué se hizo así?", ni deshacer una decisión sin saber lo que
sostenía.

---

## Índice

| # | Decisión | Estado | Fecha |
|---|---|---|---|
| [0001](ADR-0001-GOOGLE-APPS-SCRIPT-COMO-PLATAFORMA.md) | Google Apps Script como plataforma | Aceptada | May 2025 |
| [0002](ADR-0002-GOOGLE-SHEETS-COMO-BASE-DE-DATOS.md) | Google Sheets como base de datos | Aceptada | May 2025 |
| [0003](ADR-0003-HOMOLOGAR-TRES-HERRAMIENTAS-EN-UN-SOLO-SISTEMA.md) | Homologar tres herramientas en un solo sistema | Aceptada | 2025 |
| [0004](ADR-0004-CAPA-UNICA-DE-IDENTIDAD.md) | Capa única de identidad y permisos | Aceptada, con riesgo abierto | 2026 |
| [0005](ADR-0005-CACHE-INVALIDADA-POR-ESCRITURA.md) | Caché invalidada por escritura, no por tiempo | Aceptada | 2026 |
| [0006](ADR-0006-TAILWIND-COMPILADO-EN-LUGAR-DE-CDN.md) | Tailwind compilado en lugar de CDN | Aceptada | 2026 |
| [0007](ADR-0007-ANUNCIOS-COMO-PUBLICACIONES-JSON.md) | Anuncios como publicaciones en JSON | Aceptada | 2026 |

**Estados posibles:** `Propuesta` · `Aceptada` · `Rechazada` · `Reemplazada por ADR-XXXX` ·
`Obsoleta`.

Un ADR **no se edita** cuando la decisión cambia: se marca como reemplazado y se escribe uno nuevo.
El registro de lo que se pensó en su momento vale tanto como la decisión vigente.

---

## Cuándo escribir uno

Escríbelo si la decisión cumple **al menos dos**:

- Es cara de deshacer.
- Afecta a más de un módulo.
- Alguien va a preguntar por qué en el futuro.
- Se descartó una alternativa razonable.
- Condiciona decisiones que vengan después.

**No escribas un ADR** para elegir el nombre de una variable, para un cambio de estilo, ni para algo
que se revierte en diez minutos.

---

## Plantilla

Copia esto en `ADR-XXXX-TITULO-CORTO.md`, con el consecutivo que siga.

```markdown
# ADR-XXXX — Título en una línea

| | |
|---|---|
| **Estado** | Propuesta / Aceptada / Rechazada / Reemplazada por ADR-YYYY |
| **Fecha** | Mes Año |
| **Decide** | Quién |

## Contexto

Qué situación obligó a decidir. Los hechos, sin justificar todavía.

## Decisión

Qué se decidió. En una frase, en presente.

## Alternativas descartadas

**Opción A** — por qué no.
**Opción B** — por qué no.

## Consecuencias

**A favor**
- ...

**En contra**
- ...

**Qué obliga a hacer**
- ...

## Cuándo revisar esto

Qué tendría que pasar para reconsiderarla.
```

---

## Cómo se lee un ADR

- **Contexto** — la situación. Si el contexto ya no aplica, la decisión probablemente tampoco.
- **Decisión** — qué se hizo.
- **Alternativas descartadas** — la parte más útil cuando alguien propone "¿y si mejor…?".
  Casi siempre ya se pensó.
- **Consecuencias** — lo que se ganó y lo que se paga. **Incluye lo malo**: un ADR que solo lista
  ventajas no sirve de nada.
- **Cuándo revisar** — la condición concreta que dispara la reconsideración.
