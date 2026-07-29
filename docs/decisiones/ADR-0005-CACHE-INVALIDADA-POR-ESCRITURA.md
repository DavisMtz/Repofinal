# ADR-0005 — Caché invalidada por escritura, no por tiempo

| | |
|---|---|
| **Estado** | Aceptada |
| **Fecha** | 2026 |
| **Decide** | David Martínez |

## Contexto

Con Google Sheets como base ([ADR-0002](ADR-0002-GOOGLE-SHEETS-COMO-BASE-DE-DATOS.md)) no hay
índices: **cada pantalla que se abría releía la hoja completa** con `getDataRange().getValues()`.

Con unos cientos de folios eso son segundos de espera en cada carga, y cuota de Apps Script
consumida — sobre datos que cambian pocas veces al día.

Cachear era obvio. **Cachear mal, también era obvio:** el clásico *"guardé la cotización y sigue
saliendo la anterior"* es peor que la lentitud. Una herramienta lenta molesta; una herramienta que
miente se deja de usar.

## Decisión

Una capa única de caché en **`Cache.gs`**, con prefijo `cot*`, que **invalida por escritura, no por
tiempo**.

El mecanismo es una **generación**: un contador en Script Properties que forma parte de **todas** las
claves de caché.

```
clave = 'cot' + generación_actual + ':' + nombre_del_dato
```

Toda función que escribe en la base llama `cotInvalidarCache_()`, que incrementa la generación. La
siguiente lectura arma una clave distinta, no encuentra nada y va a la hoja. **Las claves viejas
dejan de existir sin tener que borrarlas.**

El TTL se conserva **además** de eso, como red de seguridad por si alguien edita la hoja a mano.

### Las cuatro reglas que hacen que esta caché no pueda mentir

1. **Invalidación por escritura.** Es lo único que evita el "guardé y sigue saliendo lo anterior".
2. **TTL corto además de lo anterior**, por si alguien edita la hoja directo.
3. **Nunca se cachea una respuesta de error ni una operación de escritura.**
4. **Si `CacheService` falla o el valor no cabe, se sirve leyendo la hoja.** La caché jamás es la
   causa de que algo no funcione: quitarla entera solo hace la app más lenta.

### TTL por tipo de dato

| Dato | TTL | Por qué |
|---|---|---|
| `listaAsesor` | 180 s | El asesor quiere ver lo suyo recién guardado. |
| `busqueda` | 90 s | Barrido completo + tolerancia a errores de dedo: lo más caro de todo. |
| `supervision` | 240 s | Mismo dato para todos los avanzados. |
| `metricas` | 600 s | Agregado de 30 días, tolera estar un rato viejo. |
| `remitente` | 21600 s | Los alias de Gmail casi nunca cambian. |

### Y una regla de orden

**`cotInvalidarCache_()` se llama al FINAL de la escritura, nunca antes.** Si algo de la escritura
falla, la caché vigente sigue siendo la verdad.

## Alternativas descartadas

**Solo TTL, sin invalidación.**
Lo más simple, y exactamente el bug que se quería evitar. Un TTL lo bastante corto para no mentir
deja de servir como caché.

**Borrar las claves una por una al escribir.**
`CacheService` no permite listar claves. Habría que llevar un registro de qué se guardó — más estado
que mantener, y con su propio riesgo de desincronizarse. La generación resuelve lo mismo con un
contador.

**Cachear en el navegador y ya.**
`AppCache` existe y ayuda, pero no baja la carga del servidor: cada usuario nuevo vuelve a leer la
hoja completa. Se usan las dos capas.

**No cachear.**
Es lo que había. Segundos de espera por pantalla y cuota consumida sin necesidad.

## Consecuencias

**A favor**

- **No puede servir datos viejos después de una escritura.** Es la propiedad que se buscaba.
- **Las pantallas cargan rápido** sin releer la hoja completa.
- **Menos cuota consumida**, que en Apps Script es un recurso finito.
- **Un solo lugar donde está la lógica**, con TTL declarados en una tabla.
- **Degrada sin romper.** Si la caché falla, todo sigue funcionando más lento.
- **Diagnosticable:** `cotCacheDiagnostico()` muestra la generación y qué hay guardado.

**En contra**

- **Una escritura invalida TODO**, no solo lo que cambió. Es deliberado: la invalidación selectiva
  es donde nacen los bugs de caché. Con el volumen actual, el costo es despreciable.
- **Una lectura de propiedades por ejecución** para conocer la generación. Se memoriza en memoria
  para no repetirla.
- **Los valores grandes hay que trocearlos.** `CacheService` tope ~100 KB por valor; el código
  parte en trozos de 90 KB, hasta 20 (~1.8 MB). Más que eso se sirve sin caché.
- **Si alguien edita la hoja a mano, la caché no se entera.** De ahí el TTL de respaldo.
- **Es una regla que hay que recordar:** toda escritura nueva tiene que llamar
  `cotInvalidarCache_()`. Si se olvida, vuelve el bug.

**Qué obliga a hacer**

- **Toda lectura nueva se envuelve en `cotCacheado_()`.** No inventes tu propia caché.
- **Toda escritura llama `cotInvalidarCache_()` al final.**
- **Nunca caches una respuesta de error.** El parámetro `aceptar` está para eso.
- El Portal tiene su propia caché, más simple: 10 minutos por llave, sin generación. También **solo
  cachea si la respuesta salió bien**.

## Cuándo revisar esto

Si el volumen de escrituras sube tanto que invalidar todo en cada una deja de ser gratis. En ese
caso, la evolución natural es una generación **por tipo de dato** en lugar de una global — no
invalidación selectiva por clave, que es donde vuelven los bugs.
