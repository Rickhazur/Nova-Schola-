import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateTempPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify the requesting user is an admin
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

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError || !roleData || roleData.role !== 'admin') {
      throw new Error('Only admins can enroll students');
    }

    // Parse request body
    const { 
      full_name, 
      email, 
      grade_level, 
      guardian_name, 
      guardian_whatsapp, 
      plan 
    } = await req.json();

    if (!full_name || !email) {
      throw new Error('Missing required fields: full_name and email');
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();

    console.log(`Creating auth user for: ${email}`);

    // Create auth user with admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        role: 'student',
        preferred_language: 'es'
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    const newUserId = authData.user.id;
    console.log(`Auth user created: ${newUserId}`);

    // Update student profile with additional fields
    const planType = plan || 'BASIC';
    const tokenAllowance = planType === 'ELITE' ? 500 : planType === 'PRO' ? 200 : 50;

    const { error: profileError } = await supabaseAdmin
      .from('student_profiles')
      .update({
        full_name,
        grade_level: grade_level ? parseInt(grade_level) : null,
        guardian_name,
        guardian_whatsapp,
        plan: planType,
        token_allowance: tokenAllowance,
        status: 'active',
        enrolled_by: 'admin'
      })
      .eq('user_id', newUserId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Don't fail - profile is created by trigger, update may fail if trigger hasn't run yet
    }

    // Initialize student coins
    const { error: coinsError } = await supabaseAdmin
      .from('student_coins')
      .upsert({
        student_id: newUserId,
        balance: 0,
        total_earned: 0,
        total_spent: 0
      }, { onConflict: 'student_id' });

    if (coinsError) {
      console.error('Coins init error:', coinsError);
    }

    console.log(`Student enrolled successfully: ${email}`);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        email,
        temp_password: tempPassword,
        message: 'Student enrolled successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Enrollment error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});