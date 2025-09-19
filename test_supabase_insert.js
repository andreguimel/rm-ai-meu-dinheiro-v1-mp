import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ponxumxwjodpgwhepwxc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTE4NTIsImV4cCI6MjA3MTAyNzg1Mn0.J43LGwbU8tQ8_xe3ua4ddb-HTFLsWXoR7R1MVIS3SdE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testInsert() {
  console.log('🔍 Testando inserção no Supabase...');
  
  const testData = {
    titulo: 'Teste Lembrete',
    descricao: 'Teste de inserção direta',
    data_lembrete: '2025-01-20T10:00:00Z',
    categoria_id: null,
    concluido: false,
    user_id: '39dccc29-1396-4899-a24a-c4b485c7659e'
  };
  
  console.log('📝 Dados a serem inseridos:', testData);
  
  try {
    const { data, error } = await supabase
      .from('lembretes')
      .insert([testData])
      .select();
    
    console.log('✅ Resultado da inserção:');
    console.log('Data:', data);
    console.log('Error:', error);
    
    if (error) {
      console.error('❌ Erro detalhado:', error);
    } else {
      console.log('🎉 Inserção bem-sucedida!');
    }
  } catch (err) {
    console.error('💥 Erro na execução:', err);
  }
}

testInsert();