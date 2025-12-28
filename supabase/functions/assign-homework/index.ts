import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentProgramId, weekNumber, sessionSummary } = await req.json();
    
    if (!studentProgramId || !weekNumber) {
      return new Response(
        JSON.stringify({ error: 'studentProgramId and weekNumber are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the program with week info
    const { data: program, error: programError } = await supabase
      .from('student_remedial_programs')
      .select(`
        *,
        remedial_programs (name, subject)
      `)
      .eq('id', studentProgramId)
      .single();

    if (programError || !program) {
      return new Response(
        JSON.stringify({ error: 'Program not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch week info
    const { data: weekData } = await supabase
      .from('remedial_program_weeks')
      .select('topic, objectives')
      .eq('student_program_id', studentProgramId)
      .eq('week_number', weekNumber)
      .maybeSingle();

    // Fetch student profile for grade level
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('grade_level')
      .eq('user_id', program.student_id)
      .maybeSingle();

    const subject = program.subject || program.remedial_programs?.subject || 'General';
    const weekTopic = weekData?.topic || '';
    const weekObjectives = weekData?.objectives || '';
    const gradeLevel = profile?.grade_level || 'No especificado';

    console.log(`Generating homework for program ${studentProgramId}, week ${weekNumber}`);

    // Create the AI prompt for homework generation
    const systemPrompt = `Eres un profesor experto creando tareas para estudiantes.
Tu tarea es generar una tarea práctica y concreta que el estudiante debe completar y subir una foto como evidencia.

La tarea debe:
1. Estar alineada con los objetivos de la semana
2. Ser específica y clara (el estudiante debe saber exactamente qué hacer)
3. Incluir 3-5 ejercicios o problemas
4. Ser apropiada para el nivel del estudiante
5. Poder ser completada en papel y fotografiada

Responde SOLO con un JSON válido:
{
  "description": "Descripción completa de la tarea con instrucciones claras y los ejercicios numerados",
  "exercises_count": 4
}`;

    const userPrompt = `Crea una tarea para:

Materia: ${subject}
Grado: ${gradeLevel}
Tema de la semana: ${weekTopic}
Objetivos de la semana: ${weekObjectives}
${sessionSummary ? `Resumen de la sesión de tutoría:\n${sessionSummary}` : ''}

Genera una tarea con ejercicios prácticos que el estudiante pueda resolver en papel y subir una foto.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Error generating homework' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const generatedText = aiData.choices?.[0]?.message?.content;

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: 'No homework generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let homeworkData;
    try {
      const cleanedText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      homeworkData = JSON.parse(cleanedText);
    } catch (parseError) {
      // If parsing fails, use the raw text as description
      homeworkData = {
        description: generatedText,
        exercises_count: 4
      };
    }

    // Calculate due date (2 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);

    // Insert the homework task
    const { data: newTask, error: insertError } = await supabase
      .from('homework_tasks')
      .insert({
        student_program_id: studentProgramId,
        student_id: program.student_id,
        week_number: weekNumber,
        description: homeworkData.description,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting homework:', insertError);
      return new Response(
        JSON.stringify({ error: 'Error saving homework' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Homework task created: ${newTask.id}`);

    return new Response(
      JSON.stringify({ success: true, task: newTask }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in assign-homework:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
