# Referencia de datos

Cada hoja, cada columna, quién la escribe y quién la lee. Para consultar cuando vayas a tocar una
hoja o a entender de dónde sale un dato.

**Regla que aplica a todo:** el código localiza las columnas **por nombre**, nunca por posición.
Puedes reordenar columnas o insertar nuevas sin romper nada. Lo que sí rompe es **renombrar** una
columna que el código busca.

---

## Las dos bases

| Base | Cómo se abre | Qué contiene |
|---|---|---|
| **BD de Cotizaciones** | Hoja **ligada** al script (`SpreadsheetApp.getActiveSpreadsheet()`) | Usuarios, cotizaciones, detalle, métricas, bitácora |
| **Hoja del Portal** | **Por ID** — propiedad `PORTAL_SHEET_ID` | Contenido del Portal, promociones, anuncios, reportes |

Están separadas a propósito: el contenido del Portal lo administra gente del área, y no debe
compartir archivo con la base que guarda PII de clientes.

---

# BD de Cotizaciones

## Hoja `Registros`

Usuarios del sistema. Es la fuente de verdad de quién existe y quién es avanzado.

| Columna | Tipo | Obligatoria | Para qué |
|---|---|:--:|---|
| *(primera columna)* | Fecha | — | Marca de tiempo del alta. Se llena sola. |
| `Timestamp` | Fecha | — | Alternativa al anterior, si existe. |
| `Fecha` | Fecha | — | Ídem. |
| `Nombre` | Texto | **Sí** | Nombre del asesor. Sale en cotizaciones y reportes. |
| `Email` | Texto | **Sí** | Correo normalizado: minúsculas, sin espacios. Es la llave. |
| `PasswordHash` | Texto | **Sí** | Hash de la contraseña. Nunca texto claro. |
| `Avanzado` | Texto | **Sí** | `Si` / `No`. Acepta `si`, `SI`, `Sí`. Cualquier otra cosa es `No`. |

**Escribe:** `registerUser()`.
**Lee:** `loginUser()`, `secBuscarRegistro_()`, `secIdentidad_()`, `secIdentidadAvanzada_()`.

> Si falta `Nombre`, `Email`, `PasswordHash` o `Avanzado`, el login lanza error explícito. Esas
> cuatro no son negociables.

**Para dar rol avanzado:** escribe `Si` en `Avanzado` y pide a la persona que vuelva a entrar.

---

## Hoja `Cotizaciones`

Una fila por cotización.

| Columna | Tipo | Para qué |
|---|---|---|
| `Folio` | Texto | `LVP-AAMMDD-NNNN`. Llave primaria. **Debe ser la primera columna** — el generador de folios lee la columna 1. |
| `Timestamp` | Fecha | Cuándo se generó. |
| `AsesorCorreo` | Texto | El asesor de la **sesión del portal**, no la cuenta de Google. |
| `AsesorNombre` | Texto | Nombre del asesor. |
| `Extencion` | Texto | Extensión telefónica. *(El nombre lleva la errata original; renombrarla rompe el guardado.)* |
| `ClienteNombre` | Texto | Nombre del cliente. **PII.** |
| `CorreoCliente` | Texto | Correo del cliente. **PII.** |
| `Numero` | Texto | Teléfono del cliente. **PII.** |
| `Subtotal` | Número | Base gravable. |
| `IVA` | Número | 16%. |
| `TotalGeneral` | Número | Total a pagar. |
| `Estatus` | Texto | `Folio Generado`, `Enviada`… |
| `Observaciones` | Texto | Lo que el asesor escribió. Sale en PDF y correo. |
| `LinkPDF` | Texto | Enlace al PDF. **Solo se escribe si llega uno**: guardarlo vacío borraría el anterior. |
| `Formato` | Texto | `actual` o `ccl_liverpool`. **Auto-creada** si falta. |
| `LinkSheetCCL` | Texto | Enlace a la hoja CCL generada. La escribe `Formatos.gs`. |

**Escribe:** `saveQuoteDataToSheets()`, `setQuoteColumnValue_()`.
**Lee:** `getQuotesForUser()`, `getQuoteDetails()`, `getDashboardStats()`, `getSupervisionQuotes()`,
`Formatos.gs`, `Correos.gs`.

### Dos comportamientos que hay que conocer

**Se preservan las fórmulas.** Al actualizar una fila, las columnas que la función no maneja se
releen con `getFormulas()`. Si una celda tiene fórmula, se devuelve la fórmula, no su resultado.
Reescribir el valor calculado la convertiría en dato muerto.

**Se preservan las columnas ajenas.** Actualizar una cotización no borra `LinkSheetCCL` ni ninguna
otra columna que escriba otro módulo.

**Validación mínima:** si al armar la fila se localizan menos de 5 columnas por nombre, la función
lanza. Es el freno contra una hoja con encabezados equivocados.

---

## Hoja `DetalleCotizaciones`

Una fila por producto. Relación 1:N con `Cotizaciones`.

| Columna | Tipo | Para qué |
|---|---|---|
| `FolioCotizacion` | Texto | Llave foránea al `Folio`. **Obligatoria.** |
| `SKU` | Texto | Código del producto. |
| `DescripcionProducto` | Texto | Nombre del producto. |
| `Cantidad` | Entero | Piezas. |
| `PrecioUnitarioBase` | Número | Precio de una pieza. |
| `CostoPagoUnicoLinea` | Número | Si es > 0, **manda sobre los descuentos**. |
| `DescPublicoPorcentaje` | Número | Descuento público, %. |
| `AplicaDescAdicional` | Texto | `Si` / `No`. |
| `PorcentajeDescAdicional` | Número | Descuento adicional, %. |
| `ImagenUrl` | Texto | Imagen del producto. **Auto-creada** si falta. |

**Escribe:** `saveQuoteDataToSheets()` — **borra y reinserta** todas las filas del folio en cada
guardado.
**Lee:** `leerDetalleCotizacion_()`, `generateQuoteHtml()`, `fillCclSheet_()`.

> **No pongas fórmulas en esta hoja.** Las filas se eliminan y se vuelven a crear en cada guardado;
> cualquier fórmula se pierde.

### Cómo se calcula una línea

```
precioVolumen = PrecioUnitarioBase × Cantidad

si CostoPagoUnicoLinea > 0:
    totalLinea = CostoPagoUnicoLinea          ← termina aquí
si no:
    tras público  = precioVolumen × (1 − DescPublicoPorcentaje/100)
    si AplicaDescAdicional = 'Si':
        totalLinea = trasPúblico × (1 − PorcentajeDescAdicional/100)
    si no:
        totalLinea = trasPúblico

descuentoTotal = precioVolumen − totalLinea
```

El adicional se aplica **sobre el precio ya con descuento público**, no sobre el original.

---

## Hoja `MetricasCorreos`

Registro unificado de **todos** los envíos, de los dos canales. Es la fuente única para métricas.
Se crea sola con sus encabezados si no existe.

| Columna | Para qué |
|---|---|
| `Fecha` | Cuándo salió. |
| `Tipo` | Canal o plantilla usada. |
| `Referencia` | Folio, cuando aplica. |
| `AsesorEmail` | Quién envió. |
| `AsesorNombre` | Su nombre. |
| `Para` | Destinatario principal. |
| `Destinatarios` | Todos, separados por coma. |
| `CC` | Con copia. |
| `CCO` | Copia oculta. |
| `Asunto` | Asunto enviado. |
| `Adjuntos` | Cuántos. |
| `Remitente` | Cuenta desde la que salió. |
| `AliasUsado` | Si se usó el alias institucional. |
| `Resultado` | Se considera exitoso si contiene `enviad`. |
| `Detalle` | Mensaje de error, cuando lo hubo. |

**Escribe:** `metRegistrarEnvio_()` — **nunca lanza**. Si falla, solo lo anota en el `Logger`: el
correo ya salió y no tiene sentido tumbar la operación por el registro.
**Lee:** `calcularResumenMetricas_()` → panel de supervisión.

El resumen agrega por tipo, por día (últimos 30) y por asesor, más los últimos 20 envíos.

---

## Hoja `CorreosEnviados`

Bitácora específica de correos de plantilla. **Es aditiva**: no reemplaza a `MetricasCorreos`,
convive con ella. Se creó antes y se conservó.

Columnas: `Fecha` · `Plantilla` · `Para` · `CC` · `CCO` · `Asunto` · `Asesor` · `Remitente` ·
`Adjuntos`.

**Escribe:** `registrarCorreoClienteEnviado_()`. Se crea sola.

---

# Hoja del Portal

Se abre por ID. Todas sus hojas se leen con búsqueda **flexible** de encabezado: el código busca que
el nombre de la columna *contenga* cierta palabra, así que `Liga`, `LIGA`, `Enlace`, `Link` y `URL`
funcionan igual.

## `Herramientas`

| Columna | Alias que acepta | Para qué |
|---|---|---|
| `Nombre` | `nombre` | **Llave.** Sin esto la fila se ignora. |
| `Enlace` | `enlace`, `liga`, `link`, `url` | A dónde lleva. |
| `Como acceder` | `acceder`, `acceso`, `como` | Cómo se entra. |
| `Descripcion` | `descrip` | Para qué sirve. |
| `Claves` | `clave` | Términos extra para el buscador. |

## `Presentaciones`

`Nombre` *(llave)* · `LIGA` · `DESCRIPCION`.

## `Paqueterias`

`Nombre` *(llave)* · `Liga` · `Soms` (`soms`, `sistema`).

## `Formatos`

`ACCESO` *(llave — acepta `nombre`, `formato`)* · `OBSERVACIONES` · `LIGA`.

## `PdePago`

`Nombre` *(llave)* · `Detalles` · `Liga` (acepta `simulad`).

## `Plantillas`

`Titulo` *(llave)* · `Tipo` · `Asunto` · `Cuerpo` · `Consideraciones` (acepta `escalam`, `copia`,
`observ`).

## `Anuncios`

Publicaciones del Portal. Una fila por anuncio. Se crea sola con encabezados en negrita y fila
congelada.

| Columna | Tipo | Para qué |
|---|---|---|
| `ID` | Texto | `anc-<base36>`. Se genera solo. Llave. |
| `Formato` | Texto | `banner`, `destacado`, `tarjeta` o `modal`. Otro valor y la fila se ignora. |
| `Activo` | Booleano/Texto | Vacío, `true`, `si`, `sí`, `1`, `x`, `activo` cuentan como activo. |
| `Orden` | Número | **Menor sube.** |
| `Desde` | Fecha | Publicación programada. Vacío = ya. |
| `Hasta` | Fecha | Expiración. **Inclusiva de todo su día.** |
| `Datos (JSON)` | Texto | **El contenido.** Ver abajo. |
| `Autor` | Texto | Correo de quien publicó. |
| `Creado` | Fecha | Cuándo. |

### El JSON de `Datos`

Cada formato usa las claves que necesita. Ninguna es obligatoria a nivel de hoja.

```json
// banner
{ "tono": "info|exito|urgente", "mensaje": "...", "icono": "..." }

// destacado · tarjeta · modal
{
  "titulo": "...",
  "descripcion": "...",
  "cuerpo": "...",
  "imagen": "https://...",
  "vigencia": "3 al 15 de junio",
  "boton":  { "texto": "...", "url": "https://..." },
  "boton2": { "texto": "...", "url": "https://..." }
}
```

Si el JSON está mal formado, el anuncio se muestra **sin contenido** en lugar de tumbar el Portal.

**Escribe:** `publicarAnuncio()`, `eliminarAnuncio()`, `toggleAnuncio()`, `moverAnuncio()`.
**Lee:** `readPortalAnuncios_()`.

### Cuándo se ve un anuncio

Las tres condiciones, juntas:

1. `Activo` verdadero.
2. `Desde` vacío o ya pasó.
3. `Hasta` vacío, o es hoy o después.

## `Avisos` *(legado)*

Hoja anterior a `Anuncios`. Se sigue leyendo por compatibilidad y sus filas se convierten a formato
`banner`, con orden 1000+ para que queden debajo de los anuncios nuevos.

Columnas: `Mensaje` (o `aviso`, `texto`) · `Tipo` · `Hasta`.

**Migra lo que quede aquí a `Anuncios` y deja de usarla.**

## `Promociones`

| Columna | Cómo se busca |
|---|---|
| `Direccion` | contiene `direcci` |
| `Banner / Carrusel` | contiene `banner / carrusel` |
| `Promoción 2026` | contiene `promoción 2026` |
| `Desc MKP` | contiene `desc mkp` |
| `Marca` | contiene `marca` |
| `Vigencia` | contiene `vigencia` |
| `Liga` | contiene `liga` |

> **Ojo:** `Promoción 2026` lleva el año en el nombre. Al cambiar de año hay que actualizar la hoja
> **y** el código (`Portal.gs`). Es deuda técnica conocida.

Una fila se ignora si no tiene ni `Direccion` ni `Banner / Carrusel`.

## `MKP`

Marketplace. Mismas columnas, más `Promoción mktplace`. Todo lo de aquí se etiqueta con marca
`Marketplace`.

### Vigencias

El texto de `Vigencia` se interpreta para saber si la promoción está activa y si le quedan ≤ 3 días.
Si el texto no se puede interpretar, la promoción se muestra pero no cuenta en el widget
*"Hoy en promociones"*.

## `Reportes`

Enlaces rotos reportados desde el Portal. Se crea sola.

`Fecha` · `Sección` (200 car.) · `Nombre` (200 car.) · `Enlace` (500 car.) · `Usuario`.

**Escribe:** `reportBrokenLink()` — máximo 20 por usuario por hora.

Es la **única escritura abierta** del Portal, y el Portal es accesible a todo el dominio. De ahí el
tope.

---

# Fuera de las hojas

## Propiedades del script

Ver [Arquitectura técnica §6.2](ARQUITECTURA-TECNICA.md#62-configuración-y-secretos).

## Caché

| Ámbito | Qué guarda | TTL |
|---|---|---|
| Script | Cotizaciones, búsquedas, supervisión, métricas | 90 s – 600 s, con generación |
| Script | Contenido del Portal (`toolsData_v1`) | 600 s |
| Script | Contadores de intentos de login y de reportes | Su ventana |
| Usuario | Alias de Gmail (`mail_sender_v1`) | 6 h |

Los valores > 90 KB se guardan troceados, hasta 20 trozos (~1.8 MB). Más que eso se sirve sin caché.

## Google Drive

| Carpeta | Contenido |
|---|---|
| `Cotizaciones CCL generadas` | Las hojas CCL generadas por folio. |
| `Portal Ventel` | Imágenes de anuncios. Se abre por ID; el nombre es el respaldo. |

## `localStorage` del navegador

| Clave | Qué guarda |
|---|---|
| `ventel-theme` | `aurora`, `slate`, `carbon` |
| `ventel-density` | `cozy`, `compact` |
| `ventel-textscale` | `sm`, `md`, `lg`, `xl` |
| `ventel-contrast` | `0`, `1` |
| `ventel-*` (sesión y caché de `AppCache`) | Sesión del portal y datos con TTL |

El prefijo `ventel-` no es cosmético: las web apps de Apps Script comparten origen
(`*.googleusercontent.com`), y una clave genérica chocaría con la de otro script.
