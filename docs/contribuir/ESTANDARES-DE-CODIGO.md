# Estándares de código

Cómo se escribe código en el Sistema Integral Ventel. Léelo antes de tu primer cambio; con esto tu
código se lee como el resto del proyecto.

**El principio:** el código lo va a leer alguien que no lo escribió, probablemente meses después,
probablemente con un asesor esperando. Escribe para esa persona.

---

## Lo primero: el ámbito global

En Google Apps Script **todos los archivos `.gs` comparten un solo espacio de nombres.** No hay
módulos ni `import`.

Dos consecuencias que hay que tener presentes todo el tiempo:

1. **Dos funciones con el mismo nombre en archivos distintos: gana la última cargada, en silencio.**
   Es la causa número uno de "arreglé esto y sigue fallando".
2. **Toda función global es invocable desde el navegador** con `google.script.run`, la use tu
   pantalla o no.

### Prefijo por capa — obligatorio

| Prefijo | Capa |
|---|---|
| `sec*` | Seguridad e identidad |
| `cot*` | Caché de cotizaciones |
| `portal*` | Portal |
| `met*` | Métricas |
| `cc*` | Correos a cliente |
| `ccl*` | Formato CCL |

Las funciones expuestas al navegador van sin prefijo, con nombre descriptivo:
`getQuotesForUser`, `sendQuoteByEmail`.

**No dejes archivos `.gs` duplicados en el proyecto.** Ninguna copia de respaldo.
`verificarVersionDelCodigo()` lo detecta.

---

## Nombres

| Qué | Cómo | Ejemplo |
|---|---|---|
| Constante global | `MAYUSCULAS_CON_GUION_BAJO` | `LOGIN_MAX_INTENTOS` |
| Función pública | `camelCase` descriptivo | `getSupervisionQuotes` |
| Función privada | `camelCase_` con guion bajo **al final** | `leerSupervision_` |
| Variable | `camelCase` | `folioColIdxCot` |
| Nombre de hoja | Constante | `REGISTROS_SHEET_NAME` |

### Español o inglés

**Consistente dentro del archivo.** El proyecto mezcla —`saveQuoteDataToSheets` convive con
`secIdentidadAvanzada_`— porque cada capa se escribió con el idioma que le quedaba natural.

Al tocar un archivo, **usa el idioma que ya tiene.** No lo "arregles".

**Los comentarios van en español, siempre.**

### El guion bajo final no protege

`leerSupervision_()` **sigue siendo invocable** desde el navegador. El `_` es convención de
intención, no un control de acceso. Si toca datos, valida identidad adentro.

---

## Encabezado de archivo

Todo archivo nuevo lleva encabezado que diga qué es, qué expone y qué **no** hace:

```javascript
/**
 * =================================================================================================
 * NOMBRE DE LA CAPA | Sistema de cotizaciones Ventel
 * =================================================================================================
 * Qué resuelve este archivo, en dos o tres líneas.
 *
 * Funciones expuestas al cliente:
 *   nombreFuncion()  → qué pantalla la usa y para qué
 *
 * Lo que este archivo NO hace (y dónde vive eso).
 */
```

Decir qué **no** hace es tan útil como decir qué hace: evita que alguien meta ahí algo que va en
otro lado.

### Separadores de sección

```javascript
// --- Constantes Globales ---
// ── CACHÉ ─────────────────────────────────────────────────────────────────────
```

---

## Comentarios

**Comenta el porqué, no el qué.** El qué ya está en el código.

```javascript
// ❌ Incrementa el contador
contador++;

// ✅ Va al FINAL a propósito: si algo de arriba falla, la caché vigente
//    sigue siendo la verdad.
cotInvalidarCache_();
```

**Documenta las trampas.** Si algo va a sorprender a quien lo lea, dilo ahí mismo:

```javascript
// La fila se arma por NOMBRE de columna, no por posición: si algún día se
// reordenan o se agregan columnas en 'Registros', el registro sigue cuadrando.
```

**Las advertencias de seguridad, en lenguaje llano:**

```javascript
// Valores sensibles: no se suben al repositorio.
```

**JSDoc en las funciones expuestas al cliente:**

```javascript
/**
 * Devuelve las cotizaciones del asesor.
 * @param {string} callingUserEmail - Correo del asesor con sesión.
 * @param {string} searchTerm - Término de búsqueda. Tolera errores de dedo.
 * @param {boolean} forzarRecarga - Salta la caché.
 * @return {object} { success, quotes } o { success: false, message }
 */
```

---

## Las reglas que no se rompen

### 1. Columnas por nombre, nunca por posición

```javascript
// ✅
const idx = headers.indexOf("Email");
if (idx === -1) throw new Error("Columna 'Email' no encontrada.");

// ❌
const email = row[4];
```

Insertar o mover una columna no debe desalinear nada en silencio.

### 2. Las funciones expuestas al cliente no lanzan

```javascript
function miFuncion(param) {
  try {
    // ...
    return { success: true, datos: resultado };
  } catch (error) {
    Logger.log("Error en miFuncion: " + error.message);
    return { success: false, message: "No se pudo: " + error.message };
  }
}
```

**Elige la convención del módulo** — `success` en cotizaciones y correos, `status` en Portal — y no
las mezcles.

### 3. Identidad adentro, en toda función que toque datos

```javascript
function getAlgoSensible(email) {
  const who = secIdentidadAvanzada_(email);
  if (!who.ok) return { success: false, message: who.error };
  // ...
}
```

**No confíes en que la pantalla proteja.** La pantalla no es el límite de seguridad.

### 4. Escapa todo lo que venga del usuario y vaya a HTML

```javascript
html += `<h2>${secEscapeHtml_(p.description)}</h2>`;
```

Sin excepción. Correos, PDF, pantallas de error.

### 5. Caché: lee envuelto, invalida al final

```javascript
// Leer
function getAlgo() {
  return cotCacheado_('algo', COT_TTL.supervision, function () {
    return calcularAlgo_();
  });
}

// Escribir
function guardarAlgo(datos) {
  // ... la escritura
  cotInvalidarCache_();   // ← AL FINAL. Si algo falla antes, la caché vigente es la verdad.
}
```

**Nunca caches una respuesta de error.**

### 6. Nada accesorio tumba lo principal

```javascript
try {
  metRegistrarEnvio_(evento);
} catch (e) {
  Logger.log('No se pudo registrar la métrica: ' + e);
  // El correo ya salió. No tiene sentido tumbar la operación por el registro.
}
```

### 7. Cero secretos en el código

```javascript
// ✅
const salt = secConfig_('HASH_SALT', '');

// ❌
const HASH_SALT = "<la sal, escrita en el archivo>";
```

---

## Degradación

El sistema se cae hacia abajo, nunca hacia el vacío. Cada dependencia opcional tiene su plan B:

| Si falla | Qué debe pasar |
|---|---|
| `CacheService` | Se lee de la hoja. Más lento, nada más. |
| GSAP | Todo se muestra sin animar. |
| Un servicio externo | Se sirve lo demás. |
| Falta una columna opcional | Se crea sola. |

**Al agregar una dependencia, escribe su plan B en el mismo cambio.**

---

## Frontend

### Estructura de una pantalla

```html
<head>
  <?!= include('ViewPrefsPartial'); ?>   <!-- antes de pintar -->
  <?!= include('app_theme'); ?>
  <style>/* lo propio de esta pantalla */</style>
  <?!= include('app_tailwind'); ?>       <!-- al final -->
</head>
<body>
  <main id="main-content">...</main>

  <script>window.__APP__ = { baseUrl: '<?= baseUrl ?>', folio: '<?= folio ?>' };</script>
  <?!= include('app_core'); ?>
  <?!= include('app_icons'); ?>
  <?!= include('app_motion'); ?>
  <?!= include('app_shell'); ?>
</body>
```

**El orden del `<head>` define qué regla de CSS gana.** No lo muevas.

### Llamar al servidor

```javascript
const r = await AppRun('getQuotesForUser', AppSession.email(), termino, false);
if (r.success) pintar(r.quotes);
else AppMotion.toast(r.message, 'error');
```

`AppRun` da promesas y deduplica llamadas idénticas en vuelo.

### Reglas de interfaz

- **Tokens, no colores literales.** `var(--brand)`, no `#E10098`.
- **Componentes `v-*` antes que CSS nuevo.**
- **Iconos desde `Icons`**, no SVG incrustado.
- **Animación desde `AppMotion`**, no GSAP directo.
- **Si agregas una clase de Tailwind, agrégala a `app_tailwind.html`.** No hay compilador.
- **Claves de `localStorage` con prefijo `ventel-`.** Las web apps de Apps Script comparten origen.

Detalle en [Sistema de diseño](../tecnico/SISTEMA-DE-DISENO.md).

---

## Al agregar una función nueva al servidor

- [ ] Prefijo de su capa.
- [ ] `_` al final si es privada.
- [ ] JSDoc si la llama el navegador.
- [ ] Control de identidad adentro si toca datos.
- [ ] No lanza si la llama el navegador.
- [ ] `cotCacheado_` si lee · `cotInvalidarCache_()` al final si escribe.
- [ ] `secEscapeHtml_()` en todo lo que vaya a HTML.
- [ ] Documentada en [Referencia de funciones](../tecnico/REFERENCIA-DE-FUNCIONES.md).

## Al agregar una columna a una hoja

- [ ] Se localiza por nombre.
- [ ] Se auto-crea si puede faltar en instalaciones viejas.
- [ ] Documentada en [Referencia de datos](../tecnico/REFERENCIA-DE-DATOS.md).
- [ ] Agregada a `revisionMaestra()` si es obligatoria.

---

## Antes de entregar

- [ ] `verificarVersionDelCodigo()` sin funciones en versión vieja.
- [ ] `revisionMaestra()` todo ✔.
- [ ] Probaste el flujo que tocaste, y el de al lado.
- [ ] Sin secretos en el código.
- [ ] Sin `console.log` ni `Logger.log` de depuración con PII.
- [ ] Comentarios en español.
- [ ] Documentación actualizada en el mismo cambio.
- [ ] Entrada en la [bitácora](BITACORA-DE-CAMBIOS.md).
