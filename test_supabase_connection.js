// Script para testar conexão com Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ponxumxwjodpgwhepwxc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTE4NTIsImV4cCI6MjA3MTAyNzg1Mn0.J43LGwbU8tQ8_xe3ua4ddb-HTFLsWXoR7R1MVIS3SdE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...');
  
  try {
    // Teste 1: Verificar se a API está respondendo
    console.log('📡 Testando API REST...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('lembretes')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.error('❌ Erro na API REST:', healthError);
    } else {
      console.log('✅ API REST funcionando');
    }

    // Teste 2: Verificar autenticação
    console.log('🔐 Testando autenticação...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erro de autenticação:', authError);
    } else {
      console.log('✅ Autenticação funcionando, usuário:', user?.id || 'não logado');
    }

    // Teste 3: Verificar se a tabela lembretes existe
    console.log('📋 Testando tabela lembretes...');
    const { data: lembretes, error: tableError } = await supabase
      .from('lembretes')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Erro na tabela lembretes:', tableError);
    } else {
      console.log('✅ Tabela lembretes acessível, registros encontrados:', lembretes?.length || 0);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testConnection();