# Guía de contribución

Cómo proponer y entregar un cambio en el Sistema Integral Ventel. Para quien va a tocar código,
documentación o contenido.

El proyecto lo mantiene una persona. Eso significa dos cosas: **que tu ayuda cuenta**, y que un
cambio mal preparado cuesta más de lo que aporta. Esta guía es para que cuente.

---

## Tres formas de contribuir

| Forma | Qué implica |
|---|---|
| **Reportar** | Decir qué falla, con lo suficiente para reproducirlo. Es la contribución más subestimada. |
| **Proponer** | Una idea de funcionalidad, con el problema que resuelve. |
| **Construir** | Código o documentación. |

Si no vas a escribir código, **reportar bien vale muchísimo**. Un reporte con pasos claros ahorra
más tiempo que un parche a medias.

---

## Antes de escribir código

**Habla primero.** No abras un cambio grande sin comentarlo. En un proyecto de una persona, dos
manos tocando lo mismo cuesta más que ahorra.

Lee, en este orden:

1. [Arquitectura técnica](../tecnico/ARQUITECTURA-TECNICA.md) — cómo está armado y por qué.
2. [Estándares de código](ESTANDARES-DE-CODIGO.md) — cómo se escribe aquí.
3. El [ADR](../decisiones/) de la parte que vas a tocar — para no deshacer algo que sostenía una
   decisión.

---

## Reportar una falla

Necesito estas cinco cosas. Sin ellas se va el tiempo en preguntar:

1. **Qué hiciste** — los pasos, en orden.
2. **Qué esperabas.**
3. **Qué pasó.**
4. **La hora exacta.** Es lo que permite encontrar la ejecución en el log.
5. **Con qué cuenta.**

Si sale un mensaje de error, **cópialo completo**. La pantalla de error del sistema trae el detalle
técnico abajo: ese detalle es la mitad del diagnóstico.

Un enlace roto del Portal no necesita reporte: usa el botón **Reportar** de la tarjeta.

> **Falla de seguridad:** no la publiques. Escríbele directo al responsable técnico. Ver
> [Seguridad](../operacion/SEGURIDAD.md).

---

## Proponer una funcionalidad

Cuatro puntos, cortos:

1. **Qué problema resuelve.** El problema, no la solución.
2. **A quién le sirve** y con qué frecuencia.
3. **Cómo se resuelve hoy** — el proceso actual, aunque sea manual.
4. **Cuánto tiempo se ahorraría**, si se puede estimar. Ver
   [Impacto operativo](../proyecto/IMPACTO-OPERATIVO.md).

**El punto 3 es el que más importa.** Casi todas las buenas funcionalidades de este sistema salieron
de que alguien describió lo que hacía a mano todos los días. El módulo de anuncios nació así.

---

## Flujo de un cambio de código

### 01 RAMA

Trabaja siempre en rama. **Nunca en `main` directo.**

```bash
git checkout -b nombre-corto-del-cambio
```

### 02 CAMBIA

Regla base: **el cambio más pequeño que resuelve el problema.** Si mientras estás ahí ves otras tres
cosas que arreglar, anótalas y hazlas aparte.

Lo que va junto en el mismo cambio:

- El código.
- La documentación que ese código vuelve mentira.
- La entrada en la [bitácora](BITACORA-DE-CAMBIOS.md).

**Documentación vieja hace más daño que documentación ausente.** No la dejes para después.

### 03 PRUEBA

No hay pruebas automatizadas. La verificación es manual y **no es opcional**:

- [ ] Subiste los archivos al editor de Apps Script.
- [ ] `verificarVersionDelCodigo()` → sin funciones en "VERSIÓN VIEJA".
- [ ] `revisionMaestra()` → todo ✔.
- [ ] Probaste el flujo que tocaste, de punta a punta, con una cuenta real.
- [ ] Probaste **el flujo de al lado**. En un ámbito global compartido, las cosas se tocan.
- [ ] Si tocaste interfaz: se ve bien en los tres temas, aguanta escala `xl` y se ve de 375 px a
      1440 px.
- [ ] Si tocaste una escritura: la generación de caché sube (`cotCacheDiagnostico()`).

### 04 COMMIT

Un commit por cambio lógico. Mensaje en español, imperativo, que diga **qué** y **por qué**:

```
Agrega gate de identidad a getQuoteDetails

Cualquiera del dominio podía leer una cotización ajena
conociendo el folio (A-01 del informe de seguridad).
```

**No:** `cambios`, `fix`, `update`, `wip`.

### 05 ENTREGA

```bash
git push -u origin nombre-corto-del-cambio
```

Y abre un pull request con:

- **Qué cambió** y por qué.
- **Cómo lo probaste** — el checklist de arriba.
- **Qué puede romperse.** Sé honesto: es más útil que decir que todo está bien.
- **Qué documentación actualizaste.**

---

## Cambiar contenido, sin código

Buena parte del sistema se cambia **sin tocar el repositorio**:

| Qué | Dónde |
|---|---|
| Herramientas, formatos, plantillas, puntos de pago | Hoja del Portal |
| Promociones y Marketplace | Hojas `Promociones` y `MKP` |
| Anuncios | [Constructor de Anuncios](../guias/MANUAL-DE-ANUNCIOS.md) |
| Formatos de cotización habilitados | Panel de supervisión |
| Rol avanzado de un usuario | Columna `Avanzado` de `Registros` |

**Si tu cambio es de contenido, hazlo ahí.** No hace falta pasar por aquí.

> Al editar una hoja: puedes reordenar columnas e insertar nuevas. **No renombres** una columna que
> el código busca — eso sí rompe. Ver [Referencia de datos](../tecnico/REFERENCIA-DE-DATOS.md).

---

## Contribuir documentación

Aplican las mismas reglas, más estas:

- **Archivos en `MAYUSCULAS-CON-GUIONES.md`**, carpetas en minúsculas.
- **Un documento, una audiencia.** Si le sirve a dos públicos distintos, va partido en dos.
- **La primera línea dice qué es y para quién.**
- **Nada de secretos.** Solo el **nombre** de la propiedad de script, nunca su valor.
- **Enlaza en lugar de duplicar.** La información repetida se desincroniza.
- **Actualiza el [índice](../README.md)** si agregas un documento.

Antes de entregar:

- [ ] ¿Alguien no técnico podría ejecutar esto sin preguntar?
- [ ] ¿La primera frase dice qué es y para quién?
- [ ] ¿Hay algún párrafo de más de 4 líneas? Pártelo.
- [ ] ¿Hay jerga corporativa? Quítala.
- [ ] ¿Los pasos están numerados y en imperativo?
- [ ] ¿Se explicó el "para qué", no solo el "qué"?
- [ ] ¿Acentuación y ortografía correctas?
- [ ] ¿El impacto está en horas o en algo tangible, no en adjetivos?

---

## Lo que no se acepta

- **Secretos en el código.** Van en propiedades del script. Sin excepción.
- **Refactorizaciones grandes sin hablarlo antes.**
- **Librerías nuevas desde CDN** sin versión fijada y SRI. Preferible: servirla desde el proyecto.
  Ver [ADR-0006](../decisiones/ADR-0006-TAILWIND-COMPILADO-EN-LUGAR-DE-CDN.md).
- **Funciones que tocan datos sin control de identidad adentro.**
- **Comentarios en inglés** en archivos que los tienen en español.
- **Cambios de estilo mezclados con cambios de lógica.** Se revisan por separado.
- **Deshacer una decisión de un ADR** sin escribir el ADR que la reemplaza.

---

## Cómo se revisa

Lo revisa el responsable técnico. Lo que se mira, en orden:

1. **¿Resuelve el problema que dice resolver?**
2. **¿Rompe algo?** Sobre todo en el ámbito global compartido.
3. **¿Tiene control de identidad** donde toca datos?
4. **¿Escapa** lo que viene del usuario?
5. **¿Sigue los estándares del proyecto?**
6. **¿La documentación quedó al día?**

Un comentario en la revisión no es una crítica: es cómo se sostiene un proyecto que usa gente real
con datos reales.

---

## Reconocimiento

Las contribuciones sostenidas se registran en
[Equipo y roles](../proyecto/EQUIPO-Y-ROLES.md). No hace falta pedirlo. Si aportaste y no apareces,
avisa: se corrige.
