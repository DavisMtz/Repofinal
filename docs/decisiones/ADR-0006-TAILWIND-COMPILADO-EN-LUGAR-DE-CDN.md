# ADR-0006 — Tailwind compilado en lugar de CDN

| | |
|---|---|
| **Estado** | Aceptada |
| **Fecha** | 2026 |
| **Decide** | David Martínez |

## Contexto

Las pantallas cargaban Tailwind así:

```html
<script src="https://cdn.tailwindcss.com"></script>
```

Ese script **está pensado solo para desarrollo**. Lo dice la propia documentación de Tailwind. En
cada carga de cada pantalla:

- Descargaba ~100 KB de compilador.
- Escaneaba el DOM y generaba el CSS **en el navegador**.
- Dejaba a la aplicación dependiendo de que una red externa respondiera.

Tres consecuencias reales:

1. **Lentitud medible** en cada carga, multiplicada por cada pantalla del día.
2. **Punto único de falla externo.** Si el CDN no responde, la app se ve rota.
3. **Fuga de perímetro.** Cada carga revela al tercero la IP del empleado, su navegador, la URL de
   la app en el `Referer` y el momento exacto de uso.

Y una cuarta, menos visible: un CDN comprometido puede ejecutar JavaScript arbitrario en la
aplicación.

## Decisión

Se retira el CDN. El CSS que el proyecto realmente usa se compila y se sirve desde el propio
proyecto, en **`app_tailwind.html`**, en dos partes:

1. **Preflight** — el reset de Tailwind v3. **No es opcional:** todo el maquetado da por hecho que
   está aplicado (márgenes de `body` y títulos, botones sin estilo, `box-sizing`, bordes en 0).
2. **Utilidades** — solo las clases que están presentes en el markup.

**Dónde va:** al **final** del `<head>`, después de `app_theme` y del `<style>` de la pantalla. El
CDN inyectaba su hoja al final del head en tiempo de ejecución, así que este orden reproduce la
cascada que la app ya tenía. **Moverlo cambia qué regla gana.**

Escala, colores y sombras son los valores por omisión de Tailwind v3.4, más los colores de marca que
definía `tailwind.config`: `brand-pink` `#E10098` y `brand-dark` `#b8007c`.

## Alternativas descartadas

**Dejar el CDN.**
Es lo que había. Lento, frágil y con fuga de perímetro, para usar una herramienta fuera de su
propósito.

**Montar un proceso de build con `npm` y PostCSS.**
Es lo correcto en un proyecto normal, y sería lo natural si esto no fuera Apps Script. Aquí no hay
proceso de build ([ADR-0001](ADR-0001-GOOGLE-APPS-SCRIPT-COMO-PLATAFORMA.md)): habría que compilar
fuera y pegar el resultado a mano en el editor — o sea, exactamente lo que ya se hace, con un paso
extra de herramienta que mantener.

**Fijar la versión del CDN y agregar SRI.**
Cierra el riesgo de manipulación, no la fuga de perímetro ni la dependencia de red. Es la opción
mínima aceptable para las librerías que **sí** hay que traer de fuera — GSAP y Chart.js —, no para
esta.

**Quitar Tailwind por completo y reescribir todo con `v-*`.**
El sistema de diseño propio ya cubre los componentes. Pero el maquetado de todas las pantallas usa
utilidades de Tailwind, y reescribirlo era un trabajo grande sin beneficio proporcional. Se dejó
para cuando toque tocar cada pantalla por otra razón.

## Consecuencias

**A favor**

- **Carga más rápida.** Sin compilador que descargar ni CSS que generar en el navegador.
- **Sin dependencia de red externa** para el maquetado.
- **Sin fuga de perímetro** por este recurso.
- **Sin superficie de ataque por CDN comprometido** en las pantallas.
- **Predecible.** El CSS es siempre el mismo, no depende de lo que el compilador infiera esa vez.
- **Precedente.** La revisión de seguridad lo señaló como *"excelente precedente; replicar con GSAP
  y Chart.js"*.

**En contra**

- ⚠️ **Al agregar una clase de Tailwind nueva en el markup, hay que agregarla también aquí.** Ya no
  hay compilador que la invente sola. Es la trampa más fácil de pisar de todo el proyecto: escribes
  `mt-14`, no pasa nada, y pierdes veinte minutos buscando dónde está el error.
- **El archivo hay que mantenerlo a mano.**
- **El orden en el `<head>` importa** y no es evidente para quien llega nuevo.
- **Puede acumular clases muertas** si se quita markup y nadie limpia.

**Qué obliga a hacer**

- **Preferir los componentes `v-*`** de `app_theme.html` antes que utilidades sueltas. Esos no
  dependen de este archivo.
- **Respetar el orden del `<head>`:**
  `ViewPrefsPartial` → `app_theme` → `<style>` propio → `app_tailwind`.
- **Al agregar una clase, agregarla al archivo en el mismo cambio.**
- **Si tu clase no hace nada, esto es lo primero que hay que revisar.**

## Lo que falta

La misma decisión **todavía no se aplicó** a las otras librerías externas:

| Recurso | Estado |
|---|---|
| GSAP 3.13 + ScrollTrigger + MorphSVG (cdnjs, jsdelivr) | Versión fijada, **sin SRI** |
| SplitText + DrawSVG | Sin SRI, **y cargan en las pantallas de login y registro** |
| Chart.js (jsdelivr) | 🔴 **Sin versión fijada y sin SRI** |
| Google Fonts | Metadatos de conexión |

Que `SplitText` y `DrawSVG` se carguen desde un CDN externo **en la pantalla de login** significa
que un compromiso de ese CDN permitiría ejecutar JavaScript en la misma página donde el asesor
teclea su contraseña.

**Es la Fase 2 del [plan de seguridad](../operacion/SEGURIDAD.md), hallazgo M-02.** Este ADR ya
demostró que se puede hacer.

## Cuándo revisar esto

Si el proyecto llega a tener un proceso de build de verdad, o si el maquetado se migra por completo
a los componentes `v-*` y Tailwind deja de hacer falta.
