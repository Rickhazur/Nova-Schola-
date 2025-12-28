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
    const { homeworkTaskId, imageBase64 } = await req.json();
    
    if (!homeworkTaskId) {
      return new Response(
        JSON.stringify({ error: 'homeworkTaskId is required' }),
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

    // Fetch the homework task with program week info
    const { data: task, error: taskError } = await supabase
      .from('homework_tasks')
      .select(`
        *,
        student_remedial_programs (
          id, subject, custom_title,
          remedial_programs (name, subject)
        )
      `)
      .eq('id', homeworkTaskId)
      .single();

    if (taskError || !task) {
      console.error('Error fetching task:', taskError);
      return new Response(
        JSON.stringify({ error: 'Homework task not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the week objectives
    const { data: weekData } = await supabase
      .from('remedial_program_weeks')
      .select('topic, objectives')
      .eq('student_program_id', task.student_program_id)
      .eq('week_number', task.week_number)
      .maybeSingle();

    const subject = task.student_remedial_programs?.subject || 
                   task.student_remedial_programs?.remedial_programs?.subject || 
                   'General';
    const weekTopic = weekData?.topic || '';
    const weekObjectives = weekData?.objectives || '';
    const taskDescription = task.description;

    console.log(`Evaluating homework for task ${homeworkTaskId}, subject: ${subject}`);

    // Create the AI prompt for evaluation
    const systemPrompt = `Eres un profesor experto evaluando la tarea de un estudiante.
Tu tarea es analizar el trabajo del estudiante y proporcionar:
1. Una puntuación del 0 al 100
2. Retroalimentación constructiva y específica en español
3. Consejos para mejorar si la puntuación es menor a 90

Sé justo pero exigente. Una puntuación de 90+ significa que el estudiante demostró dominio del tema.
Puntuaciones menores a 90 requieren que el estudiante mejore y vuelva a intentar.

Responde SOLO con un JSON válido:
{
  "score": 85,
  "feedback": "Retroalimentación detallada sobre el trabajo del estudiante...",
  "tips": ["Tip 1 para mejorar", "Tip 2 para mejorar"],
  "approved": false
}`;

    const userPrompt = `Evalúa esta tarea:

Materia: ${subject}
Tema de la semana: ${weekTopic}
Objetivos de la semana: ${weekObjectives}

Descripción de la tarea asignada:
${taskDescription}

${imageBase64 ? 'El estudiante ha subido una imagen de su trabajo. Analiza la imagen considerando:' +
  '\n- Claridad y organización del trabajo' +
  '\n- Corrección de los ejercicios/respuestas' +
  '\n- Demostración de comprensión del tema' +
  '\n- Esfuerzo y completitud' : 'El estudiante ha indicado que completó la tarea.'}

Proporciona una evaluación justa y constructiva.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    if (imageBase64) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          { type: 'image_url', image_url: { url: imageBase64 } }
        ]
      });
    } else {
      messages.push({ role: 'user', content: userPrompt });
    }

    console.log('Calling Lovable AI Gateway for homework evaluation...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Error evaluating with AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const generatedText = aiData.choices?.[0]?.message?.content;

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: 'No evaluation generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let evalData;
    try {
      const cleanedText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      evalData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, generatedText);
      // Default to a passing grade if parsing fails
      evalData = {
        score: 75,
        feedback: generatedText,
        tips: [],
        approved: false
      };
    }

    const score = evalData.score || 0;
    const approved = score >= 90;
    const feedback = evalData.feedback || '';
    const tips = evalData.tips || [];

    // Update the homework task
    const newStatus = approved ? 'approved' : 'redo_required';
    const { error: updateError } = await supabase
      .from('homework_tasks')
      .update({
        last_score: score,
        status: newStatus,
        feedback: `${feedback}\n\n${tips.length > 0 ? 'Consejos:\n' + tips.map((t: string) => `• ${t}`).join('\n') : ''}`
      })
      .eq('id', homeworkTaskId);

    if (updateError) {
      console.error('Error updating task:', updateError);
    }

    // If approved and this is the last task for the week, mark week as completed
    if (approved) {
      const { data: pendingTasks } = await supabase
        .from('homework_tasks')
        .select('id')
        .eq('student_program_id', task.student_program_id)
        .eq('week_number', task.week_number)
        .in('status', ['pending', 'submitted', 'redo_required']);

      if (!pendingTasks || pendingTasks.length === 0) {
        // All tasks for this week are approved, mark week as completed
        await supabase
          .from('remedial_program_weeks')
          .update({ status: 'completed' })
          .eq('student_program_id', task.student_program_id)
          .eq('week_number', task.week_number);

        // Check if all weeks are completed
        const { data: pendingWeeks } = await supabase
          .from('remedial_program_weeks')
          .select('id')
          .eq('student_program_id', task.student_program_id)
          .neq('status', 'completed');

        if (!pendingWeeks || pendingWeeks.length === 0) {
          // All weeks completed, mark program as completed
          await supabase
            .from('student_remedial_programs')
            .update({ status: 'completed' })
            .eq('id', task.student_program_id);
        } else {
          // Move to next week
          const nextWeek = task.week_number + 1;
          await supabase
            .from('student_remedial_programs')
            .update({ current_week: nextWeek })
            .eq('id', task.student_program_id);
          
          await supabase
            .from('remedial_program_weeks')
            .update({ status: 'in_progress' })
            .eq('student_program_id', task.student_program_id)
            .eq('week_number', nextWeek);
        }
      }
    }

    console.log(`Evaluation complete: score=${score}, status=${newStatus}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        score, 
        approved, 
        feedback,
        tips,
        status: newStatus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in evaluate-homework:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
