import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[validate-openai-key] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting OpenAI API key validation');

    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    logStep('User authenticated', { userId: user.id });

    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key is required and must be a string');
    }

    // Validate API key format (OpenAI keys start with 'sk-')
    if (!apiKey.startsWith('sk-')) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Invalid API key format. OpenAI keys should start with "sk-"' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Test the API key by making a simple request to OpenAI
    try {
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (testResponse.status === 401) {
        return new Response(JSON.stringify({ 
          valid: false, 
          error: 'Invalid API key. Please check your OpenAI API key.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (testResponse.status === 429) {
        return new Response(JSON.stringify({ 
          valid: false, 
          error: 'API key quota exceeded. Please check your OpenAI billing.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!testResponse.ok) {
        throw new Error(`OpenAI API responded with status: ${testResponse.status}`);
      }

      logStep('API key validation successful', { userId: user.id });

      return new Response(JSON.stringify({ 
        valid: true, 
        message: 'API key is valid and working.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (apiError) {
      logStep('OpenAI API test failed', { error: apiError.message });
      
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Failed to validate API key with OpenAI. Please check your key and try again.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    logStep('Error in validate-openai-key function', { error: error.message });
    
    return new Response(JSON.stringify({ 
      valid: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});