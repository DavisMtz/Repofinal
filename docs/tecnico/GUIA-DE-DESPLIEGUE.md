# Guía de despliegue

Cómo dejar el Sistema Integral Ventel corriendo desde cero, y cómo publicar un cambio sin romper lo
que ya funciona. Para el responsable técnico.

**Antes de empezar, léelo completo.** Hay dos pasos que si se saltan dejan el sistema a medias sin
avisar: la migración de secretos y `revisionMaestra()`.

---

## Lo que necesitas

- Una cuenta de Google Workspace del dominio, **con permisos para publicar web apps**.
- Acceso de edición a las dos hojas de cálculo.
- El alias `cotizacion@liverpool.com.mx` dado de alta como *Enviar como* **en esa cuenta**.
- La plantilla de Google Sheets del formato CCL.
- Una carpeta de Drive para las imágenes de anuncios.
- El espacio de Google Chat donde llegan los avisos de folio nuevo.

> **La cuenta que despliega es la que ejecuta todo.** El proyecto usa `executeAs: USER_DEPLOYING`.
> Si esa cuenta no tiene el alias, los correos salen desde ella. Si no tiene acceso a la hoja del
> Portal, el Portal se cae. Elige bien la cuenta y no la cambies a la ligera.

---

## Despliegue desde cero

### 01 PREPARA LAS HOJAS

**BD de Cotizaciones** — la que se liga al script. Crea estas hojas con sus encabezados exactos:

| Hoja | Columnas mínimas |
|---|---|
| `Registros` | `Nombre`, `Email`, `PasswordHash`, `Avanzado` |
| `Cotizaciones` | `Folio` **(primera columna)**, `Timestamp`, `AsesorCorreo`, `AsesorNombre`, `Extencion`, `ClienteNombre`, `CorreoCliente`, `Numero`, `Subtotal`, `IVA`, `TotalGeneral`, `Estatus`, `Observaciones`, `LinkPDF` |
| `DetalleCotizaciones` | `FolioCotizacion`, `SKU`, `DescripcionProducto`, `Cantidad`, `PrecioUnitarioBase`, `CostoPagoUnicoLinea`, `DescPublicoPorcentaje`, `AplicaDescAdicional`, `PorcentajeDescAdicional` |

`MetricasCorreos`, `CorreosEnviados`, `Formato` e `ImagenUrl` se crean solas. `Folio` **tiene que
ser la primera columna**: el generador de folios lee la columna 1.

**Hoja del Portal** — un archivo aparte. Hojas: `Herramientas`, `Presentaciones`, `Paqueterias`,
`Formatos`, `PdePago`, `Plantillas`, `Promociones`, `MKP`. `Anuncios` y `Reportes` se crean solas.

Columna por columna en [Referencia de datos](REFERENCIA-DE-DATOS.md).

### 02 CREA EL PROYECTO DE APPS SCRIPT

1. Abre la **BD de Cotizaciones** → *Extensiones → Apps Script*. Queda ligado a esa hoja.
2. Sube los 9 archivos `.gs` y los 23 `.html` **con el mismo nombre**. Los `include()` los buscan por
   nombre exacto.
3. Reemplaza `appsscript.json`:

```json
{
  "timeZone": "America/Mexico_City",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/script.send_mail",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://mail.google.com/"
  ],
  "webapp": { "executeAs": "USER_DEPLOYING", "access": "DOMAIN" }
}
```

> **No dejes archivos `.gs` duplicados** —ninguna copia de respaldo—. Todos comparten el ámbito
> global y la última definición gana en silencio. Es la causa número uno de "arreglé esto y sigue
> fallando". `verificarVersionDelCodigo()` lo detecta.

### 03 CONFIGURA LOS SECRETOS

**Este es el paso que más se salta y el que más caro sale.**

1. En el editor, abre `Seguridad.gs` y pon los valores reales dentro de
   `secGuardarConfiguracion()`.
2. Ejecútala **una vez**.
3. Verifica en *Configuración del proyecto → Propiedades del script* que estén todas.
4. **Vacía las constantes** de `Code.gs` y `Portal.gs`:

```javascript
const HASH_SALT  = "";
const WEBHOOK_URL = "";
```

5. Borra los valores reales de `secGuardarConfiguracion()` antes de guardar el archivo.

Propiedades del proyecto:

| Propiedad | Qué es | Obligatoria |
|---|---|:--:|
| `HASH_SALT` | Sal del hash de contraseñas | **Sí** |
| `WEBHOOK_URL` | Webhook de Google Chat | No |
| `PORTAL_SHEET_ID` | ID de la hoja del Portal | **Sí** |
| `PORTAL_CALENDAR_ID` | Calendario de promociones | No |
| `PORTAL_ANUNCIOS_FOLDER_ID` | Carpeta de imágenes de anuncios | No |
| `CCL_TEMPLATE_SHEET_ID` | Plantilla del formato CCL | Solo si usas CCL |
| `AUTH_MODO` | `portal` (predeterminado), `auto`, `estricto`, `legado` | No |

> **`HASH_SALT` no se cambia después.** Cambiarla invalida **todas** las contraseñas y obliga a que
> todos se registren de nuevo. Si tienes que rotarla, planea el restablecimiento masivo en el mismo
> movimiento.

### 04 AUTORIZA Y VERIFICA

Ejecuta **`revisionMaestra()`** desde el editor.

1. Google pide autorizar todos los permisos de una sola vez, porque la función toca todos los
   servicios que usa el sistema.
2. Abre *Ver → Registro de ejecución*.

Cada línea sale con ✔ o ✖. **No sigas mientras haya un ✖.** Cada uno dice exactamente qué falta.

### 05 PUBLICA

*Implementar → Nueva implementación → Aplicación web*:

| Campo | Valor |
|---|---|
| Ejecutar como | **Yo** (`USER_DEPLOYING`) |
| Quién tiene acceso | **Cualquier usuario de Liverpool** (`DOMAIN`) |

Copia la URL. Esa es la del Portal.

### 06 PRUEBA DE PUNTA A PUNTA

Antes de darle la URL a nadie:

- [ ] Abre la URL → carga el Portal con contenido.
- [ ] `?page=promociones` → promociones y calendario.
- [ ] Crea una cuenta de prueba.
- [ ] Entra con ella.
- [ ] Cotiza con dos productos, uno con descuento adicional.
- [ ] Verifica el folio: `LVP-AAMMDD-NNNN`.
- [ ] Descarga el PDF en los dos formatos.
- [ ] Envíate la cotización por correo. Confirma que llegó **desde el alias**.
- [ ] Manda un correo de plantilla.
- [ ] Pon `Si` en `Avanzado` de tu cuenta, vuelve a entrar y abre el panel.
- [ ] Publica un anuncio de prueba y bórralo.
- [ ] Corre el estado del sistema desde el panel: todo ✔.

---

## Publicar un cambio

### El flujo

1. **Trabaja en una rama.** Nunca en `main` directo.
2. **Prueba en un despliegue de prueba** antes que en el de producción.
3. **Sube los archivos cambiados** al editor.
4. **Corre `verificarVersionDelCodigo()`.** Si sale una función con "VERSIÓN VIEJA", hay un archivo
   duplicado. Bórralo.
5. **Corre `revisionMaestra()`.** Todo ✔.
6. *Implementar → Gestionar implementaciones → Editar → Nueva versión.*
7. **Vuelve a probar el flujo que tocaste**, en la URL real.
8. **Anota el cambio** en la [bitácora](../contribuir/BITACORA-DE-CAMBIOS.md).

> **La URL solo cambia si creas una implementación nueva en lugar de una versión nueva.** Edita la
> implementación existente y agrega versión: la URL se conserva y nadie tiene que actualizar sus
> accesos directos.

### Si tocaste hojas o columnas

**Corre `revisionMaestra()` sí o sí.** Es lo único que detecta una columna renombrada antes de que
la detecte un asesor.

### Si tocaste caché

Corre `cotCacheDiagnostico()` y confirma que la generación avanza tras una escritura.

---

## Volver atrás

*Implementar → Gestionar implementaciones → Editar → elige la versión anterior.*

Toma segundos y la URL no cambia. **Si algo se rompe en producción, vuelve atrás primero y
diagnostica después.**

Lo que **no** se revierte solo:

- Cambios de estructura en las hojas. Deshazlos a mano.
- Propiedades del script. Restáuralas a mano.
- Datos escritos por la versión mala. Quedan.

---

## Errores comunes

| Síntoma | Causa | Solución |
|---|---|---|
| "No pudimos abrir esta pantalla" | Falta un archivo HTML, o un `include()` con nombre mal escrito | Revisa nombres. El log dice cuál. |
| Los correos salen de la cuenta personal | El alias no está en la cuenta que despliega | Da de alta el alias en *esa* cuenta. |
| El Portal sale vacío | `PORTAL_SHEET_ID` mal, o sin acceso a la hoja | Verifica la propiedad y comparte la hoja. |
| El formato CCL no aparece | `CCL_TEMPLATE_SHEET_ID` mal, o falta la pestaña `Liverpool` | `probarAccesoCcl()` te dice cuál. |
| Login lanza error de columnas | Falta `Nombre`, `Email`, `PasswordHash` o `Avanzado` | Corrige los encabezados. |
| "Arreglé esto y sigue fallando" | Archivo `.gs` duplicado en el proyecto | `verificarVersionDelCodigo()` y borra la copia. |
| El panel avanzado no abre | La columna `Avanzado` no dice `Si` | Corrige y vuelve a entrar. |
| Se guardó y sigue saliendo lo anterior | La caché no se invalidó | La escritura debe llamar `cotInvalidarCache_()` al final. |
| El calendario no muestra eventos | `PORTAL_CALENDAR_ID` mal o sin permiso | Verifica y comparte el calendario. |

Más casos en el [Runbook](../operacion/RUNBOOK.md).

---

## Antes de abrir a producción

**El sistema no está listo para producción abierta.** Falta cerrar los hallazgos críticos:

- [ ] **C-01** — Rotar el webhook de Chat y la sal. Migrar secretos a propiedades. Vaciar las
      constantes.
- [ ] **C-02** — Resolver que la identidad la declara el navegador. Es el bloqueante mayor.
- [ ] **C-03** — Ver el [informe de seguridad](../../INFORME-SEGURIDAD.md).
- [ ] Servir GSAP y Chart.js locales, o con SRI y versión fijada.
- [ ] Cambiar el logotipo de los correos a `assets.liverpool.com.mx`.
- [ ] Restringir `getVerifiedImageUrl` a dominios permitidos.

Detalle y prioridad en [Seguridad](../operacion/SEGURIDAD.md).
