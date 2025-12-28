import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client for user creation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the calling user is a guardian
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callingUser) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if calling user has guardian role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callingUser.id)
      .single();

    if (roleError || roleData?.role !== 'guardian') {
      return new Response(
        JSON.stringify({ success: false, error: 'Solo los acudientes pueden crear estudiantes' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { full_name, email, password, level, guardian_id } = await req.json();

    // Validate inputs
    if (!full_name || !email || !password || !level) {
      return new Response(
        JSON.stringify({ success: false, error: 'Todos los campos son obligatorios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ success: false, error: 'La contraseña debe tener al menos 8 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (emailExists) {
      return new Response(
        JSON.stringify({ success: false, error: 'Este correo electrónico ya está registrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine grade level from education level
    const gradeLevel = level === 'PRIMARY' ? 3 : 9;

    // Create the student user in Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        role: 'student',
        full_name,
        preferred_language: 'es'
      }
    });

    if (createError || !newUser.user) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ success: false, error: createError?.message || 'Error al crear el usuario' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // The trigger will create the student_profile, but we need to update it with guardian_id and grade_level
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update the student profile with guardian_id, grade_level, and enrolled_by
    const { error: updateError } = await supabaseAdmin
      .from('student_profiles')
      .update({ 
        guardian_id: guardian_id,
        grade_level: gradeLevel,
        enrolled_by: 'guardian'
      })
      .eq('user_id', newUser.user.id);

    if (updateError) {
      console.error('Error updating student profile:', updateError);
      // Don't fail completely, the student was created
    }

    console.log(`Student created successfully: ${email} by guardian ${callingUser.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        student_id: newUser.user.id,
        message: 'Estudiante creado exitosamente'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
