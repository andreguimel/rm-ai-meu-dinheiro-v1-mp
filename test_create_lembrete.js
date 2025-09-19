import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ponxumxwjodpgwhepwxc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTE4NTIsImV4cCI6MjA3MTAyNzg1Mn0.J43LGwbU8tQ8_xe3ua4ddb-HTFLsWXoR7R1MVIS3SdE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCreateLembrete() {
  console.log('🔍 Testando criação de lembrete...');
  
  // Primeiro, vamos verificar se conseguimos nos conectar
  try {
    console.log('📡 Testando conexão básica...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('lembretes')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.error('❌ Erro na conexão:', healthError);
      return;
    }
    console.log('✅ Conexão OK');
  } catch (err) {
    console.error('💥 Erro na conexão:', err);
    return;
  }

  // Dados de teste para o lembrete
  const testLembrete = {
    titulo: 'Teste Lembrete',
    descricao: 'Teste de criação via script',
    data_lembrete: '2025-01-20T10:00:00Z',
    categoria_id: null, // Sem categoria
    concluido: false,
    user_id: '39dccc29-1396-4899-a24a-c4b485c7659e' // ID do usuário de teste
  };
  
  console.log('📝 Dados do lembrete:', testLembrete);
  
  try {
    console.log('🚀 Tentando inserir lembrete...');
    const { data, error } = await supabase
      .from('lembretes')
      .insert([testLembrete])
      .select(`
        *,
        categorias (
          id,
          nome,
          cor
        )
      `)
      .single();
    
    console.log('📊 Resultado da inserção:');
    console.log('Data:', data);
    console.log('Error:', error);
    
    if (error) {
      console.error('❌ Erro detalhado:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('🎉 Lembrete criado com sucesso!');
    }
  } catch (err) {
    console.error('💥 Erro na execução:', err);
  }
}

testCreateLembrete();