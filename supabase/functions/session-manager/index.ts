import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EndSessionRequest {
  sessionId: string;
}

interface GetSessionsRequest {
  limit?: number;
  offset?: number;
  ageGroup?: "PRIMARY" | "HIGHSCHOOL";
  status?: "UNDERSTOOD" | "PARTIAL" | "CONFUSED";
}

function computeOverallStatus(
  statusTimeline: Array<{ status: string; timestamp: string }>
): "UNDERSTOOD" | "PARTIAL" | "CONFUSED" {
  if (!statusTimeline || statusTimeline.length === 0) {
    return "PARTIAL";
  }

  const counts = {
    UNDERSTOOD: 0,
    PARTIAL: 0,
    CONFUSED: 0
  };

  for (const entry of statusTimeline) {
    if (entry.status in counts) {
      counts[entry.status as keyof typeof counts]++;
    }
  }

  const total = counts.UNDERSTOOD + counts.PARTIAL + counts.CONFUSED;
  
  // If mostly understood (>50%), mark as understood
  if (counts.UNDERSTOOD > total / 2) {
    return "UNDERSTOOD";
  }
  
  // If mostly confused (>50%), mark as confused
  if (counts.CONFUSED > total / 2) {
    return "CONFUSED";
  }
  
  // Otherwise partial
  return "PARTIAL";
}

async function generateSessionNotes(
  supabase: any,
  session: any,
  apiKey: string
): Promise<string> {
  const messages = session.messages || [];
  const skill = session.skill || "General";
  const overallStatus = computeOverallStatus(session.status_timeline);
  
  // Build a summary of the conversation
  const conversationSummary = messages
    .map((m: any) => `${m.role === 'user' ? 'Estudiante' : 'Tutor'}: ${m.content.substring(0, 200)}`)
    .join('\n');

  const prompt = `Eres un asistente educativo. Genera un resumen breve (2-3 oraciones) de esta sesión de tutoría en español.

Información de la sesión:
- Tema: ${skill}
- Estado general: ${overallStatus === 'UNDERSTOOD' ? 'El estudiante comprendió' : overallStatus === 'CONFUSED' ? 'El estudiante tuvo dificultades' : 'Comprensión parcial'}
- Grupo de edad: ${session.age_group === 'PRIMARY' ? 'Primaria' : 'Secundaria/Bachillerato'}

Conversación (resumen):
${conversationSummary.substring(0, 1500)}

Genera un resumen profesional que incluya:
1. Qué tema se trabajó
2. Cómo fue el progreso del estudiante
3. Una recomendación breve para seguir aprendiendo

Responde SOLO con el resumen, sin introducción ni explicación adicional.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      console.error('[session-manager] Notes generation failed:', await response.text());
      return `Sesión de ${skill}. Estado: ${overallStatus === 'UNDERSTOOD' ? 'Comprendido' : overallStatus === 'CONFUSED' ? 'Necesita refuerzo' : 'Parcialmente comprendido'}.`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || `Sesión de ${skill}. Requiere seguimiento.`;
  } catch (error) {
    console.error('[session-manager] Notes generation error:', error);
    return `Sesión de ${skill}. Estado: ${overallStatus === 'UNDERSTOOD' ? 'Comprendido' : overallStatus === 'CONFUSED' ? 'Necesita refuerzo' : 'Parcialmente comprendido'}.`;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // GET sessions list (for admin)
    if (req.method === 'GET' && action === 'list') {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const ageGroup = url.searchParams.get('ageGroup');
      const status = url.searchParams.get('status');
      const active = url.searchParams.get('active');

      let query = supabase
        .from('tutor_sessions')
        .select('*', { count: 'exact' })
        .order('timestamp_start', { ascending: false })
        .range(offset, offset + limit - 1);

      if (ageGroup) {
        query = query.eq('age_group', ageGroup);
      }
      if (status) {
        query = query.eq('overall_status', status);
      }
      if (active !== null) {
        query = query.eq('is_active', active === 'true');
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      // Calculate stats
      const { data: allSessions } = await supabase
        .from('tutor_sessions')
        .select('overall_status, is_active');

      const stats = {
        total: allSessions?.length || 0,
        active: allSessions?.filter((s: any) => s.is_active).length || 0,
        understood: allSessions?.filter((s: any) => s.overall_status === 'UNDERSTOOD').length || 0,
        partial: allSessions?.filter((s: any) => s.overall_status === 'PARTIAL').length || 0,
        confused: allSessions?.filter((s: any) => s.overall_status === 'CONFUSED').length || 0,
      };

      return new Response(
        JSON.stringify({ sessions: data, count, stats }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET single session details
    if (req.method === 'GET' && action === 'get') {
      const sessionId = url.searchParams.get('sessionId');
      
      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: 'sessionId is required' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from('tutor_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ session: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST - End session
    if (req.method === 'POST') {
      const body: EndSessionRequest = await req.json();
      const { sessionId } = body;

      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: 'sessionId is required' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[session-manager] Ending session: ${sessionId}`);

      // Get session data
      const { data: session, error: fetchError } = await supabase
        .from('tutor_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (fetchError || !session) {
        return new Response(
          JSON.stringify({ error: 'Session not found' }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Compute overall status
      const overallStatus = computeOverallStatus(session.status_timeline);

      // Generate notes
      const notes = await generateSessionNotes(supabase, session, LOVABLE_API_KEY!);

      // Update session
      const { error: updateError } = await supabase
        .from('tutor_sessions')
        .update({
          is_active: false,
          timestamp_end: new Date().toISOString(),
          overall_status: overallStatus,
          notes
        })
        .eq('id', sessionId);

      if (updateError) {
        throw updateError;
      }

      console.log(`[session-manager] Session ${sessionId} ended. Status: ${overallStatus}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          overallStatus, 
          notes 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request method or action' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[session-manager] Error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Error desconocido"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
