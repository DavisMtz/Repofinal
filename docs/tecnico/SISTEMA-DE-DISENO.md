# Sistema de diseño

Los tokens, componentes, iconos y animación que comparten todas las pantallas. Léelo antes de
escribir CSS: casi todo lo que necesitas ya existe.

**Regla base:** no inventes estilos en la pantalla. Usa los tokens. Si algo falta, agrégalo a
`app_theme.html` para que lo tenga todo el sistema, no solo tu pantalla.

---

## Los archivos

| Archivo | Qué es |
|---|---|
| `app_theme.html` | Tokens, tipografía, 3 temas y componentes `v-*`. **La fuente de verdad.** |
| `app_tailwind.html` | Tailwind v3.4 compilado: preflight + solo las utilidades que el markup usa. |
| `app_shell.html` | Barra lateral y topbar. |
| `app_icons.html` | Los SVG de la interfaz. |
| `app_motion.html` | GSAP y los helpers de animación. |
| `app_auth.html` | El escenario de login y registro. |
| `LoaderPartial.html` | El loader de marca. |
| `ViewPrefsPartial.html` | Preferencias de vista. |

### Orden en el `<head>` — importa

```html
<?!= include('ViewPrefsPartial'); ?>   <!-- antes de pintar: sin parpadeo de tema -->
<?!= include('app_theme'); ?>          <!-- tokens y componentes -->
<style> /* lo propio de esta pantalla */ </style>
<?!= include('app_tailwind'); ?>       <!-- al final, igual que el CDN que sustituyó -->
```

Y al final del `<body>`: `app_core` → `app_icons` → `app_motion` → `app_shell` / `app_support`.

**Moverlo cambia qué regla gana.** El CDN de Tailwind inyectaba su hoja al final del `<head>` en
tiempo de ejecución; este orden reproduce esa cascada.

> `Index.html` y `Promociones.html` **no incluyen** `app_theme`: duplican los tokens a mano. Si
> cambias tipografía o color de marca, cámbialo en los tres.

---

## Color

### Marca

| Token | Valor | Para qué |
|---|---|---|
| `--brand` | `#E10098` | El rosa Liverpool. Acento, no fondo. |
| `--brand-deep` | `#A8006F` | Estado presionado, texto sobre claro. |
| `--brand-bright` | `#EE2BAB` | Realce puntual. |
| `--brand-tint` | `#FDE7F4` | Fondos suaves, anillo de foco. |
| `--brand-soft` | `#FBD0E9` | Bordes y separadores de marca. |

**Regla 60/30/10.** El rosa es el 10. Cuando se usó de fondo a media pantalla, la interfaz se
saturaba y las pantallas dejaban de respetar el tema. Volvió a ser acento y ahí se queda.

### Superficie y texto

| Token | Para qué |
|---|---|
| `--app-bg` | Fondo de la aplicación. |
| `--content-bg` | Fondo del área de contenido. |
| `--surface` / `--surface-2` | Tarjetas y su variante hundida. |
| `--ink` / `--ink-soft` / `--ink-faint` | Texto principal, secundario, terciario. |
| `--line` / `--line-soft` | Bordes y separadores. |

### Estados

Cada uno con su color de texto y su fondo:

| Estado | Texto | Fondo |
|---|---|---|
| `--ok` | `#0E7A4F` | `--ok-bg` |
| `--warn` | `#B45309` | `--warn-bg` |
| `--alert` | `#C81E3C` | `--alert-bg` |
| `--info` | `#1D4ED8` | `--info-bg` |
| `--violet` | `#6D28D9` | `--violet-bg` |

**Nunca uses un color literal para un estado.** El token cambia con el tema; el literal no, y en
carbón se vuelve ilegible.

---

## Temas

Tres, en el atributo `data-theme` del `<html>`:

| Tema | Cuál es |
|---|---|
| `aurora` | Claro, con un halo rosa muy tenue. **Predeterminado.** |
| `slate` | Claro neutro, sin halo. Para pantallas con reflejo. |
| `carbon` | Oscuro. Superficies `#0E1014` → `#22272F`, texto `#F1EDEF`. |

Los ajustes de vista se guardan en `localStorage` y **los comparten la app y el Portal**:

| Clave | Valores |
|---|---|
| `ventel-theme` | `aurora` · `slate` · `carbon` |
| `ventel-density` | `cozy` · `compact` |
| `ventel-textscale` | `sm` · `md` · `lg` · `xl` |
| `ventel-contrast` | `0` · `1` |

Se leen y escriben con `VentelPrefs`:

```javascript
VentelPrefs.get('theme');                 // 'aurora'
VentelPrefs.set('density', 'compact');    // guarda + aplica + emite 'ventel-prefs-change'
VentelPrefs.apply();                      // re-aplica los data-* sobre <html>
```

El alto contraste tiene ajustes propios por tema, incluido carbón.

---

## Tipografía

Dos familias. **Antes eran tres** —una display, una de cuerpo y una monoespaciada—; se recortó a lo
necesario.

| Token | Familia | Para qué |
|---|---|---|
| `--f-ui` | **Inter** (`opsz 14..32`, `wght 300..800`) | Toda la interfaz. |
| `--f-mono` | **JetBrains Mono** (500, 700) | Folios, SKU y claves. |

Inter está dibujada para pantalla: altura de x alta y, sobre todo, distingue `1/l/I` y `0/O` — que
es exactamente lo que se lee todo el día aquí (`LVP-260729-0001` y SKUs).

El eje `opsz` ajusta el dibujo al tamaño real: los títulos salen más ceñidos y el texto chico más
abierto. **De ahí viene el aire cuidado, no de una segunda fuente decorativa.**

### La jerarquía la hace el peso

| Peso | Uso |
|---|---|
| `--fw-normal` (400) | Texto corrido. |
| `--fw-medium` (500) | Énfasis y controles. |
| `--fw-semibold` (600) | Títulos. |
| `--fw-bold` (700) | Cifras y KPI. |

---

## Forma, sombra y movimiento

| Token | Valor |
|---|---|
| `--rad-sm` / `--rad` / `--rad-lg` | `8px` / `12px` / `14px` |
| `--sh-xs` … `--sh-lg` | Cuatro niveles de elevación, distintos en claro y en oscuro. |
| `--ring` | Anillo de foco. **No lo quites**: es la accesibilidad por teclado. |
| `--tr` | `all .15s cubic-bezier(.32,.72,0,1)` — la transición del sistema. |

---

## Componentes `v-*`

Viven en `app_theme.html` y **no dependen de Tailwind**.

| Grupo | Clases |
|---|---|
| Botones | `v-btn` · `v-btn-primary` · `v-btn-ghost` · `v-btn-dark` · `v-btn-danger` · `v-btn-success` · `v-btn-indigo` · `v-btn-sm` |
| Contenedores | `v-card` · `v-card-hover` · `v-modal` · `v-modal-overlay` |
| Formularios | `v-input` · `v-select` · `v-textarea` · `v-label` |
| Tablas | `v-table` · `v-table-wrap` · `v-row-action` |
| Etiquetas | `v-badge` + `-green` `-red` `-yellow` `-blue` `-pink` |
| Acciones | `v-act-pink` · `v-act-blue` · `v-act-green` · `v-act-slate` |
| Datos | `v-kpi-value` · `v-money` · `v-display` |
| Estado | `v-spinner` · `v-overlay` · `v-overlay-spinner` · `v-overlay-text` · `v-toast` |
| Texto | `v-prose` · `v-nav` |

**Úsalos antes de escribir CSS nuevo.**

---

## Tailwind compilado

`app_tailwind.html` sustituye a `<script src="https://cdn.tailwindcss.com">`, que estaba pensado
solo para desarrollo: descargaba ~100 KB de compilador y generaba el CSS en el navegador en cada
carga, con la app dependiendo de una red externa.

Contiene dos partes:

1. **Preflight** — el reset de Tailwind v3. **No es opcional**: todo el maquetado lo da por hecho.
2. **Utilidades** — solo las clases que el markup realmente usa.

> ⚠️ **Al agregar una clase de Tailwind nueva en el markup, agrégala también aquí.** Ya no hay
> compilador que la invente sola. Si tu clase no hace nada, es esto.

Los colores de marca están extendidos: `brand-pink` `#E10098` y `brand-dark` `#b8007c`.

Ver [ADR-0006](../decisiones/ADR-0006-TAILWIND-COMPILADO-EN-LUGAR-DE-CDN.md).

---

## Iconos

Fuente única en `app_icons.html`. Antes cada pantalla incrustaba SVG con geometrías dispares —20×20
rellenos contra 24×24 de trazo—; hoy hablan un solo idioma: **lienzo 24×24, sin relleno, trazo 1.6,
`currentColor`**.

Heredan color y tamaño del contenedor, y se pueden "dibujar" con DrawSVG.

```html
<!-- Declarativo, lo normal -->
<span class="h-5 w-5 text-gray-400" data-icon="mail"></span>
<script>Icons.render();</script>
```

```javascript
// Imperativo, para estados que cambian por JS
el.innerHTML = Icons.svg('check', 'h-8 w-8 text-green-600');
```

> Los formatos de cotización —vista PDF y CCL— **no** usan este sistema. Conservan su maquetación
> original intacta a propósito: ahí manda la fidelidad del formato oficial.

---

## Animación

`app_motion.html` carga GSAP 3.13 y expone helpers. **Ninguna pantalla anima por su cuenta.**

| Helper | Para qué |
|---|---|
| `AppMotion.enter()` | Entrada escalonada de todo `[data-animate]`. |
| `AppMotion.staggerRows(rows)` | Filas de tabla en cascada. |
| `AppMotion.countUp(el, valor)` | KPI que cuentan hasta su valor. |
| `AppMotion.modalIn(...)` / `modalOut(...)` | Apertura y cierre con overlay. |
| `AppMotion.pop(el)` | Micro-feedback: confirmaciones, interruptores. |
| `AppMotion.shake(el)` | Error de validación. |
| `AppMotion.toast(msg, tipo)` | Notificación animada. |

**Degradación:** si GSAP no carga —sin red al CDN— o el usuario tiene activado
`prefers-reduced-motion`, todo se muestra sin animar. **La app nunca se queda oculta esperando una
animación.**

### El loader de marca

`LoaderPartial.html`. El isotipo de Liverpool se forma con 8 puntos que hacen morph. Colores
oficiales: naranja `#EE7D00` y morado `#AC4581`.

Islas 0–3 (verticales izquierda y base) en morado; islas 4–7 (superior y verticales derecha) en
naranja. **No alterna por par/impar** — así pintaba medio logo invertido.

API: `window.VentelLoader`. Requiere MorphSVGPlugin; sin él degrada a un giro estático.

---

## Shell de aplicación

`app_shell.html` da a las pantallas de app el mismo marco que el Portal: barra lateral rosa y topbar
con control de sesión, tema y ajustes de vista.

```javascript
document.addEventListener('DOMContentLoaded', () => {
  AppShell.mount({ active: 'dashboard', title: 'Panel' });
});
```

`mount()` envuelve el `<main id="main-content">` que ya existe dentro de `.app > .app-main`. Tu
pantalla no tiene que maquetar nada del marco.

---

## Accesibilidad

Lo que no se negocia:

- **Anillo de foco visible.** `--ring` en todo lo enfocable. No lo quites por estética.
- **Contraste.** Usa los tokens de estado, no literales. Hay modo de alto contraste con ajustes por
  tema.
- **Escala de texto.** Cuatro tamaños. Tu maquetado tiene que aguantar `xl` sin romperse.
- **Movimiento reducido.** Se respeta `prefers-reduced-motion`.
- **Teclado.** Todo lo accionable debe alcanzarse con tabulador.

---

## Antes de entregar una pantalla

- [ ] ¿Usaste tokens en lugar de colores literales?
- [ ] ¿Usaste componentes `v-*` antes de escribir CSS?
- [ ] ¿El orden del `<head>` es el correcto?
- [ ] Si agregaste una clase de Tailwind, ¿la agregaste a `app_tailwind.html`?
- [ ] ¿Se ve bien en los tres temas?
- [ ] ¿Aguanta escala de texto `xl` y alto contraste?
- [ ] ¿Se ve de 375 px a 1440 px?
- [ ] ¿Funciona con las animaciones desactivadas?
- [ ] ¿Los iconos salen de `Icons`?
