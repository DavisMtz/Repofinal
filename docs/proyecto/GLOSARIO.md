# Glosario

Los términos que aparecen en el código, en la interfaz y en el resto de la documentación. Si en un
documento te topaste con una palabra que no ubicas, está aquí.

---

## Nombres propios del proyecto

**Sistema Integral Ventel** — el sistema completo: Portal, cotizaciones, correos y supervisión. Es
un solo proyecto de Apps Script con un solo despliegue.

**Portal Ventel** — la parte pública del sistema (`Index.html`). Concentra herramientas,
presentaciones, paqueterías, formatos, puntos de pago, plantillas y anuncios. No pide sesión.

**Monitor de Promociones** — la pantalla `Promociones.html`. Promociones vigentes, Marketplace y
calendario comercial a 90 días.

**Constructor de Anuncios** — la pantalla `anuncios.html`. Desde ahí se publican los avisos del
Portal sin tocar la hoja de cálculo.

**Ventel** — el área del Centro de Contacto Liverpool para la que se construyó el sistema.

**CCL** — Centro de Contacto Liverpool. También nombra al formato oficial de cotización
(`ccl_liverpool`).

---

## Conceptos del sistema

**Folio** — el identificador de una cotización. Formato `LVP-AAMMDD-NNNN`, por ejemplo
`LVP-260729-0003`. El consecutivo se reinicia cada día.

**Formato de cotización** — la plantilla con la que se imprime o se envía una cotización. Hay dos:

- `actual` — se arma desde HTML, incluye fotos de producto y desglose de descuentos.
- `ccl_liverpool` — el formato oficial, generado copiando la plantilla de Google Sheets.

**Rol avanzado** — el permiso que da acceso al panel de supervisión, a las métricas, al control de
formatos y al constructor de anuncios. Vive en la columna `Avanzado` de la hoja `Registros`. Se
acepta `Si`, `si`, `SI` o `Sí`.

**Alias institucional** — `cotizacion@liverpool.com.mx`. Es el remitente desde el que salen las
cotizaciones y los correos a clientes. Tiene que estar dado de alta como *Enviar como* en la cuenta
que ejecuta el script; si no lo está, el correo sale desde la cuenta propia del asesor.

**Sesión del portal** — la identidad con la que el asesor trabaja dentro de la app. Se guarda en el
navegador (`localStorage`, prefijo `ventel-`) y se valida contra la hoja `Registros`. **No es** la
cuenta de Google con la que se abrió la página.

**Modo de autenticación** — cuál identidad manda. Se configura en la propiedad de script
`AUTH_MODO`: `portal` (predeterminado), `auto`, `estricto` o `legado`. Ver
[Arquitectura técnica](../tecnico/ARQUITECTURA-TECNICA.md).

**Generación de caché** — un contador que forma parte de todas las claves de caché de cotizaciones.
Cada escritura lo incrementa, así que la siguiente lectura ya no encuentra nada viejo y va a la
hoja. Es lo que evita el clásico "guardé y sigue saliendo lo anterior".

**Publicación / anuncio** — una fila de la hoja `Anuncios` del Portal. Su contenido va en JSON en la
columna `Datos (JSON)`, lo que permite que cada formato tenga sus propios campos sin agregar
columnas.

**Formatos de anuncio** — `banner`, `destacado`, `tarjeta` y `modal`. Cambian dónde y cómo se ve el
aviso en el Portal.

**Búsqueda tolerante** — la búsqueda de folios y clientes acepta errores de dedo. Usa distancia de
Levenshtein con una tolerancia que crece con la longitud del término.

---

## Plataforma

**Google Apps Script** — el entorno de Google donde corre el sistema. JavaScript del lado del
servidor (motor V8), ejecutado dentro del tenant de Google Workspace.

**Web app** — la forma de publicar un proyecto de Apps Script como página accesible por URL. La de
este proyecto se ejecuta como el usuario que despliega (`USER_DEPLOYING`) y está abierta a todo el
dominio (`DOMAIN`).

**`doGet(e)`** — la función que Apps Script llama cuando alguien abre la URL. Aquí actúa de
enrutador: lee `?page=` y sirve la pantalla correspondiente.

**`google.script.run`** — el puente que usa el navegador para llamar funciones del servidor. En este
proyecto se envuelve en `AppRun`, que lo convierte en promesas y deduplica llamadas repetidas.

**Scriptlet** — la sintaxis `<?!= include('archivo'); ?>` con la que una plantilla HTML de Apps
Script inserta otro archivo. Así se comparten tema, iconos y núcleo entre pantallas.

**Propiedades del script** *(Script Properties)* — el almacén de configuración del proyecto.
Es donde deben vivir los secretos: sal de contraseñas, webhook, IDs de hojas. Se leen con
`secConfig_`.

**CacheService** — la caché de Apps Script. Tope de ~100 KB por valor y 6 horas de expiración. Los
valores grandes se guardan troceados.

**Cuota** — el tope diario que Google impone a envío de correo, tiempo de ejecución y llamadas a
servicios. Es la razón principal de que exista la capa de caché.

---

## Hojas de cálculo

**BD de Cotizaciones** — la hoja ligada al script. Contiene `Registros`, `Cotizaciones`,
`DetalleCotizaciones`, `MetricasCorreos` y `CorreosEnviados`.

**Hoja del Portal** — una hoja aparte, abierta por ID (propiedad `PORTAL_SHEET_ID`). Contiene
`Herramientas`, `Presentaciones`, `Paqueterias`, `Formatos`, `PdePago`, `Plantillas`, `Anuncios`,
`Avisos`, `Promociones`, `MKP` y `Reportes`.

Detalle columna por columna en [Referencia de datos](../tecnico/REFERENCIA-DE-DATOS.md).

---

## Términos de la documentación

**ADR** *(Architecture Decision Record)* — un documento corto que registra una decisión de
arquitectura: qué se decidió, en qué contexto y qué consecuencias trajo. Viven en
[`decisiones/`](../decisiones/).

**AsIs → ToBe** — la comparación entre cómo se hace hoy una tarea y cómo se hará con la herramienta.
Es el formato con el que se presenta el impacto.

**Grupo semilla** — el núcleo reducido de asesores que prueba primero, antes de abrir a más gente.

**Runbook** — el documento que dice qué hacer cuando algo falla, paso a paso, sin tener que pensar.

**SemVer** *(Versionado Semántico)* — el esquema `MAYOR.MENOR.PARCHE` con el que se numeran las
versiones.

**PII** *(Personally Identifiable Information)* — datos que identifican a una persona: nombre,
correo, teléfono. El sistema trata PII de clientes, y eso condiciona su clasificación de seguridad.

**SAST** — análisis estático de código en busca de fallas de seguridad. Es el tipo de revisión del
[informe de seguridad](../../INFORME-SEGURIDAD.md).

**SRI** *(Subresource Integrity)* — el atributo que obliga al navegador a verificar que un script
externo no fue modificado. Hoy los scripts de CDN del proyecto no lo tienen.
