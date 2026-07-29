# ADR-0004 — Capa única de identidad y permisos

| | |
|---|---|
| **Estado** | Aceptada, **con riesgo abierto** |
| **Fecha** | 2026 |
| **Decide** | David Martínez |

> ⚠️ Esta decisión resolvió un problema real y dejó otro abierto. Léela completa antes de tocar
> `Seguridad.gs`. El riesgo está identificado, documentado y tiene fecha de cierre. Ver
> [Seguridad](../operacion/SEGURIDAD.md).

## Contexto

Al fusionar las tres herramientas ([ADR-0003](ADR-0003-HOMOLOGAR-TRES-HERRAMIENTAS-EN-UN-SOLO-SISTEMA.md)),
cada archivo resolvía por su cuenta —y de forma distinta— quién era el usuario y si tenía permisos:

| Archivo | Función | Cómo comparaba |
|---|---|---|
| `Code.gs` / `Formatos.gs` | `isAdvancedUser(email)` | `'Si'` exacto |
| `Metricas.gs` | `metVerificarAsesor_(email)` | `'Si'` exacto |
| `Portal.gs` | `portalGateAvanzado_(email)` | en minúsculas |

Tres definiciones de lo mismo, con criterios distintos. Un usuario con `sí` acentuado en la hoja
tenía permisos en el Portal y no en el resto. Y cualquier cambio en la regla había que hacerlo tres
veces, sin garantía de que las tres quedaran iguales.

Encima había una pregunta sin responder de forma consistente: **¿quién manda, la sesión del portal o
la cuenta de Google del navegador?** Un asesor puede tener abierta otra cuenta de Google y aun así
tener que trabajar con su usuario del portal.

## Decisión

Toda la identidad y todos los permisos pasan por **`Seguridad.gs`**, con prefijo `sec*`.

```
isAdvancedUser(email)      ─┐
portalGateAvanzado_(email)  ├─▶ secIdentidadAvanzada_(email) ─▶ columna 'Avanzado'
metVerificarAsesor_(email)  ┘                                    en Registros
```

Las tres funciones anteriores **se conservan como fachadas** que delegan. Ninguna pantalla tuvo que
cambiar.

Además se define **qué identidad manda**, configurable en la propiedad de script `AUTH_MODO`:

| Modo | Quién manda |
|---|---|
| `portal` *(predeterminado)* | El correo con el que se inició sesión en el portal. Debe estar en `Registros`. Sin correo declarado, cae a la cuenta de Google. |
| `auto` | La cuenta de Google si está registrada; si no, el correo del portal. |
| `estricto` | Solo la cuenta de Google, y debe estar registrada. Ignora el correo del portal. |
| `legado` | Como `portal`, sin respaldo. Compatibilidad. |

Se eligió `portal` como predeterminado, a propósito: la sesión de trabajo es la del portal, no la
del navegador.

## Alternativas descartadas

**Dejar cada archivo con su propia lógica.**
Es de donde se venía. Tres criterios distintos para la misma pregunta es una falla esperando
ocurrir.

**Usar solo la cuenta de Google (`Session.getActiveUser`) desde el inicio.**
Es lo correcto desde seguridad y es a donde hay que llegar. Se descartó **entonces** porque rompe el
caso real de un asesor con otra cuenta de Google abierta en el navegador: dejaría de poder trabajar
con su usuario del portal, sin explicación clara para él.

Esa alternativa es hoy la remediación recomendada del hallazgo C-02.

**Token de sesión firmado por el servidor.**
Lo correcto en una aplicación web normal. En Apps Script no hay dónde ponerlo: el HTML corre en un
iframe con sandbox, sin cookies propias y sin sesión de servidor. Habría que inventar un esquema
propio de tokens con almacenamiento en propiedades — costoso, frágil y fácil de hacer mal.

## Consecuencias

**A favor**

- **Una sola definición** de quién eres y de qué puedes hacer.
- **Tolerante en el dato, estricto en la lógica.** Acepta `Si`, `si`, `SI`, `Sí` — porque la hoja la
  llena una persona.
- **Correos normalizados** en un solo lugar: minúsculas, sin espacios. Antes, quien se registraba
  con mayúsculas no podía volver a entrar.
- **La regla se cambia en un archivo** y aplica a todo el sistema.
- **El modo de autenticación es configuración, no código.** Cambiar de `portal` a `estricto` es una
  llamada a `secFijarModoAuth()`, sin redesplegar.
- **Concentra también** el hash, el freno de fuerza bruta, el escape de HTML, la comparación en
  tiempo constante y la lectura de configuración sensible.
- **Diagnóstico incluido:** `secDiagnostico(correo)` dice qué modo está activo y qué resolvió el
  sistema.

**En contra — el riesgo abierto**

> **En modo `portal`, el correo lo declara el navegador.** El servidor comprueba que exista en
> `Registros`, pero **no puede probar que sea de quien dice ser.**

Combinado con `access: DOMAIN` y con que toda función global de Apps Script es invocable desde
`google.script.run`, esto permite que cualquier empleado del dominio:

- suplante a cualquier asesor registrado,
- se eleve a rol avanzado declarando el correo de una supervisora,
- lea la base completa de cotizaciones con PII de clientes,
- envíe correo desde el alias corporativo.

Es el hallazgo **C-02**, y es bloqueante para producción.

**Lo importante para entenderlo bien:** los controles de rol están **bien construidos y aplicados de
forma consistente**. La arquitectura es correcta. El defecto está en la **fuente del dato**, no en
el diseño. La puerta es sólida; la cerradura acepta cualquier llave que se le declare.

Esta debilidad quedó escrita en `Seguridad.gs` desde el inicio, con esas palabras. No se descubrió
después: se conocía y se aceptó como deuda.

**Otras contras**

- La sesión vive en `localStorage`, sin caducidad ni invalidación del lado del servidor.
- El control de acceso a pantallas es de cliente: `requireSession()` redirige, pero los datos siguen
  siendo obtenibles llamando las funciones directo.

**Qué obliga a hacer**

- **Toda función que toque datos valida identidad adentro**, con `secIdentidad_` o
  `secIdentidadAvanzada_`. No confiar en que la pantalla proteja.
- **Ninguna comparación de rol fuera de `Seguridad.gs`.** Si necesitas una regla nueva, va ahí.
- **Nada de `Session.getActiveUser()` disperso** por el código. Se usa dentro de la capa.

## Plan de cierre

La remediación recomendada es de **una línea**:

```javascript
secFijarModoAuth('estricto');
```

El modo ya está implementado, probado y documentado. Por sí solo neutraliza C-02 y reduce C-03,
A-01, A-03 y A-05.

**Lo que cuesta:** en modo estricto manda la cuenta de Google y tiene que estar dada de alta en
`Registros`. El asesor con otra cuenta abierta deja de poder trabajar con su usuario del portal —
exactamente el caso que llevó a elegir `portal` en su momento.

**Cómo hacerlo bien:** probarlo con el grupo semilla antes de aplicarlo a todos, y dar de alta a
todos con su cuenta institucional. Ver [Plan de adopción](../operacion/PLAN-DE-ADOPCION.md).

## Cuándo revisar esto

**Ya.** Antes de cualquier apertura a producción. Cuando se aplique el modo estricto, se escribe un
ADR nuevo que reemplace a este y documente la nueva fuente de identidad.
