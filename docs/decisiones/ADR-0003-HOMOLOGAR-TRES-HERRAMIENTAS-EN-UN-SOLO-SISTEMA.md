# ADR-0003 — Homologar tres herramientas en un solo sistema

| | |
|---|---|
| **Estado** | Aceptada |
| **Fecha** | 2025 |
| **Decide** | Jorge Armando Alcaraz López (coordinación) · David Martínez (implementación) |

## Contexto

El proyecto arrancó como tres herramientas separadas, construidas una tras otra según fue
apareciendo la necesidad:

1. **El Portal** — consulta de herramientas, formatos, plantillas y promociones.
2. **El cotizador** — captura de cotizaciones y generación de PDF.
3. **Los correos** — plantillas de correo a cliente.

Cada una con su propio proyecto, su propia URL, su propia sesión y su propio aspecto.

El costo de eso se hizo visible rápido:

- **Para el asesor:** tres accesos que recordar, tres pantallas distintas, y ninguna sabía lo que
  hacía la otra. Buscabas una plantilla en un lado y la usabas en otro, copiando y pegando.
- **Para quien lo mantiene:** el mismo arreglo, tres veces. Tres despliegues. Tres versiones del
  mismo componente que se desincronizaban.
- **Para la adopción:** tres herramientas es tres veces la fricción de entrada. Y una herramienta
  que se ve distinta de la otra no parece la misma solución, parece un parche.

La recomendación de homologar vino de coordinación, no del desarrollo. Es la decisión estructural
más importante que ha tomado el proyecto.

## Decisión

Las tres herramientas se fusionan en **un solo proyecto de Apps Script**, con:

- **Una URL.** El enrutador (`doGet`) sirve todas las pantallas según `?page=`.
- **Una sesión.** `AppSession` en `app_core.html`, válida en todo el sistema.
- **Un sistema de diseño.** Ver [Sistema de diseño](../tecnico/SISTEMA-DE-DISENO.md).
- **Un despliegue.** Una versión, una reversión.
- **Un nombre.** Sistema Integral Ventel.

El Portal queda como la pantalla de entrada predeterminada: cualquier `?page=` desconocido cae ahí.

## Alternativas descartadas

**Dejar las tres separadas y solo enlazarlas entre sí.**
Barato de hacer, no resuelve nada. El asesor sigue cruzando tres sesiones y tres diseños. La
fricción no está en el enlace, está en el corte.

**Un menú común incrustado en las tres.**
Maquilla el problema. Se sigue manteniendo tres veces y las sesiones siguen sin hablarse.

**Fusionar solo el cotizador y los correos, dejando el Portal aparte.**
Era lo tentador: el Portal es público y los otros dos piden sesión. Se descartó porque el Portal es
justamente **la puerta de entrada**: ahí es donde el asesor empieza el día y desde donde debe poder
saltar a cotizar sin cambiar de contexto. Dejarlo fuera habría dejado la costura en el peor lugar.

## Consecuencias

**A favor**

- **Una sola puerta.** El asesor abre una URL y desde ahí llega a todo.
- **La sesión viaja.** Entras una vez.
- **Un solo mantenimiento.** Un arreglo, aplicado en todos lados.
- **Diseño coherente.** Deja de parecer un conjunto de parches y empieza a parecer un sistema.
- **Búsqueda cruzada.** El buscador del Portal puede llevarte directo a una plantilla ya cargada en
  la pantalla de correos — algo imposible cuando eran proyectos separados.
- **Un solo despliegue y una sola reversión.** Ver [Guía de despliegue](../tecnico/GUIA-DE-DESPLIEGUE.md).
- **Preferencias compartidas.** Tema, densidad, escala de texto y contraste valen en todo el
  sistema.

**En contra**

- **Todo comparte el ámbito global.** Un error en un archivo `.gs` puede tumbar pantallas que no
  tienen nada que ver.
- **Un despliegue malo afecta a todo.** Ya no se puede romper solo el cotizador.
- **El proyecto es grande.** 9 archivos `.gs` y 23 `.html` en un solo editor.
- **La superficie de API creció.** Todas las funciones globales son invocables desde el navegador,
  ahora también las del Portal. Esto agrava el problema de [ADR-0004](ADR-0004-CAPA-UNICA-DE-IDENTIDAD.md).
- **La migración costó.** Unificar tres diseños distintos en uno fue trabajo real, no un copiar y
  pegar.

**Qué obliga a hacer**

- **Prefijo por capa** en todas las funciones. Es lo único que evita colisiones en el ámbito
  compartido.
- **Un solo sistema de diseño**, en `app_theme.html`, incluido por todas las pantallas de app.
- **Núcleo compartido** (`app_core.html`) con `AppUrl`, `AppSession`, `AppCache` y `AppRun`.
- **Capa única de identidad.** Ver [ADR-0004](ADR-0004-CAPA-UNICA-DE-IDENTIDAD.md).
- **Manejo de error global** en `doGet`: un fallo al renderizar cualquier pantalla no puede mostrar
  la pantalla amarilla de Apps Script.
- **`verificarVersionDelCodigo()`**, porque con un proyecto grande el riesgo de dejar un archivo
  `.gs` duplicado —y que gane la definición vieja en silencio— es real.

## Cuándo revisar esto

Si el proyecto crece hasta que un despliegue se vuelve arriesgado, o si alguna parte necesita un
ciclo de cambios muy distinto al resto. La separación natural sería sacar el Portal a su propio
proyecto, conservando el sistema de diseño compartido — pero eso reintroduce el problema que esta
decisión resolvió, y habría que tener una razón fuerte.
