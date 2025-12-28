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
    const { studentId } = await req.json();
    
    if (!studentId) {
      return new Response(
        JSON.stringify({ error: 'studentId is required' }),
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

    // Calculate week boundaries
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    console.log(`Generating summary for student ${studentId} for week ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);

    // Fetch student profile
    const { data: profile, error: profileError } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', studentId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    const studentName = profile?.full_name?.split(' ')[0] || 'el estudiante';
    const guardianName = profile?.guardian_name || 'Estimado acudiente';

    // Fetch this week's tutor sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('tutor_sessions')
      .select('*')
      .eq('student_id', studentId)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString())
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
    }

    // Analyze sessions
    const sessionSummaries = (sessions || []).map(session => {
      const statusTimeline = session.status_timeline as any[];
      const latestStatus = statusTimeline?.[statusTimeline.length - 1]?.status || 'UNKNOWN';
      
      return {
        skill: session.skill || 'general',
        status: latestStatus,
        ageGroup: session.age_group,
        date: session.created_at
      };
    });

    // Fetch active leveling plan
    const { data: levelingPlan, error: planError } = await supabase
      .from('leveling_plans')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (planError) {
      console.error('Error fetching leveling plan:', planError);
    }

    // Build context for AI
    const sessionContext = sessionSummaries.length > 0
      ? sessionSummaries.map(s => `- ${s.skill}: ${s.status === 'UNDERSTOOD' ? 'Dominado' : s.status === 'PARTIAL' ? 'Parcialmente dominado' : s.status === 'CONFUSED' ? 'Necesita refuerzo' : 'En progreso'}`).join('\n')
      : '- No hubo sesiones de tutoría esta semana';

    const planContext = levelingPlan
      ? `Plan activo: ${levelingPlan.topic} (${levelingPlan.subject})
         Progreso: ${levelingPlan.completed_sessions}/${levelingPlan.total_sessions} sesiones completadas
         Nivel de dificultad: ${levelingPlan.difficulty_level}/5`
      : 'No hay plan de nivelación activo';

    // Generate summary with AI
    const systemPrompt = `Eres un asistente educativo que genera resúmenes semanales concisos para los acudientes (padres/tutores) de estudiantes.

Genera un mensaje de WhatsApp corto, amigable y profesional en español que:
1. Salude al acudiente
2. Resuma el progreso de la semana
3. Mencione áreas de fortaleza y mejora
4. Sugiera próximos pasos
5. Sea positivo y motivador

El mensaje debe ser de máximo 300 palabras y usar emojis apropiados para WhatsApp.
No uses formato markdown, solo texto plano con emojis.`;

    const userPrompt = `Genera un resumen semanal de WhatsApp para el acudiente de ${studentName}.

Información del estudiante:
- Nombre: ${studentName}
- Grado: ${profile?.grade_level || 'No especificado'}
- Nombre del acudiente: ${guardianName}

Sesiones de tutoría esta semana (${sessions?.length || 0} sesiones):
${sessionContext}

Estado del plan de nivelación:
${planContext}

Por favor genera un mensaje conciso y motivador para WhatsApp.`;

    console.log('Calling Lovable AI Gateway for summary generation...');

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
          JSON.stringify({ error: 'Se requiere agregar créditos a la cuenta.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Error al generar el resumen con IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const summaryText = aiData.choices?.[0]?.message?.content;

    if (!summaryText) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'No se pudo generar el resumen' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Summary generated successfully');

    // Save the report
    const { data: report, error: insertError } = await supabase
      .from('guardian_reports')
      .insert({
        student_id: studentId,
        week_start: weekStart.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0],
        summary_text: summaryText,
        status: 'generated'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving report:', insertError);
      // Still return the summary even if save fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary: summaryText,
        report: report,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        guardianWhatsapp: profile?.guardian_whatsapp || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-whatsapp-summary:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
