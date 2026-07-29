# Manual de anuncios

Cómo publicar avisos en el Portal Ventel desde el Constructor de Anuncios, sin tocar la hoja de
cálculo. Para quien administra contenido del Portal — supervisión y coordinación, rol avanzado.

El módulo de anuncios nació de una propuesta del área. Hoy es la vía oficial para que un aviso
llegue a toda la operación sin depender de un correo que se pierde.

---

## Antes de publicar

Necesitas rol avanzado. Si el Constructor no te abre, es eso.

Piensa dos cosas antes de escribir:

1. **¿Qué tan urgente es?** De eso depende el formato.
2. **¿Hasta cuándo sirve?** Un anuncio sin fecha de expiración se queda para siempre y le quita
   fuerza a los que sí importan.

---

## 01 ELIGE EL FORMATO

Cuatro formatos. Cada uno interrumpe distinto:

| Formato | Dónde aparece | Cuándo usarlo |
|---|---|---|
| **Banner** | Franja fija al inicio del Portal. | Avisos cortos que deben verse siempre: un cambio de proceso, una caída de sistema. |
| **Destacado** | Bloque prominente, con imagen y botón. | Lo importante de la semana: una campaña, una capacitación. |
| **Tarjeta** | Una tarjeta más entre el contenido. | Información útil que no urge. |
| **Modal** | Ventana emergente al abrir el Portal, descartable. | Solo para lo que nadie se puede saltar. Úsalo poco: si abusas, la gente aprende a cerrarlo sin leer. |

---

## 02 LLENA LOS CAMPOS

Los campos cambian según el formato.

### Banner

- **Mensaje** — el texto del aviso. Corto. Una idea.
- **Tono / color** — `Aviso`, `Éxito`, `Urgente`. El color es la primera lectura: no marques
  urgente lo que no lo es.
- **Ícono** — opcional, refuerza el tono.

### Destacado, Tarjeta y Modal

- **Título** — de qué se trata, en pocas palabras.
- **Descripción** — el resumen que se lee de un vistazo.
- **Cuerpo** — el detalle completo.
- **Imagen** — pega la URL, o sube el archivo y el sistema la guarda en la carpeta del Portal y te
  devuelve el enlace.
- **Vigencia (texto)** — la vigencia como la vas a decir, por ejemplo *"3 al 15 de junio"*. Es
  informativa: no apaga el anuncio.
- **Botón principal** — texto y enlace. Opcional.
- **Botón secundario** — igual. Opcional.

---

## 03 PROGRAMA Y ORDENA

- **Publicar desde** — si lo dejas vacío, se publica ya. Si pones fecha, el anuncio queda guardado y
  aparece solo ese día.
- **Expira** — el último día en que se ve. **Se cuenta completo**: un anuncio que expira el 15 se ve
  todo el 15 y desaparece el 16.
- **Orden** — número. **Menor sube.** También puedes moverlo con las flechas ↑ / ↓ en la lista.

---

## 04 REVISA Y PUBLICA

La **Vista previa** de la derecha muestra exactamente cómo se va a ver. Revísala antes de publicar,
sobre todo con imagen: una imagen muy alta descuadra el bloque.

Botón **Publicar anuncio**.

> El Portal guarda su contenido 10 minutos en memoria. Si acabas de publicar y no lo ves, recarga
> en un rato. No vuelvas a publicar: se duplicaría.

---

## Administrar lo publicado

En **Publicaciones existentes** están todos los anuncios: activos, apagados y expirados.

| Acción | Qué hace |
|---|---|
| **Editar** | Abre el anuncio en el constructor. Al publicar se actualiza el mismo, no crea otro. |
| **Duplicar** | Copia el contenido en uno nuevo. Útil para avisos que se repiten cada mes. |
| **Activar / Desactivar** | Lo quita del Portal sin borrarlo. Reversible. |
| **↑ / ↓** | Cambia el orden. |
| **Borrar** | Lo elimina. **No se puede deshacer.** Si dudas, desactívalo. |

Cada publicación guarda quién la creó y cuándo.

---

## Cuándo un anuncio se ve y cuándo no

Se ve solo si cumple las tres:

1. Está **activo**.
2. Su fecha de **publicación** ya pasó, o está vacía.
3. Su fecha de **expiración** es hoy o después, o está vacía.

Si publicaste algo y no aparece, revisa esas tres antes que nada.

---

## Buenas prácticas

- **Un banner urgente a la vez.** Dos urgentes es cero urgentes.
- **Ponle siempre fecha de expiración.** Es la diferencia entre un tablero de avisos y un cementerio
  de avisos.
- **Título concreto.** "Cambio en el proceso de validación de tarjeta" sirve; "Información
  importante" no.
- **Revisa la vista previa.** Siempre.
- **El modal, para lo que de verdad nadie se puede saltar.**
- **Limpia cada mes.** Borra o desactiva lo que ya no aplica.

---

## Nota técnica

El contenido de cada anuncio se guarda en JSON en la hoja `Anuncios` del Portal. Por eso cada
formato puede tener campos distintos sin que haya que agregar columnas.

Puedes editar la hoja a mano, pero no es recomendable: el constructor valida el formato, arma el
JSON y limpia la caché. A mano se rompe fácil.

Detalle en [Referencia de datos](../tecnico/REFERENCIA-DE-DATOS.md) y en
[ADR-0007](../decisiones/ADR-0007-ANUNCIOS-COMO-PUBLICACIONES-JSON.md).
