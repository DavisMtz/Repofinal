# Preguntas frecuentes

Lo que más se pregunta del Sistema Integral Ventel, respondido corto. Si tu caso no está aquí,
reporta desde el modal de soporte del pie de página.

---

## Acceso y sesión

**¿Necesito instalar algo?**
No. Se abre en el navegador con tu cuenta de Liverpool.

**¿Con qué cuenta entro?**
Con tu correo de Liverpool. El sistema te pide crear una contraseña propia la primera vez; no es la
de tu correo.

**Tengo varias cuentas de Google abiertas. ¿Importa?**
No. La sesión que manda es la que creas dentro del sistema, no la del navegador.

**Me bloqueó después de varios intentos.**
Son 8 intentos fallidos y 15 minutos de espera. Es automático, contra intentos de adivinar
contraseñas. Espera y vuelve a entrar.

**Se me olvidó la contraseña.**
No hay recuperación automática todavía. Pídele al responsable técnico que reinicie tu registro.

**Me registré con el correo en mayúsculas y ahora no entro.**
Sí entras. El sistema ignora mayúsculas y espacios en el correo. Si aun así no entra, es la
contraseña.

**Dice que mi sesión no es válida.**
Vuelve a entrar. Pasa si dejaste la pestaña abierta mucho tiempo o si limpiaste el navegador.

---

## Cotizaciones

**¿Cómo se arma el folio?**
`LVP-AAMMDD-NNNN`. Ejemplo: `LVP-260729-0003` es la tercera cotización del 29 de julio de 2026. El
consecutivo se reinicia cada día.

**Escribí el folio con un dígito de menos y no lo encuentro.**
Sí lo encuentra. La búsqueda tolera errores de dedo. Si aun así no sale, revisa que la cotización sea
tuya: solo ves las propias.

**¿Puedo editar una cotización ya guardada?**
Sí, desde la vista previa o desde el listado. El folio no cambia.

**¿Se puede borrar una cotización?**
No hay botón de borrar, a propósito. Si una quedó mal, edítala.

**Cambié un producto y el total no cuadra con lo que esperaba.**
Revisa el orden del cálculo: el descuento adicional se aplica **sobre el precio ya con descuento
público**, no sobre el precio original. Y si llenaste *Costo Pago Único*, ese valor manda sobre
cualquier descuento.

**¿Cuántos productos puedo meter?**
No hay tope duro. Arriba de unas veinte líneas el PDF se vuelve incómodo de leer.

**Solo me aparece un formato en el selector.**
El otro está apagado desde el panel de supervisión, o su plantilla no está accesible. Consulta con
supervisión.

**¿Qué diferencia hay entre los dos formatos?**
*Actual* es el del sistema: trae fotos de producto y desglose de descuentos. *CCL Liverpool* es el
formato oficial del Centro de Contacto, generado desde su plantilla de Google Sheets.

**El PDF tardó bastante en generarse.**
El formato CCL copia una hoja de cálculo, la llena y la exporta. Es más lento que el formato actual.
Es normal.

**Guardé y en el listado sigue apareciendo lo anterior.**
Dale **Actualizar**. Los datos se guardan unos minutos en memoria para que la pantalla cargue rápido.

---

## Correos

**¿Desde qué correo salen mis envíos?**
Desde `cotizacion@liverpool.com.mx`. Si el cliente responde, la respuesta llega a **tu** correo.

**En la pantalla dice que el remitente será mi cuenta, no el alias.**
El alias no está dado de alta en la cuenta que ejecuta el sistema. El correo sale igual, pero desde
tu cuenta. Avisa al responsable técnico.

**¿Dónde leo lo que responden los clientes?**
En tu correo, y en el grupo *Cotizaciones CCL Ventel*. Estas pantallas solo envían.

**¿A cuántas personas puedo mandar?**
Hasta 3 en *Para*. Puedes agregar CC y CCO.

**Escribí mal un correo y no me dejó enviar.**
Es a propósito: se valida antes de generar el PDF, para no hacerte esperar y luego fallar. Corrige y
reintenta.

**¿Puedo adjuntar archivos?**
Sí, en la pantalla de correos a clientes.

**¿Se puede recuperar un correo ya enviado?**
No. Por eso está la ventana de verificación antes de confirmar.

**Mi envío aparece "con error" en las métricas.**
Casi siempre es un correo de cliente mal escrito o un tope de cuota de Gmail. La columna de detalle
dice cuál fue.

---

## Portal y promociones

**¿El Portal pide contraseña?**
No. Es de consulta y está abierto a todo el dominio. La sesión se pide al entrar a cotizar.

**Publicaron un aviso y no lo veo.**
El Portal guarda su contenido 10 minutos en memoria. Recarga en un rato.

**Un enlace está roto.**
Usa el botón **Reportar** de la tarjeta. Queda registrado con tu correo; no hace falta escribir a
nadie.

**Reporté varios enlaces y ya no me deja.**
Son 20 por hora. Es un tope para que nadie llene la hoja por error.

**Una promoción sigue apareciendo y ya venció.**
Revisa la columna de vigencia en la hoja del Portal. El sistema lee lo que está escrito ahí.

---

## Anuncios

**¿Quién puede publicar?**
Solo rol avanzado. Ver [Manual de anuncios](MANUAL-DE-ANUNCIOS.md).

**Publiqué y no aparece.**
Tres cosas: que esté activo, que su fecha de publicación ya haya pasado y que no esté expirado.

**Un anuncio expira hoy. ¿Se ve hoy?**
Sí, todo el día. Desaparece mañana.

**Borré un anuncio por error.**
No se recupera. Para lo que dudes, usa desactivar en lugar de borrar.

---

## Rol avanzado

**¿Cómo consigo el rol avanzado?**
Lo activa el responsable técnico en la hoja `Registros`. No hay pantalla para autoasignárselo.

**Tengo el rol pero sigo viendo el dashboard normal.**
Sal y vuelve a entrar. El rol se lee al iniciar sesión.

**¿Puedo ver las cotizaciones de todos?**
Con rol avanzado, sí, en el Panel de Supervisión.

---

## Vista y accesibilidad

**¿Puedo cambiar los colores?**
Sí: aurora (claro), slate o carbón, desde la barra superior.

**El texto se me hace chico.**
Escala de texto, cuatro tamaños. También hay modo de alto contraste.

**Las animaciones me marean.**
Activa la reducción de movimiento de tu sistema operativo. El sistema la respeta.

**¿Se guardan mis ajustes?**
Sí, en tu navegador, y aplican en todo el sistema.

---

## Datos y seguridad

**¿Dónde se guardan los datos?**
En hojas de cálculo dentro del Google Workspace de Liverpool. No salen del dominio.

**¿Se usan servicios externos?**
No hay analítica, ni rastreo, ni envío de datos de cliente a terceros. Sí se cargan tipografías y
librerías de animación desde CDN públicos. El detalle completo está en el
[informe de seguridad](../../INFORME-SEGURIDAD.md).

**¿Mi contraseña está protegida?**
Se guarda como hash, no en texto claro. Aun así, **no reutilices tu contraseña de correo aquí**:
hay hallazgos de seguridad abiertos y el sistema no está liberado a producción.

**¿Se registra lo que hago?**
Sí: cada cotización y cada correo queda registrado con fecha, asesor, destinatario y resultado.
Sirve para métricas del área.
