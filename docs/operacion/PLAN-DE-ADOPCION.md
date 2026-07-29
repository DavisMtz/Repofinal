# Plan de adopción

Cómo se abre el Sistema Integral Ventel al área: en fases, con validación, y apoyado en que la gente
lo quiera usar. Para quien decide cuándo se abre la siguiente puerta.

**El principio:** la adopción no se ordena. Se gana. Una herramienta que se impone se usa a medias
y se abandona en cuanto nadie mira; una que se recomienda entre compañeros se sostiene sola.

---

## Las cuatro fases

```
01 GRUPO SEMILLA  →  02 ADOPCIÓN ORGÁNICA  →  03 VALIDACIÓN QA  →  04 LANZAMIENTO GENERAL
   3–5 personas       por recomendación        se revisa antes       apertura al resto
                                                de abrir
```

Ninguna fase empieza hasta que la anterior cumple su criterio de salida. **Saltarse una no acelera
nada: mueve el problema a donde cuesta más caro.**

---

## 01 GRUPO SEMILLA

**Qué es:** un núcleo pequeño que usa el sistema en su trabajo real, todos los días.

**Cuánta gente:** 3 a 5. Más que eso y la retroalimentación se vuelve ruido.

**A quién invitar:**

- Gente que **quiere** probarlo. No la que tenga tiempo libre.
- Que cotice a diario. La herramienta se prueba usándola, no revisándola.
- Que sepa decir "esto no me sirve" sin adornos.
- Al menos una persona de supervisión, para tener la mirada de validación desde el día uno.

**Cómo se acompaña:**

- La [Guía de usuario](../guias/GUIA-DE-USUARIO.md) por delante. Si alguien necesita que le
  expliques algo que ya está escrito, el documento está mal — arréglalo.
- Un canal directo para reportar. Sin formulario, sin tickets.
- Respuesta el mismo día. En esta fase, el tiempo de respuesta importa más que la solución.

**Qué se mide:**

| Señal | Qué significa |
|---|---|
| Cotizaciones generadas por persona | Si baja, dejaron de usarlo. Pregunta por qué. |
| Correos enviados y su tasa de error | Salud del envío. |
| Reportes recibidos | Muchos reportes es **buena** señal: significa que lo están usando en serio. |
| Cuántos regresan al proceso viejo | La señal más honesta de todas. |

**Criterio de salida:**

- [ ] Todos completaron el ciclo entero: cotizar → PDF → enviar → consultar.
- [ ] Cero fallas bloqueantes abiertas.
- [ ] Los reportes bajaron y se estabilizaron.
- [ ] La validación funcional dio visto bueno. Ver
      [Equipo y roles](../proyecto/EQUIPO-Y-ROLES.md).
- [ ] Al menos una persona del grupo lo recomendó sin que se lo pidieran.

Ese último punto no es decorativo: **si nadie del grupo semilla lo recomienda por su cuenta, la
fase 2 no va a funcionar.** No abras; averigua qué falta.

---

## 02 ADOPCIÓN ORGÁNICA

**Qué es:** la herramienta se expande por recomendación, no por anuncio.

**Cómo funciona:** el grupo semilla la usa a la vista de todos. Quien pregunta, entra. No hay
convocatoria, ni correo masivo, ni capacitación obligatoria.

**Por qué así:**

- Quien entra porque quiere, aprende solo. Quien entra porque se lo mandaron, pregunta todo.
- El ritmo de entrada lo marca la capacidad real de soporte, no un calendario.
- Cada persona nueva llega recomendada por un compañero, no por un jefe. Eso cambia por completo la
  disposición.

**Cómo se acompaña:**

- Documentación a la mano. Ni una sesión de capacitación en esta fase.
- Se atiende igual de rápido que en la fase 1.
- **Se anotan las preguntas que se repiten.** Cada una es un hueco en la documentación: se cierra
  en [Preguntas frecuentes](../guias/PREGUNTAS-FRECUENTES.md), no explicándola otra vez.

**Qué se mide:**

| Señal | Qué significa |
|---|---|
| Asesores activos por semana | El indicador principal. Debe crecer solo. |
| De dónde vino cada persona nueva | Si dice "me lo recomendó fulano", va bien. |
| Preguntas repetidas | Cada una es documentación faltante. |
| Volumen de cotizaciones | Si crece con la gente, la herramienta aguanta. |

**Criterio de salida:**

- [ ] El número de asesores activos creció **sin empujarlo**.
- [ ] Nadie que entró se regresó al proceso viejo.
- [ ] Las preguntas repetidas ya están documentadas.
- [ ] El sistema aguantó el volumen sin degradarse.

**Señal de alarma:** si el número deja de crecer, no lo empujes. Pregúntale a quien no entró por
qué no. La respuesta casi siempre es concreta y se arregla.

---

## 03 VALIDACIÓN QA

**Qué es:** la revisión formal antes de abrir. Aquí es donde el proyecto pasa de "funciona" a "se
puede sostener".

**Qué se revisa:**

### Seguridad — bloqueante

- [ ] **C-01** cerrado: webhook rotado, secretos migrados, constantes vacías.
- [ ] **C-02** cerrado: la identidad ya no la declara el navegador.
- [ ] **C-03** cerrado: el HTML del correo se arma en el servidor.
- [ ] Fase 1 completa del [plan de seguridad](SEGURIDAD.md).

**Sin esto no se abre.** El sistema trata PII de clientes, y abrirlo con C-02 vivo significa que
cualquier empleado del dominio puede leer la base completa.

### Funcional

- [ ] El ciclo completo probado con datos reales.
- [ ] Los dos formatos de PDF, revisados por quien conoce el formato oficial.
- [ ] Todas las plantillas de correo, revisadas.
- [ ] El panel de supervisión cuadra contra la hoja.
- [ ] `revisionMaestra()` sale todo ✔.

### Operativo

- [ ] La documentación cubre todo lo que se pregunta.
- [ ] El [Runbook](RUNBOOK.md) resuelve las fallas que ya ocurrieron.
- [ ] Hay plan de respaldo de las hojas.
- [ ] Está claro quién responde cuando el responsable técnico no está.

### Aprobaciones

- [ ] Validación funcional.
- [ ] Coordinación.
- [ ] Las áreas que tengan que dar visto bueno según la ruta de escalamiento.

**Criterio de salida:** todo lo anterior en ✔, por escrito.

---

## 04 LANZAMIENTO GENERAL

**Qué es:** la apertura al resto del área.

**Cómo se abre:**

1. **Anuncio en el propio Portal.** La herramienta se presenta a sí misma. Ver
   [Manual de anuncios](../guias/MANUAL-DE-ANUNCIOS.md).
2. **Comunicado corto** con la URL y el enlace a la guía. Nada de manual adjunto.
3. **Una sesión de preguntas, opcional.** Para quien la quiera, no para todos.
4. **Los del grupo semilla son el soporte de primera línea.** Ya saben, y la gente les tiene más
   confianza que a un instructivo.

**Qué se mide en las primeras semanas:**

| Señal | Umbral |
|---|---|
| Asesores activos contra el total del área | El objetivo real. |
| Cotizaciones por día | Debe subir de forma sostenida. |
| Correos con error | Si sube de golpe, algo se rompió. |
| Reportes de enlace roto | Sube al principio y se estabiliza. |
| Preguntas al soporte | Debe bajar semana a semana. |

**Después del lanzamiento:**

- Revisión semanal de las señales. Ver
  [Guía de supervisión](../guias/GUIA-DE-SUPERVISION.md).
- Reporte mensual de impacto en horas. Ver
  [Impacto operativo](../proyecto/IMPACTO-OPERATIVO.md).
- La documentación se actualiza con lo que se siga preguntando.

---

## Estado actual

**Fase 1 — Grupo semilla.** Versión 0.9, pruebas de control.

Lo que sigue, en orden:

1. Cerrar los tres hallazgos críticos de seguridad.
2. Terminar la validación con el grupo semilla.
3. Escalar a coordinación y gerencia para el visto bueno.
4. Abrir la fase 2.

---

## Lo que este plan evita, a propósito

- **Capacitación masiva antes de tener la herramienta madura.** Enseñar algo que va a cambiar es
  tirar el tiempo dos veces.
- **Abrir a todos de un jalón.** Si algo falla, falla para todos y la primera impresión no se
  recupera.
- **Obligar a usarla.** Genera resistencia y esconde los problemas: la gente deja de reportar y
  empieza a evadir.
- **Medir adopción por accesos.** Entrar no es usar. Lo que cuenta son cotizaciones y correos.
- **Abrir sin cerrar seguridad.** No es formalismo: es PII de clientes reales.
