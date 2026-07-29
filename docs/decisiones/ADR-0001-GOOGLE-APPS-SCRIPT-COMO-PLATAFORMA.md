# ADR-0001 — Google Apps Script como plataforma

| | |
|---|---|
| **Estado** | Aceptada |
| **Fecha** | Mayo 2025 |
| **Decide** | David Martínez |

## Contexto

El área necesitaba una herramienta interna real, usada a diario por asesores de un centro de
contacto. Las condiciones de arranque:

- Sin presupuesto de infraestructura. Ni servidor, ni hosting, ni licencias.
- Sin autorización para instalar software en los equipos de la operación.
- Sin equipo de sistemas asignado al proyecto. Un desarrollador.
- La gente ya trabaja todo el día dentro de Google Workspace, con su cuenta institucional.
- Los datos son confidenciales: PII de clientes, precios y descuentos. No pueden salir del dominio.

El proyecto tenía que existir antes de poder pedir recursos. Y para pedir recursos había que
demostrarlo funcionando.

## Decisión

El sistema se construye sobre **Google Apps Script (motor V8)**, publicado como web app dentro del
dominio de Google Workspace.

## Alternativas descartadas

**Aplicación web tradicional (Node, Python, PHP) con hosting propio.**
Requiere servidor, dominio, certificados, despliegue, respaldo y alguien que lo administre. Nada de
eso existía. Habría muerto en la solicitud de presupuesto.

**Herramienta de bajo código (AppSheet, Power Apps, Retool).**
Licencia por usuario y techo de personalización bajo. El formato oficial CCL y el diseño de los
correos institucionales necesitan control total del HTML.

**Aplicación de escritorio.**
Instalar software en los equipos de la operación no era posible. Y actualizarla sería un problema
permanente.

**Solo macros de Google Sheets.**
Alcanza para automatizar una hoja, no para una interfaz que usan asesores todo el día.

## Consecuencias

**A favor**

- **Costo cero de infraestructura.** No hay servidor que pagar ni administrar.
- **Cero instalación.** El asesor abre una URL con la cuenta que ya tiene.
- **Los datos no salen del dominio.** Todo vive dentro del Workspace de Liverpool.
- **Acceso nativo a Sheets, Gmail, Drive y Calendar** sin integrar nada.
- **Despliegue en un clic**, con versiones y reversión inmediata.
- **Autenticación de dominio de fábrica** — solo cuentas de Liverpool abren la app.

**En contra**

- **Cuotas duras.** Tiempo de ejecución, envíos de correo y llamadas a servicios tienen tope diario,
  y no se pueden subir.
- **Sin proceso de build.** No hay `npm`, ni módulos, ni empaquetador. **Todos los `.gs` comparten
  un solo ámbito global.**
- **Sin pruebas automatizadas** de fábrica.
- **El HTML corre dentro de un iframe con sandbox.** Sin cookies propias, sin sesión de servidor.
  Esta limitación es el origen del problema de identidad del [ADR-0004](ADR-0004-CAPA-UNICA-DE-IDENTIDAD.md).
- **Toda función global es invocable** desde `google.script.run`, la use la interfaz o no.
- **Rendimiento acotado.** No es una plataforma para volúmenes altos.
- **Dependencia total de Google.** Si Workspace cambia de reglas, el sistema se adapta o se muere.

**Qué obliga a hacer**

- Prefijo por capa en todas las funciones (`sec*`, `cot*`, `portal*`, `met*`, `cc*`, `ccl*`) para no
  colisionar en el ámbito global.
- Caché agresiva para no consumir cuota. Ver [ADR-0005](ADR-0005-CACHE-INVALIDADA-POR-ESCRITURA.md).
- Control de identidad **dentro** de cada función que toque datos, no en la pantalla.
- Diagnóstico manual: `revisionMaestra()` sustituye a la batería de pruebas que no existe.

## Cuándo revisar esto

Si el sistema empieza a chocar contra las cuotas de forma regular, si el área consigue presupuesto
de infraestructura, o si el volumen de datos hace inviable Google Sheets como base — en cuyo caso
la revisión empieza por [ADR-0002](ADR-0002-GOOGLE-SHEETS-COMO-BASE-DE-DATOS.md).
