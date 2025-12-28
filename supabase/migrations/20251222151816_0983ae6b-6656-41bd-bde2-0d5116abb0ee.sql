-- Create icfes_questions table for storing ICFES-style questions
CREATE TABLE public.icfes_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  area TEXT NOT NULL CHECK (area IN ('matematicas', 'lectura_critica', 'ciencias', 'sociales', 'ingles')),
  competencia TEXT,
  enunciado TEXT NOT NULL,
  imagen_url TEXT,
  opcion_a TEXT NOT NULL,
  opcion_b TEXT NOT NULL,
  opcion_c TEXT NOT NULL,
  opcion_d TEXT NOT NULL,
  respuesta_correcta TEXT NOT NULL CHECK (respuesta_correcta IN ('A', 'B', 'C', 'D')),
  explicacion TEXT,
  dificultad INTEGER NOT NULL DEFAULT 2 CHECK (dificultad BETWEEN 1 AND 5),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create icfes_attempts table for tracking training/simulation sessions
CREATE TABLE public.icfes_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('full', 'practica', 'area')),
  areas TEXT[] NOT NULL,
  total_questions INTEGER NOT NULL,
  time_limit_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  score_global INTEGER,
  scores_by_area JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create icfes_answers table for individual question responses
CREATE TABLE public.icfes_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.icfes_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.icfes_questions(id),
  student_id UUID NOT NULL,
  respuesta TEXT CHECK (respuesta IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN,
  time_spent_seconds INTEGER,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create icfes_stats table for aggregated student statistics
CREATE TABLE public.icfes_stats (
  student_id UUID NOT NULL PRIMARY KEY,
  total_questions_answered INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  avg_score_global NUMERIC(5,2),
  score_matematicas NUMERIC(5,2),
  score_lectura_critica NUMERIC(5,2),
  score_ciencias NUMERIC(5,2),
  score_sociales NUMERIC(5,2),
  score_ingles NUMERIC(5,2),
  weakest_area TEXT,
  strongest_area TEXT,
  total_time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.icfes_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icfes_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icfes_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icfes_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for icfes_questions (read-only for authenticated users, admin manages)
CREATE POLICY "Anyone can view active questions"
ON public.icfes_questions FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage questions"
ON public.icfes_questions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for icfes_attempts
CREATE POLICY "Students can view their own attempts"
ON public.icfes_attempts FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own attempts"
ON public.icfes_attempts FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own attempts"
ON public.icfes_attempts FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage all attempts"
ON public.icfes_attempts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for icfes_answers
CREATE POLICY "Students can view their own answers"
ON public.icfes_answers FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own answers"
ON public.icfes_answers FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own answers"
ON public.icfes_answers FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage all answers"
ON public.icfes_answers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for icfes_stats
CREATE POLICY "Students can view their own stats"
ON public.icfes_stats FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own stats"
ON public.icfes_stats FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own stats"
ON public.icfes_stats FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage all stats"
ON public.icfes_stats FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_icfes_questions_area ON public.icfes_questions(area);
CREATE INDEX idx_icfes_attempts_student ON public.icfes_attempts(student_id);
CREATE INDEX idx_icfes_answers_attempt ON public.icfes_answers(attempt_id);
CREATE INDEX idx_icfes_answers_student ON public.icfes_answers(student_id);
CREATE INDEX idx_icfes_answers_question ON public.icfes_answers(question_id);

-- Trigger for updated_at
CREATE TRIGGER update_icfes_questions_updated_at
BEFORE UPDATE ON public.icfes_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_icfes_attempts_updated_at
BEFORE UPDATE ON public.icfes_attempts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_icfes_stats_updated_at
BEFORE UPDATE ON public.icfes_stats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample questions for each area
INSERT INTO public.icfes_questions (area, competencia, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion, dificultad) VALUES
('matematicas', 'Razonamiento cuantitativo', 'Si un número es divisible por 6, ¿cuáles de las siguientes afirmaciones son siempre verdaderas?
I. Es divisible por 2
II. Es divisible por 3
III. Es divisible por 12', 'Solo I', 'Solo II', 'I y II', 'I, II y III', 'C', 'Un número divisible por 6 es siempre divisible por 2 y por 3, ya que 6 = 2 × 3. Sin embargo, no siempre es divisible por 12 (por ejemplo, 6 no es divisible por 12).', 2),
('matematicas', 'Álgebra', 'Si 3x + 5 = 20, ¿cuál es el valor de 2x + 3?', '13', '11', '10', '15', 'A', 'Despejando: 3x = 15, entonces x = 5. Sustituyendo: 2(5) + 3 = 13.', 1),
('matematicas', 'Geometría', 'Un triángulo tiene lados de 3, 4 y 5 centímetros. ¿Qué tipo de triángulo es?', 'Equilátero', 'Isósceles', 'Escaleno y rectángulo', 'Obtusángulo', 'C', 'Los lados 3, 4, 5 cumplen el teorema de Pitágoras (9+16=25), formando un triángulo rectángulo. Como todos los lados son diferentes, también es escaleno.', 2),
('lectura_critica', 'Comprensión literal', 'Texto: "El cambio climático representa uno de los mayores desafíos del siglo XXI. Los científicos advierten que las temperaturas globales podrían aumentar hasta 4°C para 2100 si no se toman medidas drásticas."

Según el texto, ¿qué podría suceder si no se toman medidas?', 'Las temperaturas bajarán', 'Las temperaturas aumentarán hasta 4°C', 'No habrá ningún cambio', 'Los científicos no están preocupados', 'B', 'El texto indica explícitamente que sin medidas drásticas, las temperaturas podrían aumentar hasta 4°C para 2100.', 1),
('lectura_critica', 'Inferencia', 'Texto: "María miró por la ventana y vio las hojas de los árboles cambiar de color. Suspiró mientras guardaba su ropa de verano en el armario."

¿Qué estación del año se aproxima según el texto?', 'Primavera', 'Verano', 'Otoño', 'Invierno', 'C', 'Las pistas contextuales (hojas cambiando de color, guardar ropa de verano) indican que se acerca el otoño.', 2),
('ciencias', 'Biología', '¿Cuál es la función principal de los ribosomas en una célula?', 'Producir energía', 'Sintetizar proteínas', 'Almacenar información genética', 'Controlar el paso de sustancias', 'B', 'Los ribosomas son los orgánulos encargados de sintetizar proteínas siguiendo las instrucciones del ARN mensajero.', 2),
('ciencias', 'Física', 'Un objeto cae libremente desde una altura de 20 metros. Ignorando la resistencia del aire, ¿aproximadamente cuánto tiempo tardará en llegar al suelo? (g = 10 m/s²)', '1 segundo', '2 segundos', '3 segundos', '4 segundos', 'B', 'Usando h = ½gt², tenemos 20 = ½(10)t², entonces t² = 4, por lo tanto t = 2 segundos.', 3),
('sociales', 'Competencias ciudadanas', '¿Cuál de las siguientes acciones representa un ejercicio de participación ciudadana?', 'Ver noticias en televisión', 'Votar en las elecciones presidenciales', 'Leer el periódico', 'Comentar en redes sociales', 'B', 'Votar en elecciones es una forma directa y constitucional de participación ciudadana en la democracia.', 1),
('sociales', 'Historia', '¿En qué año se firmó la actual Constitución Política de Colombia?', '1886', '1991', '1810', '1948', 'B', 'La Constitución Política de Colombia vigente fue promulgada el 4 de julio de 1991.', 2),
('ingles', 'Reading comprehension', 'Read the following sentence: "Despite the heavy rain, the match continued without interruption."

What does "despite" mean in this context?', 'Because of', 'In addition to', 'Even though', 'Before', 'C', '"Despite" expresses contrast, meaning something happened even though there was an obstacle (the rain).', 2),
('ingles', 'Grammar', 'Choose the correct sentence:', 'She don''t like coffee', 'She doesn''t likes coffee', 'She doesn''t like coffee', 'She not like coffee', 'C', 'The correct form uses "doesn''t" (does not) with the base form of the verb "like" for third person singular.', 1);