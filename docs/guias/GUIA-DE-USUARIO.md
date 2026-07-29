# Guía de usuario

Todo lo que necesitas para trabajar con el Sistema Integral Ventel: consultar el Portal, cotizar,
enviar correos y buscar un folio. Está escrita para asesores. No necesitas saber nada técnico.

Si algo no te sale como dice aquí, salta a [Preguntas frecuentes](PREGUNTAS-FRECUENTES.md).

---

## Antes de empezar

- Abre el sistema con tu cuenta de Liverpool. Si tienes varias cuentas de Google abiertas, no
  importa: la sesión que manda es la del portal, la que creas al entrar.
- Funciona en Chrome, en computadora. En celular se ve, pero cotizar desde ahí es incómodo.
- **La primera pantalla es el Portal.** No pide contraseña. La contraseña se pide cuando entras a
  cotizar.

---

## 01 IDENTIFÍCATE

### Crear tu cuenta

1. Entra a la pantalla de **Crear cuenta**.
2. Escribe tu **nombre completo** — es el que va a salir en tus cotizaciones y en los reportes.
3. Escribe tu **correo de Liverpool**.
4. Elige una **contraseña de al menos 6 caracteres**.
5. Confirma.

Tu cuenta queda con rol normal. El rol avanzado lo activa el responsable del sistema.

### Entrar

1. Correo y contraseña.
2. Entras. Si tu cuenta es normal llegas al **Dashboard**; si es avanzada, al **Panel de
   Supervisión**.

Tras 8 intentos fallidos tu correo se bloquea 15 minutos. Es un freno automático contra intentos de
adivinar contraseñas. Espera y vuelve a intentar; no hay nada que arreglar.

> **¿Escribiste tu correo con mayúsculas al registrarte?** No pasa nada. El sistema no distingue
> mayúsculas ni espacios en el correo.

---

## 02 CONSULTA EL PORTAL

El Portal es la pantalla de entrada y no pide sesión. Ahí está lo que consultas a diario:

- **Herramientas** — accesos del área, con la descripción de para qué sirve cada uno y cómo entrar.
- **Presentaciones** — material del área con su liga directa.
- **Paqueterías** — con su sistema asociado.
- **Formatos** — el acceso, sus observaciones y la liga.
- **Puntos de pago** — con detalles y simulador cuando aplica.
- **Plantillas** — el texto de los correos más usados, con su asunto y sus consideraciones.
- **Anuncios** — los avisos del área. Ver [Manual de anuncios](MANUAL-DE-ANUNCIOS.md).
- **Hoy en promociones** — cuántas promociones están activas y cuántas están por terminar.

### El buscador

Escribe lo que buscas y el buscador barre todas las secciones a la vez. Encuentra herramientas,
formatos, plantillas y promociones.

Cuando el resultado es una plantilla de correo, el buscador te lleva directo a la pantalla de
correos con esa plantilla ya seleccionada.

### Si un enlace está roto

Usa el botón **Reportar** de la tarjeta. Se registra con la sección, el nombre, el enlace y tu
correo. No hace falta que escribas un correo a nadie.

> Puedes reportar hasta 20 enlaces por hora. Es un tope para que nadie llene la hoja por error.

### Monitor de promociones

Pantalla aparte, con las promociones vigentes, las de Marketplace y el calendario comercial de los
próximos 90 días. Filtra por dirección, categoría, marca y vigencia.

---

## 03 COTIZA

Desde el Dashboard, botón **Nueva Cotización**.

### Llena tus datos

En **Información del Asesor** van tu nombre, tu puesto y tu extensión. En **Información del
Cliente**, su nombre, correo y teléfono.

El correo del cliente es el que se usa después para enviarle la cotización. Verifícalo aquí, no
después.

### Agrega productos

Botón **Añadir Producto** por cada línea. Por producto:

| Campo | Qué va |
|---|---|
| SKU | El código del producto. |
| Descripción | El nombre del producto. |
| Cant. | Cuántas piezas. |
| P. Unitario | El precio de una pieza. |
| Costo Pago Único (Línea) | Si el producto va con precio de pago único, va aquí. Si lo llenas, **manda sobre los descuentos**. |
| Desc. Púb. (%) | El descuento público, en porcentaje. |
| ¿Adic.? | Marca si además aplica un descuento adicional. |
| Desc. Adic. (%) | El porcentaje del adicional. |

El sistema calcula solo el precio por volumen, el descuento total en pesos, el subtotal, el IVA
(16%) y el total a pagar. No calcules nada aparte.

**Cómo se calcula cada línea**, para que sepas qué esperar:

1. Precio por volumen = precio unitario × cantidad.
2. Si hay **Costo Pago Único**, ese es el total de la línea y aquí termina el cálculo.
3. Si no, se aplica el descuento público sobre el precio por volumen.
4. Si marcaste adicional, se aplica el adicional **sobre el resultado anterior**, no sobre el precio
   original.

### Importar desde la extensión

Si usas **Ventel Extractor de Bolsa** —la extensión de Chrome—, copia el JSON que genera y pégalo en
**Importar desde Bolsa (JSON)**. Los productos se cargan solos. Facilita la vida.

### Elige el formato

En **Formato de la cotización** eliges con qué plantilla saldrá el PDF:

- **Actual** — el formato del sistema. Incluye las fotos de los productos y el detalle de
  descuentos.
- **CCL Liverpool** — el formato oficial del Centro de Contacto.

Si solo aparece uno, el otro está deshabilitado o su plantilla no está disponible en este momento.

### Observaciones

Lo que escribas aquí sale en el PDF y en el correo. Úsalo para condiciones, tiempos de entrega o
cualquier aclaración.

### Guarda

Botón **Ir a Vista Previa**. Ahí se genera tu folio, con el formato `LVP-AAMMDD-NNNN`
(ejemplo: `LVP-260729-0003`). El consecutivo se reinicia cada día.

> Nada se guarda hasta que pasas a la vista previa. Si cierras la pestaña antes, pierdes la captura.

---

## 04 REVISA Y ENVÍA

En la **Vista Previa** ves la cotización como la va a ver el cliente. Desde ahí:

| Botón | Qué hace |
|---|---|
| **Editar** | Regresa a la captura, con todo cargado. El folio no cambia. |
| **Descargar PDF** | Baja el PDF en el formato elegido. |
| **Enviar por Correo** | Te lleva a la pantalla de envío. |
| **PDF de Drive** / **Sheets** | Abre el documento generado, cuando aplica. |

### Enviar la cotización

1. Confirma el **folio** (o búscalo con **Cargar Datos**).
2. Revisa el **formato del PDF adjunto**.
3. Escribe el correo del cliente en **Para**. Puedes poner hasta 3 destinatarios.
4. Revisa el **asunto** y el cuerpo.
5. **Enviar Correo**.

El correo sale desde el alias institucional `cotizacion@liverpool.com.mx`, con el PDF adjunto. Si
el cliente responde, la respuesta llega a **tu** correo, no al alias.

> Si arriba dice que el remitente será tu cuenta y no el alias, el alias no está configurado en la
> cuenta que ejecuta el sistema. El correo sale igual; avisa al responsable técnico.

---

## 05 MANDA UN CORREO DE PLANTILLA

Pantalla **Correos a Clientes**. Sirve para lo que no es una cotización: tickets, estados de cuenta,
validaciones.

Elige una plantilla, llena tus datos, verifica y envía. El correo sale del mismo remitente
institucional que tus cotizaciones.

Plantillas disponibles:

- **Ticket**
- **Estado de cuenta**
- **Estado de cuenta extranjera**
- **Validación exitosa**
- **Formato**
- **Texto plano**

### Los pasos

1. **Elige la plantilla.** Los campos que necesita aparecen del lado izquierdo.
2. **Llena los campos.** La **Vista previa** de la derecha se arma en vivo: eso es exactamente lo que
   verá el cliente.
3. **Escribe el destinatario** en *Correo del cliente (Para)*. Hasta 3. Si necesitas, agrega CC y
   CCO.
4. **Adjunta** lo que haga falta.
5. **Revisar y enviar** → se abre la ventana de verificación.
6. **Confirmar y enviar.**

> ¿Buscas los correos de entrada? Esta pantalla solo envía. Para leer lo que llegue de los clientes,
> consulta el grupo *Cotizaciones CCL Ventel* — hay un acceso directo en la misma pantalla.

Si un correo va mal escrito, el sistema te avisa antes de mandarlo. Ningún correo sale a medias.

---

## 06 BUSCA UN FOLIO

Desde el Dashboard, en **Tus cotizaciones** están las tuyas, con folio, fecha, cliente, total y
estatus.

El buscador acepta errores de dedo: si escribes `LVP-260729-003` y el folio real es
`LVP-260729-0003`, lo encuentra igual. Lo mismo con nombres de cliente.

Desde cada fila puedes abrir la cotización, mandarla por correo o editarla.

> Si algo no aparece, revisa que el folio esté bien escrito y que la cotización sea tuya. Solo ves
> tus propias cotizaciones; el panel completo es de rol avanzado.

---

## Tu Dashboard

Arriba del listado tienes tres números:

- **Este mes** — cuántas cotizaciones llevas.
- **Enviadas** — cuántas ya salieron por correo.
- **Por enviar** — cuántas están guardadas sin enviar.

Botón **Actualizar** para releer. Los datos se guardan unos minutos en memoria para que la pantalla
cargue rápido; si acabas de guardar algo y no lo ves, dale Actualizar.

---

## Ajustes de vista

Los encuentras en la barra superior de cualquier pantalla. Se guardan en tu navegador y aplican en
todo el sistema, Portal incluido.

- **Tema** — aurora (claro), slate o carbón.
- **Densidad** — cómoda o compacta.
- **Escala de texto** — cuatro tamaños.
- **Alto contraste** — para pantallas con reflejo o vista cansada.

Si prefieres menos movimiento, activa la reducción de animaciones de tu sistema operativo: el
sistema la respeta y muestra todo sin animar.

---

## Cuando algo falla

1. **Recarga la pantalla.** Resuelve la mayoría de los casos.
2. **Si sale "No pudimos abrir esta pantalla"**, anota la hora exacta y qué estabas haciendo.
3. **Si dice que tu sesión no es válida**, vuelve a entrar. Tu captura se pierde: guarda antes de
   dejar la pantalla abierta mucho tiempo.
4. **Reporta** desde el modal de soporte, en el pie de página de cualquier pantalla.

Detalle técnico en el [Runbook](../operacion/RUNBOOK.md).
