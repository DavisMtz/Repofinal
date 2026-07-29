# Seguridad

En qué estado de seguridad está el Sistema Integral Ventel, qué falta cerrar y en qué orden. Para
quien decide si esto se abre a producción y para quien va a arreglarlo.

El detalle técnico completo —22 hallazgos, con archivo, línea y cadena de explotación— está en el
[informe de seguridad](../../INFORME-SEGURIDAD.md). Este documento es el resumen accionable.

---

## Veredicto

> **NO APTO para producción abierta en su estado actual.**

No es un juicio sobre la calidad del código. La revisión encontró que el proyecto tiene higiene de
seguridad **superior a lo habitual** en desarrollos de Apps Script. El problema es de otro tipo:

> El sistema construyó puertas sólidas y después decidió aceptar como llave un dato que el visitante
> escribe él mismo.

Los controles de rol están bien construidos y aplicados de forma consistente. Todos validan un dato
que el atacante controla.

---

## Lo primero: no hay filtración

La pregunta de negocio era doble: *¿se usan servicios externos?* y *¿se está filtrando información?*

**No hay exfiltración deliberada ni encubierta.** Se buscó explícitamente y no se encontró: ni
Google Analytics, ni Meta Pixel, ni Hotjar, ni Sentry, ni Datadog, ni LogRocket, ni Mixpanel, ni
`sendBeacon`, ni WebSockets, ni llamadas a APIs de terceros con datos de cliente.

Los datos de cotizaciones y clientes se quedan dentro del Google Workspace de Liverpool.

**Sí hay dependencias externas**, y son de dos tipos:

| Dependencia | Qué revela | Riesgo |
|---|---|---|
| CDN de GSAP y Chart.js (cdnjs, jsdelivr) | IP del empleado, navegador, `Referer` y momento de uso | Medio — **incluye las pantallas de login y registro** |
| Google Fonts | Metadatos de conexión | Bajo |
| Imágenes de logos alojadas en sitios de terceros | Metadatos, en el Portal | Bajo |
| Logotipo de Liverpool servido desde Wikipedia **en correos al cliente** | Metadatos, ante el cliente | Medio — es material institucional |

Y **una exposición interna severa**, que es lo verdaderamente grave: cualquier empleado del dominio
puede leer la base completa de cotizaciones con PII de clientes y enviar correo desde el alias
corporativo.

---

## El problema de fondo

No es un bug aislado. Es la combinación de tres decisiones:

```
  La identidad la declara el navegador (C-02)
              +
  La web app es accesible a TODO el dominio (access: DOMAIN)
              +
  En Apps Script, toda función global .gs es invocable desde google.script.run
              ↓
  Cualquier empleado con cuenta del dominio puede:
    · leer TODA la base de cotizaciones, con PII de clientes
    · descargar el PDF de cualquier folio
    · enviar correo HTML arbitrario desde cotizacion@liverpool.com.mx
    · publicar anuncios en el Portal que ve toda la operación
    · elevarse a rol avanzado declarando el correo de una supervisora
```

El atacante no necesita la interfaz: abre la consola del navegador y llama las funciones directo.

---

## Distribución de hallazgos

| Severidad | Cantidad |
|---|---|
| 🔴 Crítico | 3 |
| 🟠 Alto | 6 |
| 🟡 Medio | 7 |
| 🔵 Bajo | 6 |
| **Total** | **22** |

### Los tres críticos

**C-01 — Secretos en texto plano en el código fuente.**
La sal de contraseñas y la URL del webhook de Chat, con su llave y su token, están escritas en
`Code.gs`. Cualquiera que vea el código puede publicar mensajes en el espacio de Chat corporativo.
Y con la sal conocida —es una sola para todos los usuarios— quien obtenga la hoja `Registros` puede
romper las contraseñas de todos en minutos.

**Lo notable:** el proyecto ya tiene la infraestructura correcta para evitarlo (`secConfig_`,
`secGuardarConfiguracion`, y hasta una verificación en `Admin.gs` que comprueba que los secretos
estén en propiedades). **La migración simplemente no se ha ejecutado.**

**C-02 — La identidad la declara el propio cliente.**
El correo del asesor lo manda el navegador. El servidor comprueba que exista en `Registros`, pero
no puede probar que sea de quien dice ser. Esto permite suplantar a cualquier asesor y elevarse a
rol avanzado.

El propio código lo documenta con honestidad en `Seguridad.gs`. El equipo identificó y escribió la
debilidad antes de que la encontrara la revisión.

**C-03 — Envío de correo HTML arbitrario desde el alias corporativo.**
El HTML del correo llega ya armado desde el navegador. Combinado con C-02, cualquiera del dominio
puede mandar correo con el contenido que quiera desde `cotizacion@liverpool.com.mx`.

---

## Qué hacer, en orden

### Fase 1 — Antes de cualquier uso con datos reales

| # | Acción | Cierra | Esfuerzo |
|---|---|---|---|
| 1 | **Rotar el webhook de Google Chat** — borrarlo y recrearlo en el espacio | C-01 | 15 min |
| 2 | Ejecutar `secGuardarConfiguracion()` y **vaciar** las constantes de `Code.gs` | C-01 | 30 min |
| 3 | **`secFijarModoAuth('estricto')`** | C-02 | 1 h + pruebas |
| 4 | Poner control de identidad en `getQuoteDetails`, `downloadQuotePdf`, `openQuoteInSheets`, `getDashboardStats` | A-01, A-02 | 2 h |
| 5 | Cambiar el permiso de los archivos subidos de "cualquiera con el enlace" a "dominio con el enlace", y auditar la carpeta de anuncios | A-05 | 30 min |

> **La corrección con mejor relación impacto/esfuerzo de todo el informe es de una línea:**
> `secFijarModoAuth('estricto')`. El modo ya está implementado, probado y documentado. Por sí solo
> neutraliza C-02 y reduce C-03, A-01, A-03 y A-05.
>
> **Lo que cuesta:** en modo estricto manda la cuenta de Google y tiene que estar dada de alta en
> `Registros`. Un asesor con otra cuenta de Google abierta en el navegador deja de poder trabajar
> con su usuario del portal. **Pruébalo con el grupo semilla antes de aplicarlo a todos.**

### Fase 2 — 2 a 4 semanas

| # | Acción | Cierra |
|---|---|---|
| 6 | Armar el HTML de los correos **en el servidor**, desde plantilla | C-03 |
| 7 | Rotar `HASH_SALT` y migrar a PBKDF2 con sal por usuario — o quitar contraseñas propias y usar la sesión de Workspace | C-01, M-01 |
| 8 | Servir GSAP y Chart.js desde el proyecto, o fijar versión + SRI | M-02 |
| 9 | Alojar los logotipos en infraestructura de Liverpool | M-03 |
| 10 | Reducir alcances OAuth y desplegar bajo cuenta de servicio dedicada | A-04 |
| 11 | Corregir el escapado de atributos en los anuncios | M-06 |
| 12 | `XFrameOptionsMode.DEFAULT` en las pantallas con sesión | A-06 |

### Fase 3 — 1 a 3 meses

| # | Acción | Cierra |
|---|---|---|
| 13 | Lista blanca de dominios en `getVerifiedImageUrl` | M-05 |
| 14 | Acotar la búsqueda global: largo mínimo, tope de resultados, auditoría | A-03 |
| 15 | Quitar PII de `Logger.log` y unificar el manejo de errores | M-07 |
| 16 | Migrar los IDs de infraestructura a Script Properties | B-03 |
| 17 | Endurecer el limitador de intentos y avisar al SOC | M-04 |
| 18 | Registro de auditoría con identidad **verificada** | C-02, C-03 |

---

## Lo que ya está bien hecho

Conviene tenerlo presente: la revisión lo hace constar explícitamente.

| Control | Valoración |
|---|---|
| Comparación de hashes en tiempo constante | Correcta. Previene fuga por análisis temporal. |
| Escapado de HTML consistente en cliente y servidor | Aplicado de forma sistemática. |
| Escapado específico por contexto (HTML vs. JavaScript) | Distingue los contextos correctamente. |
| Limitación de intentos de login | Presente. |
| Mensajes de error de login genéricos | No revelan si el correo existe. |
| Validación de destinatarios y adjuntos | Formato, cantidad y tamaño acotados. |
| `LockService` para condiciones de carrera en folios | Correcto. |
| Validación de esquema en URLs (bloquea `javascript:`) | Correcta. |
| Normalización de correos | Elimina inconsistencias de comparación. |
| Capa de identidad centralizada | **Arquitectura correcta.** El defecto está en la fuente del dato, no en el diseño. |
| Infraestructura de gestión de secretos ya construida | Implementada, con verificación automática. Solo falta ejecutarla. |
| Retirada del CDN de Tailwind | Excelente precedente. Replicar con GSAP y Chart.js. |
| Documentación interna del riesgo | El equipo documentó C-02 por sí mismo, antes de la revisión. |

---

## Reglas para quien escriba código aquí

Cinco cosas, no negociables:

1. **Ningún secreto en el código.** Van en Script Properties. En el repositorio y en la
   documentación solo aparece el **nombre** de la propiedad.
2. **Toda función que toque datos valida identidad adentro.** Poner el `_` al final no protege nada:
   toda función global sigue siendo invocable desde el navegador.
3. **Todo lo que venga del usuario y vaya a HTML pasa por `secEscapeHtml_()`.** Sin excepción.
4. **Ninguna librería nueva desde CDN sin versión fijada y SRI.** Preferible: servirla desde el
   proyecto.
5. **Los mensajes de error no dicen si un correo existe** ni exponen estructura interna.

Ver [Estándares de código](../contribuir/ESTANDARES-DE-CODIGO.md).

---

## Datos que trata el sistema

| Dato | Dónde vive | Clasificación |
|---|---|---|
| Nombre, correo y teléfono del cliente | `Cotizaciones` | **Confidencial — PII** |
| Precios y descuentos | `Cotizaciones`, `DetalleCotizaciones` | **Confidencial** |
| Nombre y correo de asesores | `Registros`, `MetricasCorreos` | Interno |
| Hash de contraseñas | `Registros` | **Confidencial** |
| Contenido de correos enviados | `MetricasCorreos`, `CorreosEnviados` | **Confidencial** |
| Contenido del Portal | Hoja del Portal | Interno |

**Todo se queda dentro del tenant de Google Workspace de Liverpool.**

---

## Cómo reportar algo

Si encuentras una falla de seguridad:

1. **No la publiques** en el chat del equipo ni en un issue abierto.
2. Escríbele directo al responsable técnico: `dmartineza02@liverpool.com.mx`.
3. Incluye qué encontraste, cómo se reproduce y qué se podría hacer con eso.
4. Dale tiempo de responder antes de escalar.

---

## Fechas

| Qué | Cuándo |
|---|---|
| Última revisión de seguridad | 28 de julio de 2026 |
| Tipo | Análisis estático (SAST manual) + revisión de arquitectura de identidad |
| Alcance | 32 archivos: 8 `.gs`, 23 `.html`, 1 `appsscript.json` |
| Próxima revisión | Al cerrar la Fase 1, con prueba de intrusión autorizada sobre el despliegue real |

La revisión fue estática: no se ejecutó ninguna prueba dinámica, no se accedió a producción y no se
invocó ninguna de las funciones descritas. Las cadenas de explotación son análisis conceptual sobre
el código.
