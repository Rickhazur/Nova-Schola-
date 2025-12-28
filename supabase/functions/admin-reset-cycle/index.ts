import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!roleData || roleData.role !== 'admin') {
      throw new Error('Only admins can reset cycles');
    }

    const { confirmation } = await req.json();
    if (confirmation !== 'REINICIAR') {
      throw new Error('Invalid confirmation code');
    }

    console.log('Starting cycle reset...');

    // Get all students with balances
    const { data: studentsWithCoins, error: coinsError } = await supabaseAdmin
      .from('student_coins')
      .select('student_id, balance')
      .gt('balance', 0);

    if (coinsError) {
      throw new Error(`Failed to fetch coins: ${coinsError.message}`);
    }

    // Create reset transactions for each student
    const resetTransactions = (studentsWithCoins || []).map(student => ({
      student_id: student.student_id,
      amount: -student.balance,
      type: 'adjust',
      reason: 'Reinicio de ciclo académico',
      created_by_admin_id: user.id
    }));

    if (resetTransactions.length > 0) {
      const { error: txError } = await supabaseAdmin
        .from('coin_transactions')
        .insert(resetTransactions);

      if (txError) {
        console.error('Transaction insert error:', txError);
      }
    }

    // Reset all balances to 0
    const { error: resetError } = await supabaseAdmin
      .from('student_coins')
      .update({ balance: 0 })
      .neq('student_id', '00000000-0000-0000-0000-000000000000'); // Update all

    if (resetError) {
      throw new Error(`Failed to reset balances: ${resetError.message}`);
    }

    // Archive all active remedial programs
    const { error: archiveError } = await supabaseAdmin
      .from('student_remedial_programs')
      .update({ status: 'archived' })
      .eq('status', 'active');

    if (archiveError) {
      throw new Error(`Failed to archive programs: ${archiveError.message}`);
    }

    console.log('Cycle reset completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        reset_count: studentsWithCoins?.length || 0,
        message: 'Academic cycle reset successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Reset error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});