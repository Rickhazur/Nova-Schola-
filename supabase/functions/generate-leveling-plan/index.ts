import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentId, subject } = await req.json();
    
    if (!studentId || !subject) {
      return new Response(
        JSON.stringify({ error: 'studentId and subject are required' }),
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

    // Fetch student profile
    const { data: profile, error: profileError } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', studentId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching student profile:', profileError);
    }

    // Fetch recent tutor sessions for this student
    const { data: sessions, error: sessionsError } = await supabase
      .from('tutor_sessions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (sessionsError) {
      console.error('Error fetching tutor sessions:', sessionsError);
    }

    // Analyze session data to understand student's weak areas
    const sessionAnalysis = (sessions || []).map(session => {
      const messages = session.messages as any[];
      const statusTimeline = session.status_timeline as any[];
      
      // Get topics from messages
      const topics = messages
        ?.filter((m: any) => m.role === 'user')
        ?.map((m: any) => m.content?.substring(0, 100))
        ?.slice(0, 5) || [];
      
      // Get understanding status
      const latestStatus = statusTimeline?.[statusTimeline.length - 1]?.status || 'UNKNOWN';
      
      return {
        skill: session.skill || 'general',
        status: latestStatus,
        topics: topics,
        date: session.created_at
      };
    });

    // Create the AI prompt
    const systemPrompt = `Eres un experto en pedagogía y planificación educativa. Tu tarea es crear un plan de nivelación personalizado para un estudiante.

El plan debe ser práctico, motivador y adaptado al nivel del estudiante. Responde SOLO con un JSON válido sin explicaciones adicionales.

El JSON debe tener esta estructura exacta:
{
  "topic": "Tema principal del plan",
  "goals": "Objetivos claros del plan de 4 semanas",
  "difficulty_level": 3,
  "total_sessions": 16,
  "weekly_plan": [
    {
      "week": 1,
      "focus": "Enfoque de la semana",
      "topics": ["Tema 1", "Tema 2"],
      "sessions": 4,
      "activities": ["Actividad 1", "Actividad 2"]
    }
  ],
  "recommended_sessions": [
    {
      "topic": "Tema de la sesión",
      "estimated_minutes": 30,
      "difficulty": "básico|intermedio|avanzado",
      "week": 1
    }
  ]
}`;

    const userPrompt = `Crea un plan de nivelación de 4 semanas para un estudiante de ${subject}.

Información del estudiante:
- Grado: ${profile?.grade_level || 'No especificado'}
- Edad: ${profile?.age || 'No especificada'}
- Idioma preferido: ${profile?.preferred_language === 'en' ? 'Inglés' : 'Español'}

Sesiones recientes del tutor (análisis de comprensión):
${sessionAnalysis.length > 0 
  ? sessionAnalysis.map(s => `- ${s.skill}: ${s.status}`).join('\n')
  : '- Sin sesiones previas registradas'
}

Por favor genera un plan estructurado que:
1. Comience con los conceptos más básicos si el estudiante muestra dificultades
2. Incluya 4 sesiones por semana (16 en total)
3. Progrese gradualmente en dificultad
4. Se enfoque en ${subject} con ejemplos prácticos`;

    console.log('Calling Lovable AI Gateway for leveling plan generation...');

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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de solicitudes excedido. Intenta de nuevo en unos minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Se requiere agregar créditos a la cuenta de Lovable AI.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Error al generar el plan con IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const generatedText = aiData.choices?.[0]?.message?.content;

    if (!generatedText) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'No se pudo generar el plan' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI Response received, parsing...');

    // Parse the JSON response
    let planData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      planData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, generatedText);
      return new Response(
        JSON.stringify({ error: 'Error al procesar la respuesta de IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate end date (4 weeks from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 28);

    // Mark any existing active plans for this subject as completed
    await supabase
      .from('leveling_plans')
      .update({ status: 'COMPLETED' })
      .eq('student_id', studentId)
      .eq('subject', subject)
      .eq('status', 'ACTIVE');

    // Insert the new leveling plan
    const { data: newPlan, error: insertError } = await supabase
      .from('leveling_plans')
      .insert({
        student_id: studentId,
        subject: subject,
        topic: planData.topic || `Plan de ${subject}`,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'ACTIVE',
        difficulty_level: planData.difficulty_level || 3,
        goals: planData.goals || '',
        recommended_sessions: planData.recommended_sessions || [],
        weekly_plan: planData.weekly_plan || [],
        total_sessions: planData.total_sessions || 16,
        completed_sessions: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting leveling plan:', insertError);
      return new Response(
        JSON.stringify({ error: 'Error al guardar el plan' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Leveling plan created successfully:', newPlan.id);

    return new Response(
      JSON.stringify({ success: true, plan: newPlan }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-leveling-plan:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
