import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[find-user-by-email] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting user search by email');

    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the request (for authentication)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    logStep('User authenticated', { userId: user.id });

    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      throw new Error('Email is required and must be a string');
    }

    logStep('Searching for user with email', { email });

    // Search for user by email using admin API
    const { data: { users }, error: searchError } = await supabase.auth.admin.listUsers();
    
    if (searchError) {
      logStep('Error searching users', { error: searchError.message });
      throw new Error('Failed to search for users');
    }

    // Find user by email
    const targetUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!targetUser) {
      logStep('User not found', { email });
      return new Response(JSON.stringify({ 
        found: false, 
        message: 'Usuário não encontrado com este email' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is trying to share with themselves
    if (targetUser.id === user.id) {
      logStep('User trying to share with themselves');
      return new Response(JSON.stringify({ 
        found: false, 
        message: 'Você não pode compartilhar a conta com você mesmo' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user already has shared access
    const { data: existingShare, error: shareError } = await supabase
      .from('shared_users')
      .select('id')
      .eq('owner_user_id', user.id)
      .eq('shared_user_id', targetUser.id)
      .eq('active', true)
      .single();

    if (!shareError && existingShare) {
      logStep('User already has shared access');
      return new Response(JSON.stringify({ 
        found: false, 
        message: 'Este usuário já tem acesso à sua conta' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile information
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', targetUser.id)
      .single();

    logStep('User found successfully', { 
      userId: targetUser.id, 
      email: targetUser.email,
      profileName: profile?.name 
    });

    return new Response(JSON.stringify({ 
      found: true, 
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: profile?.name || targetUser.email?.split('@')[0] || 'Usuário'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logStep('Error in find-user-by-email function', { error: error.message });
    
    return new Response(JSON.stringify({ 
      found: false, 
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});