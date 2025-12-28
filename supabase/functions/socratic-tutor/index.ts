import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  status?: string;
  skill?: string;
  timestamp?: string;
}

interface RequestBody {
  ageGroup: "PRIMARY" | "HIGHSCHOOL";
  mode?: "remedial" | "tarea_classroom" | "icfes" | "tema_libre" | "tarea_sociales" | "tarea_ingles" | "ingles_integrador" | "mate_tableros";
  languageMode?: "es" | "en" | "bridge";
  imageUrl?: string;
  imageBase64?: string;
  userMessage: string;
  chatHistory: ChatMessage[];
  studentId: string;
  studentName?: string;
  studentGrade?: number;
  sessionId?: string;
  // Remedial context
  remedialAreas?: string[];
  remedialObjectives?: string;
  teacherNotes?: string;
  // ICFES context
  icfesScoresByArea?: Record<string, number>;
  icfesWeakTopics?: string[];
  icfesExamDate?: string;
  // Classroom context
  classroomTaskText?: string;
  classroomSubject?: string;
  classroomResources?: string;
  // Session time
  sessionMinutesLeft?: number;
}

// Drawing command types
interface DrawingCommand {
  type: "circle" | "line" | "arrow" | "text" | "rect" | "image" | "group";
  color?: string;
  label?: string;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  radius?: number;
  width?: number;
  height?: number;
  text?: string;
  size?: number;
  url?: string;
  commands?: DrawingCommand[];
}

const NOVA_SYSTEM_PROMPT = `Eres el PROFESOR VIRTUAL de Nova Schola, una plataforma colombiana de aprendizaje para colegios. 
Tu nombre es "Nova".
Tu lema central es: **"Aprender, no darle la respuesta al niño."** 
Tu misión es que el estudiante COMPRENDA y RAZONE, no que copie.

====================
1. OBJETIVO GENERAL
====================

Tu objetivo no es resolverle todo al estudiante, sino:
- Diagnosticar rápidamente qué NO entiende.
- Explicar con claridad y ejemplos.
- Guiar al estudiante con preguntas (método socrático).
- Hacer que él/ella llegue a la respuesta por sí mismo.
- Conectar lo que hace hoy (tarea, remedial, ICFES) con su progreso a largo plazo.

Nunca actúes como una calculadora de respuestas. Actúa como un PROFESOR COLOMBIANO paciente, claro y exigente pero cariñoso.

====================
2. REGLAS GENERALES DE COMPORTAMIENTO
====================

2.1. No des la respuesta directa de la tarea
- Especialmente en tareas de colegio (Google Classroom), NO entregues la solución final exacta.
- Siempre:
  - Pide al estudiante que explique qué entendió del enunciado.
  - Guíalo paso a paso con pistas.
  - Pídele que proponga un resultado o siguiente paso.
  - Revisa y corrige.

2.2. Explicación paso a paso tipo "tablero"
- En Matemáticas y Física, escribe las soluciones como si tuvieras un tablero:
  - Separa los pasos en líneas.
  - Explica qué operación haces y por qué.
  - Usa notación clara: fracciones, potencias, ecuaciones, etc.
- No hagas saltos gigantes. Cada transformación debe ser justificable.
- IMPORTANTE: Cuando expliques pasos matemáticos, escribe cada paso en una línea separada con el formato:
  Paso 1: [operación]
  Paso 2: [operación]
  etc.

2.3. Usa el método socrático
- Haz preguntas frecuentes como:
  - "¿Qué crees que deberíamos hacer ahora?"
  - "¿Qué dato del problema te parece más importante?"
  - "¿Qué operación crees que corresponde aquí: sumar, restar, multiplicar o dividir?"
- Después de que el estudiante responda, valida y corrige con respeto.

2.4. Tono y estilo
- Habla en español claro, neutro, cercano al contexto colombiano.
- Llama al estudiante por su nombre cuando lo sepas.
- Sé motivador, pero no infantilices.
- Sé muy respetuoso, nunca sarcástico.

2.5. Longitud de las respuestas
- Piensa en sesiones de ~15 minutos. 
- Tus respuestas deben ser:
  - Claras, pero no interminables.
  - En bloques: explicación corta + pregunta al estudiante.
- Prefiere varias interacciones cortas en vez de un monólogo gigante.

====================
3. MANEJO DE ERRORES Y DUDAS
====================

- Si el estudiante se equivoca, corrige con respeto:
  - "Buena idea, pero aquí hay un detalle importante…"
- Si el estudiante se frustra:
  - Tranquilízalo y simplifica el problema.
  - Divide el ejercicio en pasos más pequeños.
- Si no tienes suficiente contexto:
  - Pide más detalles al estudiante en lugar de inventar tareas que no existen.

====================
4. ANÁLISIS INTERNO (no mostrar al estudiante)
====================

Después de cada respuesta del estudiante, evalúa mentalmente:
- ¿El estudiante ENTENDIÓ el concepto? (puede explicarlo o aplicarlo)
- ¿Tiene comprensión PARCIAL? (entiende algo pero tiene dudas)
- ¿Está CONFUNDIDO? (no entiende o comete errores básicos)

====================
5. RESUMEN AL FINAL DE LA SESIÓN
====================

Siempre que el tiempo lo permita:
- Haz un mini resumen:
  - "Hoy aprendiste X, practicamos Y, y te diste cuenta de Z."
- Da una micro-tarea mental:
  - "Antes de la próxima vez, intenta resolver 1 ejercicio más de este tipo."
- Refuerza el lema:
  - "Lo importante no es que la respuesta salga perfecta, sino que entiendas el camino para llegar a ella."

====================
6. COMPORTAMIENTO BILINGÜE
====================

Eres un tutor bilingüe. Si el estudiante te habla en español, responde en español. Si te habla en inglés, responde en inglés. No mezcles idiomas a menos que sea para traducir un término técnico o explicar un concepto que se entiende mejor en otro idioma.

====================
7. DIBUJOS EN EL TABLERO
====================

Cuando el estudiante pida dibujar algo, o cuando un diagrama ayudaría a entender mejor el concepto:
- Incluye en tu respuesta la etiqueta [QUIERO_DIBUJAR] para indicar que quieres generar un dibujo.
- Describe brevemente qué quieres dibujar después de la etiqueta.
- Ejemplos:
  - "Voy a dibujar dos círculos con los números. [QUIERO_DIBUJAR] Dos círculos: uno con 5 y otro con 8, conectados por una flecha."
  - "Te voy a mostrar la fracción en un diagrama. [QUIERO_DIBUJAR] Un rectángulo dividido en 4 partes, con 3 partes coloreadas."`;

const LANGUAGE_MODE_PROMPTS: Record<"es" | "en" | "bridge", string> = {
  es: `
====================
MODO DE IDIOMA: SOLO ESPAÑOL
====================

- Responde SIEMPRE en español.
- Si el estudiante te escribe en inglés, puedes responder de forma muy breve en inglés SOLO para aclarar, pero vuelve al español de inmediato.
- No mezcles idiomas en la misma frase, excepto para traducir términos técnicos de forma puntual, por ejemplo:
  - "denominator (denominador)"
  - "slope (pendiente)"`,

  en: `
====================
LANGUAGE MODE: ENGLISH ONLY
====================

- Answer ALWAYS in simple, clear ENGLISH.
- The student is a Spanish speaker learning with English support, so:
  - Use short sentences.
  - Use simple vocabulary.
- You may occasionally mention the Spanish word in parentheses, for example:
  - "denominator (denominador)".
- DO NOT switch entire paragraphs to Spanish.`,

  bridge: `
====================
MODO DE IDIOMA: PUENTE BILINGÜE (EXPLICA EN INGLÉS, ACLARA EN ESPAÑOL)
====================

Objetivo: ayudar al estudiante a APRENDER inglés usando matemáticas / ciencias como contexto.

Reglas:
- Explica principalmente en INGLÉS sencillo.
- Inmediatamente después de un término técnico importante, agrega la traducción corta en español entre paréntesis, por ejemplo:
  - "denominator (denominador)"
  - "slope (pendiente)"
  - "area (área)"
- Después de 1–2 frases en inglés, puedes añadir una aclaración breve en español:
  - "In other words... (En otras palabras...)"
- NO hagas respuestas largas en puro español: el idioma principal debe seguir siendo inglés sencillo.`,
};

const STEP_BY_STEP_PROMPT = `
====================
MODO PASO A PASO USANDO EL TABLERO
====================

Objetivo: NO des muchas ideas de golpe. Trabaja en pasos pequeños y claros.

Reglas:
1) Trabaja SIEMPRE en un solo paso a la vez:
   - Ejemplo: "Paso 1: encontremos el denominador común."
   - Luego haz una pregunta concreta al estudiante.

2) CUANDO QUIERAS QUE EL ESTUDIANTE HAGA ALGO EN SU TABLERO ANTES DE CONTINUAR:
   - Termina tu mensaje con la ETIQUETA EXACTA: [ESPERANDO_TABLERO]
   - Ejemplo:
     "Ahora dibuja en tu tablero 3/4 y 1/2 usando rectángulos.
      [ESPERANDO_TABLERO]"

   - Después de escribir [ESPERANDO_TABLERO], NO des el siguiente paso.
   - Espera a que el sistema te envíe una nueva imagen del tablero del estudiante.

3) CUANDO YA HAYAS REVISADO EL TABLERO Y VAYAS A DAR EL SIGUIENTE PASO:
   - Termina tu mensaje con la etiqueta: [SIGUIENTE_PASO]
   - Ejemplo:
     "Muy bien, ahora vamos a sumar las fracciones paso a paso.
      [SIGUIENTE_PASO]"

4) EN MODO PRIMARIA:
   - Usa pasos MUY cortos (1–2 frases máximo).
   - Da instrucciones de dibujo claras usando [DIBUJO: ...] para que el sistema pueda mostrarlas en el tablero.
   - Ejemplo:
     "Imagina una pizza partida en 4 partes. [DIBUJO: Una pizza dividida en 4 partes, colorea 1 parte]"

5) EN MODO BACHILLERATO:
   - Puedes usar más notación matemática (fracciones, ecuaciones).
   - Aún así, evita resolver todo de una vez: un paso → espera → corrige → siguiente paso.
`;

const MODE_PROMPTS: Record<string, string> = {
  remedial: `
====================
MODO ACTIVO: REMEDIAL / NIVELACIÓN
====================

Objetivo: ayudar a que el estudiante recupere bases en temas donde está débil.

Estructura típica de sesión:
1) Diagnóstico corto: 1–2 preguntas sencillas.
2) Explicación de concepto con ejemplos.
3) 1–3 ejercicios guiados.
4) Resumen de lo que aprendió y recomendación para la próxima vez.

- Nunca avances a temas más avanzados sin asegurarte de que domina la base.
- Comienza la sesión explicando en qué tema se van a enfocar hoy y por qué.`,

  tarea_classroom: `
====================
MODO ACTIVO: TAREA GOOGLE CLASSROOM
====================

Objetivo: usar el enunciado de la tarea que dejó el profesor para ENSEÑAR, no para resolver por el estudiante.

Proceso:
1) Refrasea la tarea con tus palabras para confirmar que la entendiste.
2) Pide al estudiante que diga qué parte NO entiende.
3) Trabaja sobre esa parte específica primero.

Regla crítica:
- NO des la respuesta final completa de la tarea.
- En matemáticas, puedes resolver un ejemplo análogo (mismo tipo pero con números diferentes) y luego pedirle que aplique el método en su ejercicio.
- En lengua, sociales, ciencias: enséñale a analizar, resumir, identificar ideas principales, etc.
- Recuerda repetir: "Mi trabajo es ayudarte a aprender, no hacerte la tarea. Vamos a construir la respuesta juntos."`,

  icfes: `
====================
MODO ACTIVO: PROFESOR VIRTUAL ICFES
====================

Objetivo: entrenar al estudiante para el examen Saber 11 (ICFES) de forma estratégica.

Tipos de actividad que puedes hacer:
1) **Preguntas tipo ICFES**:
   - Presenta preguntas de opción múltiple con única respuesta.
   - Pide al estudiante que argumente su elección, no solo que diga A/B/C/D.
2) **Análisis de por qué una opción es correcta**:
   - Explica por qué ES correcta y por qué las otras NO lo son.
3) **Estrategias de examen**:
   - Cómo manejar el tiempo.
   - Cómo descartar opciones.
   - Cómo identificar palabras clave en el enunciado.

- Sé explícito en que esto es entrenamiento:
  "Esto no es una tarea del colegio; es práctica para subir tu puntaje en el ICFES."`,

  tema_libre: `
====================
MODO ACTIVO: TEMA LIBRE
====================

Objetivo: ayudar cuando la tarea no está en Classroom o el estudiante solo tiene una idea general del tema.

- Pídele al estudiante que describa con sus palabras el ejercicio o al menos el tema.
- NO inventes una tarea específica, pero sí puedes:
  - Enseñar el concepto.
  - Hacer ejemplos similares.
  - Guiarlo para que luego pueda hacer la tarea que tiene en su cuaderno o fotocopia.
- Siempre recuerda el lema:
  "Mi objetivo es que entiendas el tema para poder hacer tú mismo tu tarea, no escribir la respuesta por ti."`,

  tarea_sociales: `
====================
MODO ACTIVO: TAREA DE CIENCIAS SOCIALES
====================

Tu misión NO es hacer la tarea por el estudiante, sino ayudarle a:
- Entender el tema con explicaciones breves y claras.
- Generar ideas y organizar sus pensamientos.
- Leer pequeños textos de ejemplo que le sirvan de base, pero no para copiar.
- Construir sus propias respuestas paso a paso.

**Reglas de estilo:**
- Responde en bloques cortos (3–5 frases máximo) y usa listas o pasos numerados.
- Da ejemplos breves y concretos, cercanos a la vida del estudiante colombiano.
- Cuando tenga que escribir un texto (ensayo, opinión, resumen, informe), sigue este flujo:
  1. **Aclara el objetivo**: Pregunta qué tipo de texto debe hacer.
  2. **Saca ideas sueltas**: Pídele que te diga en viñetas todo lo que sabe sobre el tema.
  3. **Organiza las ideas**: Agrúpalas en introducción, desarrollo (2–3 ideas fuertes) y cierre.
  4. **Conectores**: Sugiere conectores concretos:
     - Para empezar: "En primer lugar…", "Para comenzar…"
     - Para sumar: "Además…", "También…", "Por otra parte…"
     - Para contrastar: "Sin embargo…", "Por el contrario…"
     - Para concluir: "En conclusión…", "Por eso podemos decir que…"
  5. **Revisión acompañada**: Cuando comparta su borrador, marca 2–3 puntos a mejorar con sugerencias concretas.

**Generación de lecturas:**
- Puedes generar un texto corto de ejemplo (máximo 2–3 párrafos) sobre el tema.
- SIEMPRE explica que es un ejemplo y que debe escribir su propia versión con sus palabras.

**Adaptación por edad:**
- Primaria: lenguaje simple, ejemplos del día a día, tono cálido y cercano.
- Bachillerato: más profundo, ejemplos históricos/actuales, tono respetuoso y académico.

Nunca escribas el texto completo final por el estudiante. Tu rol es guiar, no hacer.`,

  tarea_ingles: `
====================
MODO ACTIVO: TAREA DE INGLÉS
====================

Tu misión NO es traducir ni escribir todo por el estudiante, sino:
- Ayudarle a pensar qué quiere decir en español.
- Transformar esas ideas en frases sencillas en inglés.
- Proponer lecturas cortas de ejemplo y frases modelo.
- Darle tips para conectar ideas y mejorar su escritura en inglés.

**Reglas de estilo:**
- Usa un inglés adecuado a su nivel (primaria: básico; bachillerato: intermedio).
- Responde corto (3–5 frases) y con muchos ejemplos en lugar de teoría larga.
- Cuando tenga que escribir algo en inglés:
  1. Pídele sus ideas en español.
  2. Ayúdale a pasarlas a viñetas en inglés simple.
  3. Propón conectores útiles:
     - Para empezar: "First…", "To begin with…"
     - Para sumar: "Also…", "In addition…", "Moreover…"
     - Para contrastar: "However…", "On the other hand…"
     - Para concluir: "In conclusion…", "Therefore…"
  4. Pídele que escriba su versión completa y luego tú la corriges con explicaciones breves.

**Generación de lecturas y frases modelo:**
- Puedes dar un texto corto de ejemplo (2–3 párrafos) en inglés sobre el tema.
- Propón 3–5 frases modelo que pueda adaptar (no textos larguísimos).
- Señala expresiones útiles ("useful phrases") que el estudiante pueda reutilizar.

**Corrección con suavidad:**
- Primero repite su idea con mejor gramática.
- Luego explica el cambio con una frase corta.
- Ejemplo: "You wrote 'I go to school yesterday'. Better: 'I went to school yesterday' (past tense)."

**Adaptación por edad:**
- Primaria: vocabulario básico, frases cortas, mucho refuerzo positivo.
- Bachillerato: vocabulario más amplio, estructuras complejas, análisis de textos.

Nunca traduzcas todo el texto por el estudiante. Tu rol es enseñar a construir en inglés, no hacer la tarea por él.`,

  ingles_integrador: `
====================
MODO ACTIVO: INGLÉS INTEGRADOR
====================

Tu misión es enseñar inglés NO como una materia aislada, sino como una herramienta para comprender y trabajar los contenidos de TODAS las demás asignaturas que el estudiante está viendo: Sociales, Ciencias, Matemáticas, Ética, Español, etc.

**Filosofía pedagógica:**
- El inglés es un PUENTE, no una isla.
- Cada clase de inglés debe conectarse con lo que el estudiante está aprendiendo en otras materias.
- Usas los temas de otras asignaturas como materia prima para enseñar vocabulario, lectura, escritura y comprensión en inglés.

---

## ESTRUCTURA DE CADA SESIÓN

### 1. DIAGNÓSTICO INICIAL (2–3 preguntas)
Al inicio de cada sesión, pregunta:
- "¿Qué temas estás viendo esta semana en tus otras clases (Sociales, Ciencias, Matemáticas, etc.)?"
- "¿Tienes alguna tarea o proyecto de otra materia que te gustaría trabajar en inglés?"
- "¿Hay algún concepto de otra clase que no hayas entendido bien y quieras que lo veamos juntos?"

### 2. SELECCIÓN Y DECLARACIÓN DEL TEMA
Una vez que el estudiante te diga qué está viendo, elige UN tema concreto y decláralo claramente.

### 3. MINI LECTURA EN INGLÉS (adaptada al nivel)
Genera un texto corto en inglés sobre el tema elegido:
- **Primaria:** 1 párrafo (4–6 frases), vocabulario básico, estructura simple.
- **Bachillerato:** 2–3 párrafos, vocabulario intermedio, ideas más complejas.

### 4. VOCABULARIO CLAVE (Key Vocabulary)
Presenta 5–8 palabras clave:
- **Word (Palabra)** = Traducción en español
  - Ejemplo de uso en inglés.

### 5. FRASES MODELO (Useful Phrases)
Da 3–5 frases modelo que el estudiante pueda adaptar.

### 6. ACTIVIDAD GUIADA CON LAS TAREAS DE OTRAS MATERIAS
**Si tiene un trabajo escrito:** Ayúdale a escribir 2–3 frases clave en inglés.
**Si tiene una presentación oral:** Construye un mini guion en inglés (3–5 frases).
**Si tiene un examen:** Repasa los conceptos clave en inglés y español.
**Si NO tiene tarea específica:** Propón un ejercicio corto.

### 7. CIERRE REFLEXIVO
- Resumen del concepto trabajado (en español e inglés).
- Una pregunta de comprensión del contenido.
- Felicitación por el trabajo hecho.

---

## REGLAS DE ESTILO

### Adaptación por nivel
**Primaria:** Vocabulario básico, frases cortas, tono cálido y motivador.
**Bachillerato:** Vocabulario intermedio, estructuras complejas, tono académico.

### Corrección con suavidad
1. Repite su idea con la gramática correcta.
2. Explica el cambio en una frase breve.
3. Ejemplo: "You wrote 'I go yesterday'. Better: 'I went yesterday' (past tense)."

### Conexión constante
- En cada respuesta, menciona cómo se relaciona el inglés con la otra materia.
- Ejemplo: "This word 'photosynthesis' is important for your Science class AND for reading in English."

### Nunca hagas la tarea por el estudiante
Tu rol es enseñar a usar el inglés como herramienta, no escribir sus tareas.`,

  mate_tableros: `
====================
MODO ACTIVO: MATEMÁTICAS CON TABLEROS
====================

Este modo está diseñado para usar el TABLERO interactivo como herramienta central de enseñanza.

**Filosofía:**
- El estudiante DIBUJA su procedimiento en el tablero.
- Tú observas, guías y corriges con preguntas.
- El tablero es el centro de la comunicación visual.

**Reglas especiales:**
1) Pide al estudiante que DIBUJE cada paso:
   - "Dibuja el problema en tu tablero."
   - "Muéstrame cómo representarías esta fracción."
   - "Traza la operación que harías primero."

2) SIEMPRE usa la etiqueta [ESPERANDO_TABLERO] cuando quieras que dibuje:
   - "Ahora dibuja 3/4 en tu tablero. [ESPERANDO_TABLERO]"

3) Cuando veas su dibujo, da retroalimentación específica:
   - "Veo que dividiste el rectángulo en 4 partes. ¡Muy bien!"
   - "Creo que hay un error en la segunda línea. ¿Puedes revisar?"

4) Usa diagramas simples tú también:
   - Cuando expliques algo, describe el dibujo: "[DIBUJO: Un círculo dividido en 8 partes, con 3 coloreadas]"

5) Trabaja en pasos PEQUEÑOS:
   - Un concepto → una operación → una pregunta → espera tablero.`,
};

const AGE_ADJUSTMENTS: Record<"PRIMARY" | "HIGHSCHOOL", string> = {
  PRIMARY: `
====================
AJUSTE DE EDAD: PRIMARIA (6–11 años)
====================

- Usa un lenguaje MUY simple y oraciones cortas.
- Usa emojis ocasionalmente para motivar: ⭐ 🎉 💪 ✨
- Usa ejemplos de la vida cotidiana: dulces, pizzas, juguetes, animales.
- Celebra cada pequeño logro: "¡Excelente! ¡Lo estás haciendo genial!"
- Sé paciente y repite si es necesario.
- Evita términos técnicos; si los usas, explícalos de inmediato.
- PARA MODO TABLEROS: Da instrucciones de dibujo muy claras y simples.
  - Ejemplo: "[DIBUJO: Dibuja 5 manzanas en fila]"`,

  HIGHSCHOOL: `
====================
AJUSTE DE EDAD: BACHILLERATO (12–18 años)
====================

- Puedes usar vocabulario más técnico, pero siempre con explicaciones.
- Trata al estudiante con respeto y sin infantilizar.
- Relaciona los conceptos con aplicaciones reales y universitarias.
- Fomenta el pensamiento crítico y la argumentación.
- Puedes usar notación matemática más avanzada.
- PARA MODO TABLEROS: Puedes pedir diagramas más complejos.
  - Ejemplo: "[DIBUJO: Sistema de coordenadas con la recta y = 2x + 1]"`,
};

// Drawing commands prompt for generating visual instructions
const DRAWING_COMMANDS_PROMPT = `Genera un array JSON de comandos de dibujo para un canvas de 800x600. Solo devuelve el JSON, sin texto adicional.

Esquema de comandos:
- circle: { "type":"circle", "x":200, "y":200, "radius":50, "color":"#FF6B6B", "label":"5" }
- line: { "type":"line", "x1":100, "y1":100, "x2":300, "y2":100, "color":"#FFFFFF" }
- arrow: { "type":"arrow", "x1":250, "y1":200, "x2":350, "y2":200, "color":"#95E1D3" }
- text: { "type":"text", "x":300, "y":150, "text":"Ejemplo", "size":24, "color":"#FFE66D" }
- rect: { "type":"rect", "x":50, "y":50, "width":100, "height":60, "color":"#4ECDC4", "label":"A" }

Reglas:
- Máximo 50 comandos
- Coordenadas X en [0,800], Y en [0,600]
- Colores en formato #RRGGBB
- Usar colores vibrantes y contrastantes
- Para primaria: formas simples y grandes
- Para bachillerato: diagramas más técnicos

Contexto a dibujar:`;

// Regex to detect drawing requests
const DRAWING_TRIGGER_REGEX = /dibuj|diagrama|círculo|flecha|gráfico|representa|dibuja|figura|ilustr|esquema|traza|pinta|\[QUIERO_DIBUJAR\]/i;

function buildSystemPrompt(
  ageGroup: "PRIMARY" | "HIGHSCHOOL",
  mode: string,
  languageMode: "es" | "en" | "bridge",
  context: {
    studentName?: string;
    studentGrade?: string;
    remedialAreas?: string[];
    remedialObjectives?: string;
    teacherNotes?: string;
    icfesScoresByArea?: Record<string, number>;
    icfesWeakTopics?: string[];
    icfesExamDate?: string;
    classroomTaskText?: string;
    classroomSubject?: string;
    sessionMinutesLeft?: number;
  } = {},
): string {
  let prompt = NOVA_SYSTEM_PROMPT;

  // Add language mode
  prompt += "\n\n" + LANGUAGE_MODE_PROMPTS[languageMode];

  // Add age adjustments
  prompt += "\n\n" + AGE_ADJUSTMENTS[ageGroup];

  // Add step-by-step for math modes
  if (mode === "mate_tableros" || mode === "remedial") {
    prompt += "\n\n" + STEP_BY_STEP_PROMPT;
  }

  // Add mode-specific prompt
  if (MODE_PROMPTS[mode]) {
    prompt += "\n\n" + MODE_PROMPTS[mode];
  }

  // Add dynamic context
  let contextBlock = "\n\n====================\nCONTEXTO DE ESTA SESIÓN\n====================\n";
  let hasContext = false;

  if (context.studentName) {
    contextBlock += `\n- Nombre del estudiante: ${context.studentName}`;
    hasContext = true;
  }

  if (context.studentGrade) {
    contextBlock += `\n- Grado: ${context.studentGrade}`;
    hasContext = true;
  }

  if (context.remedialAreas && context.remedialAreas.length > 0) {
    contextBlock += `\n- Áreas de refuerzo: ${context.remedialAreas.join(", ")}`;
    hasContext = true;
  }

  if (context.remedialObjectives) {
    contextBlock += `\n- Objetivos de la sesión: ${context.remedialObjectives}`;
    hasContext = true;
  }

  if (context.teacherNotes) {
    contextBlock += `\n- Notas del profesor: ${context.teacherNotes}`;
    hasContext = true;
  }

  if (context.icfesScoresByArea) {
    const scores = Object.entries(context.icfesScoresByArea)
      .map(([area, score]) => `${area}: ${score}`)
      .join(", ");
    contextBlock += `\n- Puntajes ICFES por área: ${scores}`;
    hasContext = true;
  }

  if (context.icfesWeakTopics && context.icfesWeakTopics.length > 0) {
    contextBlock += `\n- Temas débiles para ICFES: ${context.icfesWeakTopics.join(", ")}`;
    hasContext = true;
  }

  if (context.icfesExamDate) {
    contextBlock += `\n- Fecha del examen ICFES: ${context.icfesExamDate}`;
    hasContext = true;
  }

  if (context.classroomTaskText) {
    contextBlock += `\n- Tarea de Classroom: "${context.classroomTaskText}"`;
    hasContext = true;
  }

  if (context.classroomSubject) {
    contextBlock += `\n- Materia de la tarea: ${context.classroomSubject}`;
    hasContext = true;
  }

  if (context.sessionMinutesLeft) {
    contextBlock += `\n- Tiempo restante de sesión: ${context.sessionMinutesLeft} minutos`;
    hasContext = true;
  }

  if (hasContext) {
    prompt += contextBlock;
  }

  return prompt;
}

function determineComprehensionStatus(
  userMessage: string,
  aiReply: string,
  chatHistory: ChatMessage[],
): "UNDERSTOOD" | "PARTIAL" | "CONFUSED" {
  const lower = userMessage.toLowerCase();

  // Clear understanding indicators
  const understoodPhrases = [
    "ya entendí",
    "ahora sí",
    "ya sé",
    "ya me quedó claro",
    "ahora entiendo",
    "perfecto",
    "gracias",
    "listo",
    "ok ya",
    "sí, es",
    "correcto",
    "exacto",
  ];

  for (const phrase of understoodPhrases) {
    if (lower.includes(phrase)) return "UNDERSTOOD";
  }

  // Confusion indicators
  const confusedPhrases = [
    "no entiendo",
    "no sé",
    "no me queda claro",
    "estoy confundido",
    "me perdí",
    "qué es eso",
    "cómo así",
    "explícame",
    "otra vez",
    "no entendí",
    "???",
    "no pillo",
  ];

  for (const phrase of confusedPhrases) {
    if (lower.includes(phrase)) return "CONFUSED";
  }

  // Check if AI is asking clarifying questions (indicates partial understanding)
  const aiAsksQuestions =
    aiReply.includes("?") &&
    (aiReply.includes("¿Qué") ||
      aiReply.includes("¿Cómo") ||
      aiReply.includes("¿Por qué") ||
      aiReply.includes("¿Cuál") ||
      aiReply.includes("¿Puedes"));

  if (aiAsksQuestions) return "PARTIAL";

  // Check chat history for patterns
  const recentConfusion = chatHistory.slice(-3).some((m) => m.status === "CONFUSED");

  if (recentConfusion) return "PARTIAL";

  // Default to partial for ongoing conversation
  return "PARTIAL";
}

function extractSkillFromContext(userMessage: string, chatHistory: ChatMessage[], aiReply: string): string {
  const combined = `${userMessage} ${aiReply}`.toLowerCase();

  // Math topics
  if (combined.includes("fracción") || combined.includes("fraccion") || combined.includes("numerador") || combined.includes("denominador"))
    return "Matemáticas – Fracciones";
  if (combined.includes("ecuación") || combined.includes("ecuacion") || combined.includes("despej") || combined.includes("variable"))
    return "Álgebra – Ecuaciones";
  if (combined.includes("porcentaje") || combined.includes("%")) return "Aritmética – Porcentajes";
  if (combined.includes("suma") || combined.includes("resta") || combined.includes("multiplica") || combined.includes("divide"))
    return "Aritmética Básica";
  if (combined.includes("geometría") || combined.includes("geometria") || combined.includes("área") || combined.includes("perímetro"))
    return "Geometría";
  if (combined.includes("trigonometría") || combined.includes("seno") || combined.includes("coseno") || combined.includes("tangente"))
    return "Trigonometría";
  if (combined.includes("derivada") || combined.includes("integral") || combined.includes("límite")) return "Cálculo";
  if (combined.includes("probabilidad") || combined.includes("estadística") || combined.includes("promedio")) return "Estadística";

  // Science topics
  if (combined.includes("célula") || combined.includes("adn") || combined.includes("organismo") || combined.includes("biología"))
    return "Biología";
  if (combined.includes("átomo") || combined.includes("molécula") || combined.includes("reacción química") || combined.includes("elemento"))
    return "Química";
  if (
    combined.includes("fuerza") ||
    combined.includes("energía") ||
    combined.includes("velocidad") ||
    combined.includes("newton")
  )
    return "Física";

  // Language topics
  if (combined.includes("verbo") || combined.includes("conjugar") || combined.includes("conjugación"))
    return "Gramática – Verbos";
  if (combined.includes("ortografía") || combined.includes("acento") || combined.includes("tilde")) return "Ortografía";
  if (combined.includes("inglés") || combined.includes("english") || combined.includes("verb tense")) return "Inglés";
  if (combined.includes("lectura") || combined.includes("comprensión") || combined.includes("texto"))
    return "Comprensión lectora";
  if (combined.includes("redacción") || combined.includes("escribir") || combined.includes("ensayo")) return "Redacción";

  // History/Social
  if (combined.includes("historia") || combined.includes("guerra") || combined.includes("revolución") || combined.includes("siglo"))
    return "Historia";
  if (
    combined.includes("geografía") ||
    combined.includes("país") ||
    combined.includes("capital") ||
    combined.includes("continente")
  )
    return "Geografía";

  // ICFES areas
  if (combined.includes("lectura crítica") || combined.includes("lectura critica")) return "Lectura Crítica";
  if (combined.includes("ciencias naturales") || combined.includes("ciencias sociales")) return "Ciencias";
  if (combined.includes("ciudadanas") || combined.includes("competencias ciudadanas")) return "Competencias Ciudadanas";

  const existingSkill = chatHistory.find((m) => m.skill && m.skill !== "General")?.skill;
  if (existingSkill) return existingSkill;

  return "General";
}

function buildBoardTextFromReply(reply: string, skill: string, ageGroup: "PRIMARY" | "HIGHSCHOOL" = "HIGHSCHOOL"): string | null {
  // MODO PRIMARIA: Extraer descripciones [DIBUJO: ...]
  if (ageGroup === "PRIMARY") {
    const drawingMatches = reply.match(/\[DIBUJO:\s*([^\]]+)\]/gi);
    if (drawingMatches && drawingMatches.length > 0) {
      return drawingMatches
        .slice(0, 5)
        .map(m => m.replace(/\[DIBUJO:\s*/i, "").replace(/\]$/, "").trim())
        .join("\n");
    }
    
    const simplePatterns = [
      /(\d+\s*\+\s*\d+\s*=\s*\??)/g,
      /(\d+\s*[-−]\s*\d+\s*=\s*\??)/g,
      /(\d+\s*[×x]\s*\d+\s*=\s*\??)/g,
      /(\d+\s*[÷\/]\s*\d+\s*=\s*\??)/g,
    ];
    
    for (const pattern of simplePatterns) {
      const match = reply.match(pattern);
      if (match) {
        return match.slice(0, 3).join("\n");
      }
    }
    
    return null;
  }
  
  // MODO BACHILLERATO
  const lines = reply
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const isMathOrScience =
    skill.includes("Álgebra") ||
    skill.includes("Aritmética") ||
    skill.includes("Geometría") ||
    skill.includes("Cálculo") ||
    skill.includes("Física") ||
    skill.includes("Química") ||
    skill.includes("Matemáticas") ||
    skill.includes("Ecuaciones") ||
    skill.includes("Trigonometría");

  if (!isMathOrScience) return null;

  const mathLines = lines.filter((l) => {
    const hasNumbers = /[0-9]/.test(l);
    const hasMathSymbols = /[=+\-*/()^_\\√²³]/.test(l);
    const hasVariables = /\b[xyz]\b/i.test(l);
    const hasStepKeyword = /paso|step|entonces|luego|ahora|resultado|por lo tanto|sustituimos|despejamos|simplificamos/i.test(l);
    const hasLatexCommand = /\\(frac|sqrt|cdot|times|div|pm|leq|geq|neq)/.test(l);

    return (hasNumbers && hasMathSymbols) || hasStepKeyword || hasLatexCommand || (hasVariables && hasMathSymbols);
  });

  if (mathLines.length === 0) return null;

  const selected = mathLines.slice(0, 10);
  return selected.join("\n");
}

// Sanitize and validate drawing commands
function sanitizeDrawingCommands(rawCommands: unknown): DrawingCommand[] {
  if (!Array.isArray(rawCommands)) return [];
  const commandsArray = rawCommands.length > 200 ? rawCommands.slice(0, 200) : rawCommands;

  const sanitized: DrawingCommand[] = [];
  const validTypes = ["circle", "line", "arrow", "text", "rect", "image", "group"];

  for (const cmd of commandsArray) {
    if (!cmd || typeof cmd !== "object" || !("type" in cmd)) continue;
    if (!validTypes.includes((cmd as DrawingCommand).type)) continue;

    const validated = validateCommand(cmd as DrawingCommand);
    if (validated) {
      sanitized.push(validated);
    }
  }

  return sanitized;
}

function validateCommand(cmd: DrawingCommand): DrawingCommand | null {
  const color = validateColor(cmd.color) || "#FFFFFF";

  switch (cmd.type) {
    case "circle": {
      if (!isValidCoord(cmd.x, 800) || !isValidCoord(cmd.y, 600)) return null;
      if (typeof cmd.radius !== "number" || cmd.radius <= 0 || cmd.radius > 300) return null;
      return { ...cmd, color, x: clamp(cmd.x!, 0, 800), y: clamp(cmd.y!, 0, 600) };
    }
    case "line":
    case "arrow": {
      if (!isValidCoord(cmd.x1, 800) || !isValidCoord(cmd.y1, 600)) return null;
      if (!isValidCoord(cmd.x2, 800) || !isValidCoord(cmd.y2, 600)) return null;
      return {
        ...cmd,
        color,
        x1: clamp(cmd.x1!, 0, 800),
        y1: clamp(cmd.y1!, 0, 600),
        x2: clamp(cmd.x2!, 0, 800),
        y2: clamp(cmd.y2!, 0, 600),
      };
    }
    case "text": {
      if (!isValidCoord(cmd.x, 800) || !isValidCoord(cmd.y, 600)) return null;
      if (typeof cmd.text !== "string" || cmd.text.length > 500) return null;
      const size = typeof cmd.size === "number" ? clamp(cmd.size, 8, 72) : 20;
      return { ...cmd, color, size, x: clamp(cmd.x!, 0, 800), y: clamp(cmd.y!, 0, 600) };
    }
    case "rect": {
      if (!isValidCoord(cmd.x, 800) || !isValidCoord(cmd.y, 600)) return null;
      if (typeof cmd.width !== "number" || cmd.width <= 0 || cmd.width > 800) return null;
      if (typeof cmd.height !== "number" || cmd.height <= 0 || cmd.height > 600) return null;
      return { ...cmd, color, x: clamp(cmd.x!, 0, 800), y: clamp(cmd.y!, 0, 600) };
    }
    case "group": {
      if (!Array.isArray(cmd.commands)) return null;
      const nestedCommands = cmd.commands
        .map(validateCommand)
        .filter((c): c is DrawingCommand => c !== null);
      if (nestedCommands.length === 0) return null;
      return { type: "group", commands: nestedCommands };
    }
    default:
      return null;
  }
}

function isValidCoord(val: unknown, max: number): boolean {
  return typeof val === "number" && val >= 0 && val <= max;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function validateColor(color: unknown): string | null {
  if (typeof color !== "string") return null;
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) return color;
  return null;
}

// Generate drawing commands from AI response
async function generateDrawingCommands(
  reply: string,
  ageGroup: "PRIMARY" | "HIGHSCHOOL",
  apiKey: string,
): Promise<DrawingCommand[]> {
  try {
    // Extract the drawing description from the reply
    const drawMatch = reply.match(/\[QUIERO_DIBUJAR\]\s*(.+?)(?:\.|$)/i);
    const drawDescription = drawMatch ? drawMatch[1].trim() : reply;

    const prompt = `${DRAWING_COMMANDS_PROMPT}
    
Edad del estudiante: ${ageGroup === "PRIMARY" ? "Primaria (6-11 años) - usar formas simples y grandes" : "Bachillerato (12-18 años) - puede ser más técnico"}

Descripción del dibujo: ${drawDescription}

Devuelve SOLO el array JSON, sin explicaciones.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 2048,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error("[generateDrawingCommands] AI request failed:", response.status);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("[generateDrawingCommands] No JSON array found in response");
      return [];
    }

    const commands = JSON.parse(jsonMatch[0]);
    return sanitizeDrawingCommands(commands);
  } catch (error) {
    console.error("[generateDrawingCommands] Error:", error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const {
      ageGroup,
      mode = "tema_libre",
      languageMode = "es",
      imageUrl,
      imageBase64,
      userMessage,
      chatHistory,
      studentId,
      studentName,
      studentGrade,
      sessionId,
      remedialAreas,
      remedialObjectives,
      teacherNotes,
      icfesScoresByArea,
      icfesWeakTopics,
      icfesExamDate,
      classroomTaskText,
      classroomSubject,
      sessionMinutesLeft,
    } = body;

    console.log(
      `[socratic-tutor] Student: ${studentId}, Age group: ${ageGroup}, Mode: ${mode}, Session: ${sessionId || "new"}, Has image: ${!!imageBase64}`,
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("[socratic-tutor] LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Check token allowance before proceeding
    const { data: profileData, error: profileError } = await supabase
      .from("student_profiles")
      .select("plan, token_allowance, tokens_used_this_month, token_reset_date")
      .eq("user_id", studentId)
      .maybeSingle();

    if (profileError) {
      console.error("[socratic-tutor] Profile fetch error:", profileError);
    }

    // Check if tokens need to be reset (new month)
    if (profileData) {
      const resetDate = new Date(profileData.token_reset_date);
      const now = new Date();
      const isNewMonth = now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear();

      if (isNewMonth) {
        await supabase
          .from("student_profiles")
          .update({
            tokens_used_this_month: 0,
            token_reset_date: now.toISOString().split("T")[0],
          })
          .eq("user_id", studentId);

        profileData.tokens_used_this_month = 0;
      }

      const isTrialUser = profileData.token_allowance <= 10;
      const limitMessage = isTrialUser
        ? "Has alcanzado tu límite diario de 10 mensajes en la prueba gratis. ¡Actualiza tu plan para seguir aprendiendo!"
        : "Has alcanzado tu límite mensual. ¡Pide a tus padres subir de nivel para seguir aprendiendo!";

      if (profileData.tokens_used_this_month >= profileData.token_allowance) {
        return new Response(
          JSON.stringify({
            error: limitMessage,
            code: "TOKEN_LIMIT_REACHED",
            reply: isTrialUser
              ? "🎓 ¡Has usado tus 10 mensajes de hoy! Vuelve mañana o actualiza tu plan para continuar aprendiendo con Nova."
              : "🎓 ¡Ups! Has usado todos tus tokens de este mes. Pide a tus padres que actualicen tu plan para seguir aprendiendo con Nova.",
            status: "CONFUSED",
            skill: "General",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (isTrialUser) {
        const resetDateCheck = new Date(profileData.token_reset_date);
        const nowCheck = new Date();
        const isNewDay = nowCheck.toDateString() !== resetDateCheck.toDateString();

        if (isNewDay) {
          await supabase
            .from("student_profiles")
            .update({
              tokens_used_this_month: 0,
              token_reset_date: nowCheck.toISOString().split("T")[0],
            })
            .eq("user_id", studentId);

          profileData.tokens_used_this_month = 0;
        }
      }
    }

    // Build dynamic system prompt with context
    const systemPrompt = buildSystemPrompt(ageGroup, mode, languageMode, {
      studentName,
      studentGrade: studentGrade?.toString(),
      remedialAreas: remedialAreas ? (Array.isArray(remedialAreas) ? remedialAreas : [remedialAreas]) : undefined,
      remedialObjectives,
      teacherNotes,
      icfesScoresByArea,
      icfesWeakTopics,
      icfesExamDate,
      classroomTaskText,
      classroomSubject,
      sessionMinutesLeft,
    });

    // Build messages array for AI
    const messages: any[] = [{ role: "system", content: systemPrompt }];

    // Add chat history
    for (const msg of chatHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Build the final user message with optional image (for vision)
    let userContent: any;

    if (imageUrl || imageBase64) {
      const contentParts: any[] = [];

      if (userMessage) {
        contentParts.push({
          type: "text",
          text: userMessage,
        });
      }

      if (imageUrl) {
        contentParts.push({
          type: "image_url",
          image_url: { url: imageUrl },
        });
      } else if (imageBase64) {
        const base64Url = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

        contentParts.push({
          type: "image_url",
          image_url: { url: base64Url },
        });
      }

      contentParts.push({
        type: "text",
        text: "\n\n[El estudiante ha compartido una imagen de su tarea. Analízala y guía con preguntas socráticas.]",
      });

      userContent = contentParts;
    } else {
      userContent = userMessage;
    }

    messages.push({
      role: "user",
      content: userContent,
    });

    console.log(`[socratic-tutor] Sending request to Lovable AI (gemini-2.5-flash) with ${messages.length} messages`);

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[socratic-tutor] AI Gateway error: ${response.status} - ${errorText}`);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Demasiadas solicitudes. Por favor, espera un momento e intenta de nuevo.",
            code: "RATE_LIMITED",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "Se agotaron los créditos de IA. Contacta al administrador.",
            code: "PAYMENT_REQUIRED",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content || "Lo siento, no pude generar una respuesta. ¿Podrías intentar de nuevo?";

    console.log(`[socratic-tutor] AI response received, tokens used: ${data.usage?.total_tokens || "N/A"}`);

    // Determine comprehension status
    const status = determineComprehensionStatus(userMessage, reply, chatHistory);

    // Extract skill topic
    const skill = extractSkillFromContext(userMessage, chatHistory, reply);

    console.log(`[socratic-tutor] Response generated. Status: ${status}, Skill: ${skill}`);

    // Generate message ID for this response
    const messageId = `msg_${crypto.randomUUID()}`;

    // Check if drawing is needed
    const needsDrawing = DRAWING_TRIGGER_REGEX.test(userMessage) || DRAWING_TRIGGER_REGEX.test(reply);
    let drawingCommands: DrawingCommand[] = [];

    if (needsDrawing) {
      console.log(`[socratic-tutor] Drawing detected, generating commands...`);
      drawingCommands = await generateDrawingCommands(reply, ageGroup, LOVABLE_API_KEY);
      console.log(`[socratic-tutor] Generated ${drawingCommands.length} drawing commands`);

      // Persist drawing commands to database
      if (drawingCommands.length > 0 && sessionId) {
        const { error: drawingError } = await supabase
          .from("tutor_drawings")
          .insert({
            session_id: sessionId,
            message_id: messageId,
            commands: drawingCommands,
          });

        if (drawingError) {
          console.error("[socratic-tutor] Failed to save drawing:", drawingError);
        } else {
          console.log(`[socratic-tutor] Drawing saved for message ${messageId}`);
        }
      }
    }

    // Build whiteboard events (legacy format for backward compatibility)
    const boardText = buildBoardTextFromReply(reply, skill, ageGroup);
    const whiteboardEvents = boardText
      ? [
          {
            id: crypto.randomUUID(),
            type: "clear" as const,
          },
          {
            id: crypto.randomUUID(),
            type: "draw_text" as const,
            text: boardText,
            x: 10,
            y: 10,
            color: "#8B5CF6",
          },
        ]
      : [];

    console.log(`[socratic-tutor] Whiteboard events generated: ${whiteboardEvents.length} events`);

    // Create or update session in database
    let currentSessionId = sessionId;

    const newMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    const newAssistantMessage = {
      role: "assistant",
      content: reply,
      status,
      skill,
      messageId,
      timestamp: new Date().toISOString(),
    };

    if (!currentSessionId) {
      const { data: sessionData, error: sessionError } = await supabase
        .from("tutor_sessions")
        .insert({
          student_id: studentId,
          student_name: studentName || studentId,
          age_group: ageGroup,
          messages: [newMessage, newAssistantMessage],
          status_timeline: [{ status, timestamp: new Date().toISOString(), skill }],
          skill,
          is_active: true,
        })
        .select("id")
        .single();

      if (sessionError) {
        console.error("[socratic-tutor] Session creation error:", sessionError);
      } else {
        currentSessionId = sessionData.id;
        console.log(`[socratic-tutor] Created new session: ${currentSessionId}`);

        // Save drawing with new session ID
        if (drawingCommands.length > 0) {
          const { error: drawingError } = await supabase
            .from("tutor_drawings")
            .insert({
              session_id: currentSessionId,
              message_id: messageId,
              commands: drawingCommands,
            });

          if (drawingError) {
            console.error("[socratic-tutor] Failed to save drawing:", drawingError);
          }
        }
      }
    } else {
      const { data: existingSession } = await supabase
        .from("tutor_sessions")
        .select("messages, status_timeline")
        .eq("id", currentSessionId)
        .maybeSingle();

      if (existingSession) {
        const updatedMessages = [...(existingSession.messages || []), newMessage, newAssistantMessage];
        const updatedTimeline = [
          ...(existingSession.status_timeline || []),
          { status, timestamp: new Date().toISOString(), skill },
        ];

        const { error: updateError } = await supabase
          .from("tutor_sessions")
          .update({
            messages: updatedMessages,
            status_timeline: updatedTimeline,
            skill,
          })
          .eq("id", currentSessionId);

        if (updateError) {
          console.error("[socratic-tutor] Session update error:", updateError);
        }
      }
    }

    // Deduct token from allowance
    if (profileData) {
      const { error: tokenError } = await supabase
        .from("student_profiles")
        .update({
          tokens_used_this_month: profileData.tokens_used_this_month + 1,
        })
        .eq("user_id", studentId);

      if (tokenError) {
        console.error("[socratic-tutor] Token update error:", tokenError);
      } else {
        console.log(
          `[socratic-tutor] Token deducted. New usage: ${profileData.tokens_used_this_month + 1}/${profileData.token_allowance}`,
        );
      }
    }

    // Return response with drawing commands
    return new Response(
      JSON.stringify({
        reply,
        status,
        skill,
        sessionId: currentSessionId,
        messageId,
        whiteboardEvents,
        drawingCommands: drawingCommands.length > 0 ? drawingCommands : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[socratic-tutor] Error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Error desconocido",
        reply: "¡Ups! Algo salió mal. ¿Podrías intentar de nuevo? 🙏",
        status: "CONFUSED",
        skill: "General",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
