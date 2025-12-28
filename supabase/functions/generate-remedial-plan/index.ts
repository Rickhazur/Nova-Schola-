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
    const { studentProgramId } = await req.json();
    
    if (!studentProgramId) {
      return new Response(
        JSON.stringify({ error: 'studentProgramId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the student remedial program with template info
    const { data: program, error: programError } = await supabase
      .from('student_remedial_programs')
      .select(`
        *,
        remedial_programs (name, subject, level, description)
      `)
      .eq('id', studentProgramId)
      .single();

    if (programError || !program) {
      console.error('Error fetching program:', programError);
      return new Response(
        JSON.stringify({ error: 'Program not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch student profile
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', program.student_id)
      .maybeSingle();

    const subject = program.subject || program.remedial_programs?.subject || 'General';
    const level = program.remedial_programs?.level || (profile?.grade_level ? 
      (profile.grade_level <= 5 ? 'Primaria' : 'Secundaria') : 'General');
    const programName = program.custom_title || program.remedial_programs?.name || 'Programa de Refuerzo';
    const programGoals = program.goals || '';

    console.log(`Generating 4-week plan for: ${programName} - ${subject} - ${level}`);

    // Create the AI prompt for generating 4 weeks
    const systemPrompt = `Eres un experto en pedagogía y currículo educativo colombiano e internacional. 
Tu tarea es crear un plan de refuerzo estructurado de 4 semanas para un estudiante.

El plan debe:
1. Estar alineado con el currículo colombiano y estándares internacionales
2. Ser progresivo: de conceptos básicos a más avanzados
3. Incluir objetivos claros y medibles para cada semana
4. Ser práctico con ejercicios y actividades concretas

Responde SOLO con un JSON válido sin explicaciones adicionales:
{
  "weeks": [
    {
      "week_number": 1,
      "topic": "Tema de la semana",
      "objectives": "Objetivos específicos de la semana (2-3 oraciones)"
    },
    {
      "week_number": 2,
      "topic": "...",
      "objectives": "..."
    },
    {
      "week_number": 3,
      "topic": "...",
      "objectives": "..."
    },
    {
      "week_number": 4,
      "topic": "...",
      "objectives": "..."
    }
  ]
}`;

    const userPrompt = `Crea un plan de refuerzo de 4 semanas para:

Programa: ${programName}
Materia: ${subject}
Nivel: ${level}
Grado del estudiante: ${profile?.grade_level || 'No especificado'}
${programGoals ? `Objetivos del programa: ${programGoals}` : ''}

El plan debe progresar desde los conceptos más fundamentales hasta aplicaciones más complejas, 
considerando el currículo colombiano y estándares internacionales para esta materia y nivel.`;

    console.log('Calling Lovable AI Gateway for remedial plan generation...');

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
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Error generating plan with AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const generatedText = aiData.choices?.[0]?.message?.content;

    if (!generatedText) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'No plan generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let planData;
    try {
      const cleanedText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      planData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, generatedText);
      return new Response(
        JSON.stringify({ error: 'Error parsing AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert the weeks into remedial_program_weeks
    const weeksToInsert = (planData.weeks || []).map((week: any) => ({
      student_program_id: studentProgramId,
      week_number: week.week_number,
      topic: week.topic,
      objectives: week.objectives,
      status: week.week_number === 1 ? 'in_progress' : 'pending'
    }));

    const { data: insertedWeeks, error: insertError } = await supabase
      .from('remedial_program_weeks')
      .insert(weeksToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting weeks:', insertError);
      return new Response(
        JSON.stringify({ error: 'Error saving plan weeks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the program with the generated plan and subject
    await supabase
      .from('student_remedial_programs')
      .update({ 
        generated_plan: planData,
        subject: subject,
        current_week: 1
      })
      .eq('id', studentProgramId);

    console.log(`Successfully created ${insertedWeeks.length} weeks for program ${studentProgramId}`);

    return new Response(
      JSON.stringify({ success: true, weeks: insertedWeeks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-remedial-plan:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
