# Runbook

Qué hacer cuando algo falla. Está escrito para ejecutarse bajo presión, sin tener que pensar ni
buscar en otro lado.

**Regla de oro:** si algo se rompió en producción, **vuelve a la versión anterior primero** y
diagnostica después. Revertir toma segundos y la URL no cambia.

---

## Los tres comandos de diagnóstico

Casi todo se resuelve con estos. Se ejecutan desde el editor de Apps Script.

| Función | Qué te dice | Cuándo |
|---|---|---|
| **`revisionMaestra()`** | Estado de las dos bases, sus columnas, formatos, correo, calendario, caché y secretos. Cada línea con ✔ o ✖. | **Siempre primero.** Ante cualquier falla. |
| **`verificarVersionDelCodigo()`** | Si el código que corre es el que subiste. | Cuando "arreglé esto y sigue fallando". |
| **`secDiagnostico(correo)`** | Qué modo de identidad está activo y qué resolvió el sistema. | Cuando alguien dice "no me reconoce". |

También: `cotCacheDiagnostico()` para la caché y `probarAccesoCcl()` para el formato CCL.

Con rol avanzado, la revisión maestra también corre desde el panel de supervisión, sin abrir el
editor.

---

## Nadie puede entrar

**Síntomas:** la pantalla de login rechaza a todos, o lanza error de columnas.

1. `revisionMaestra()` → mira la sección de la BD de Cotizaciones.
2. **Si dice que faltan columnas en `Registros`**: alguien renombró o borró una. Tienen que existir
   `Nombre`, `Email`, `PasswordHash` y `Avanzado`, con ese nombre exacto. Restáuralas.
3. **Si dice que no hay hoja ligada**: el script se desvinculó de la hoja. Revisa que se abra desde
   *Extensiones → Apps Script* de la BD correcta.
4. **Si todo sale ✔ pero el login falla**: revisa que `HASH_SALT` no haya cambiado. Si cambió, todas
   las contraseñas quedaron inválidas y hay que restablecerlas.

> **Nunca cambies `HASH_SALT` sin plan.** Invalida todas las contraseñas del sistema.

---

## Una persona no puede entrar

1. **¿Está bloqueada?** 8 intentos fallidos bloquean el correo 15 minutos. Se limpia solo.
2. **¿Está dada de alta?** Busca su correo en `Registros`, en minúsculas.
3. **¿El correo está normalizado?** Registros viejos pueden tener mayúsculas o espacios. El login
   normaliza al comparar, así que no debería importar; si sospechas, corrígelo en la hoja.
4. **`secDiagnostico(sucorreo)`** → dice qué correo declara el navegador y cuál resolvió el sistema.
5. **Se le olvidó la contraseña:** no hay recuperación automática. Borra su fila de `Registros` y
   que se registre de nuevo. Pierde el vínculo con sus cotizaciones anteriores solo si cambia de
   correo.

---

## Ve el dashboard normal y debería ver el panel avanzado

1. Verifica que su fila en `Registros` tenga `Si` en `Avanzado`. Acepta `si`, `SI`, `Sí`.
2. **Que salga y vuelva a entrar.** El rol se lee al iniciar sesión.
3. Si sigue igual: `secDiagnostico(sucorreo)` → confirma qué correo está resolviendo el sistema.
   Puede estar entrando con otro.

---

## "No pudimos abrir esta pantalla"

Es la pantalla de error controlada. El detalle técnico viene abajo del mensaje.

1. **Pídele al usuario la hora exacta y qué estaba haciendo.**
2. Editor → *Ver → Ejecuciones*, filtra por esa hora.
3. Causas más comunes:

| Detalle | Causa | Solución |
|---|---|---|
| "no se encontró el archivo" | Un `include()` con nombre mal escrito, o falta un `.html` | Revisa nombres. Distinguen mayúsculas. |
| Error de hoja | La hoja del Portal no abre | Verifica `PORTAL_SHEET_ID` y los permisos. |
| Tiempo de ejecución excedido | Lectura muy pesada | Revisa que la caché esté funcionando. |

---

## El Portal sale vacío o incompleto

1. `revisionMaestra()` → sección BD del Portal.
2. **Sin acceso a la hoja:** verifica `PORTAL_SHEET_ID` y que la cuenta que despliega tenga acceso.
3. **Una sección vacía y las demás bien:** esa hoja no existe o le falta su columna llave.
   Cada hoja tiene una: `Nombre` en Herramientas, `ACCESO` en Formatos, `Titulo` en Plantillas.
   Ver [Referencia de datos](../tecnico/REFERENCIA-DE-DATOS.md).
4. **Se ve contenido viejo:** la caché del Portal dura 10 minutos. Espera o corre
   `portalInvalidarCacheAnuncios_()`.

> El Portal **solo cachea si la respuesta salió bien**. Si ves contenido viejo, la última lectura
> fue correcta: el problema es de propagación, no de acceso.

---

## Un anuncio publicado no aparece

En este orden:

1. **¿Está activo?**
2. **¿Su fecha de publicación ya pasó?** Vacía significa "ya".
3. **¿Está expirado?** `Hasta` es inclusiva de todo su día.
4. **¿El formato es válido?** Solo `banner`, `destacado`, `tarjeta` y `modal`. Cualquier otro valor
   y la fila se ignora en silencio.
5. **¿El JSON de `Datos` está bien formado?** Si está roto, el anuncio sale sin contenido.
6. **Espera 10 minutos** o invalida la caché.

---

## Los correos no salen

### Salen desde la cuenta personal en lugar del alias

El alias `cotizacion@liverpool.com.mx` no está dado de alta como *Enviar como* **en la cuenta que
despliega el script**. Dalo de alta ahí. El correo sale igual mientras tanto.

Verifica con `getMailSenderInfo()`.

> Esa consulta se cachea 6 h por usuario, pero **solo cuando el alias existe**. Si aún no está
> configurado, no se cachea: en cuanto lo des de alta, la pantalla lo refleja de inmediato.

### No sale ninguno

1. `revisionMaestra()` → sección de correo.
2. **¿Cuota agotada?** Apps Script tiene tope diario de envíos. Se reinicia a medianoche
   (hora del Pacífico). No hay forma de subirlo.
3. **¿Permisos revocados?** Vuelve a ejecutar `revisionMaestra()` desde el editor y reautoriza.

### Muchos aparecen "con error" en las métricas

Mira la columna `Detalle` de `MetricasCorreos`. Casi siempre: correo de cliente mal escrito, o
cuota. Si es cuota, se ve como una subida repentina a la misma hora.

---

## El PDF no se genera

### Formato "Actual"

1. ¿El folio existe en `Cotizaciones`?
2. ¿Tiene productos en `DetalleCotizaciones`?
3. Si tarda mucho: puede ser la verificación de imágenes. `getVerifiedImageUrl` prueba varios
   subdominios; si ninguno responde, se demora.

### Formato "CCL Liverpool"

1. **`probarAccesoCcl()`** → te dice exactamente qué falta.
2. Causas típicas:
   - `CCL_TEMPLATE_SHEET_ID` incorrecto.
   - La plantilla no tiene una pestaña llamada `Liverpool`.
   - La cuenta que despliega no tiene acceso a la plantilla.
3. **Si el PDF sale con el formato descuadrado**, ajusta `CCL_EXPORT_OPTIONS` en `Formatos.gs`. Ese
   objeto replica la configuración de impresión de la plantilla.

### No aparece ningún formato en el selector

Los dos están apagados o ninguno está disponible. Entra al panel de supervisión → *Formatos de
Cotización*. El sistema no deja apagar el último, así que casi siempre es disponibilidad, no estado.

---

## "Guardé y sigue saliendo lo anterior"

Es el síntoma clásico de caché no invalidada.

1. Botón **Actualizar** en la pantalla. Fuerza la relectura.
2. `cotCacheDiagnostico()` → mira la generación actual.
3. Haz una escritura y vuelve a mirar. **La generación tiene que subir.**
4. Si no sube: alguna función de escritura no llama `cotInvalidarCache_()` al final. Búscala y
   agrégala.

> La caché nunca es la causa de que algo *no funcione*. Quitarla entera solo hace la app más lenta.
> Si algo está mal y sospechas de la caché, el bug está en la invalidación, no en la caché.

---

## "Arreglé esto y sigue fallando"

**Casi siempre hay un archivo `.gs` duplicado** en el proyecto — una copia de respaldo. Todos los
`.gs` comparten el ámbito global y la última definición gana, en silencio.

1. `verificarVersionDelCodigo()`.
2. Si alguna función sale como "VERSIÓN VIEJA", busca la copia en la lista de archivos del editor.
3. Bórrala.
4. Vuelve a correrla.

**Segunda causa:** subiste el archivo pero no creaste versión nueva de la implementación. La web app
sigue sirviendo la versión anterior.

---

## El sistema va lento

1. `cotCacheDiagnostico()` → ¿la caché está guardando algo?
2. **¿Creció mucho la hoja `Cotizaciones`?** Las lecturas leen la hoja completa. La caché lo
   amortigua, pero llegado un punto conviene archivar por año.
3. Editor → *Ver → Ejecuciones* → mira los tiempos. Ahí se ve qué función se está tardando.
4. **El formato CCL es lento por diseño**: copia una hoja, la llena y la exporta. No es una falla.

---

## Alguien reporta un enlace roto del Portal

1. Abre la hoja `Reportes` del Portal.
2. Ahí está la sección, el nombre, el enlace y quién lo reportó.
3. Corrige el enlace en la hoja que corresponda.
4. Espera 10 minutos o invalida la caché del Portal.

---

## Emergencia: hay que cerrar el sistema

Si sospechas un uso indebido o una fuga:

1. **Editor → *Implementar → Gestionar implementaciones → Archivar.*** La URL deja de responder de
   inmediato.
2. **Rota el webhook de Chat** si sospechas que se usó.
3. **Revisa `MetricasCorreos`** — ahí está todo lo que salió, con quién y a quién.
4. **Revisa la hoja `Anuncios`** — la columna `Autor` dice quién publicó qué.
5. **Avisa al responsable técnico y a coordinación.**
6. No borres nada: los registros son la evidencia.

---

## Antes de dar por resuelto un incidente

- [ ] `revisionMaestra()` sale todo ✔.
- [ ] Probaste el flujo que falló, con una cuenta real.
- [ ] Le avisaste a quien reportó.
- [ ] Anotaste qué pasó y qué lo causó en la
      [bitácora de cambios](../contribuir/BITACORA-DE-CAMBIOS.md).
- [ ] Si fue algo que puede repetirse, agregaste el caso a este runbook.

---

## Contactos

| Para qué | Quién |
|---|---|
| Cualquier falla técnica | David Martínez · `dmartineza02@liverpool.com.mx` |
| Decisión operativa durante un incidente | Ver [Equipo y roles](../proyecto/EQUIPO-Y-ROLES.md) |
| Falla de seguridad | Directo al responsable técnico. **No la publiques.** Ver [Seguridad](SEGURIDAD.md). |
