import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ponxumxwjodpgwhepwxc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbnh1bXh3am9kcGd3aGVwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTE4NTIsImV4cCI6MjA3MTAyNzg1Mn0.J43LGwbU8tQ8_xe3ua4ddb-HTFLsWXoR7R1MVIS3SdE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuthAndCreate() {
  console.log('🔍 Testando autenticação e criação de lembrete...');
  
  try {
    // Primeiro, vamos tentar fazer login com um usuário de teste
    console.log('🔐 Tentando fazer login...');
    
    // Vamos criar um usuário de teste primeiro
    const testEmail = 'teste@exemplo.com';
    const testPassword = 'senha123456';
    
    console.log('📝 Criando usuário de teste...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signUpError && signUpError.message !== 'User already registered') {
      console.error('❌ Erro ao criar usuário:', signUpError);
      return;
    }
    
    console.log('✅ Usuário criado ou já existe');
    
    // Agora fazer login
    console.log('🔐 Fazendo login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (signInError) {
      console.error('❌ Erro no login:', signInError);
      return;
    }
    
    console.log('✅ Login realizado com sucesso');
    console.log('👤 Usuário logado:', {
      id: signInData.user?.id,
      email: signInData.user?.email
    });
    
    // Aguardar um pouco para garantir que a sessão está estabelecida
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    
    if (getUserError) {
      console.error('❌ Erro ao verificar usuário:', getUserError);
      return;
    }
    
    console.log('🔍 Status atual do usuário:', {
      id: user?.id,
      email: user?.email,
      authenticated: !!user
    });
    
    if (!user) {
      console.error('❌ Usuário não está autenticado');
      return;
    }
    
    // Agora tentar criar um lembrete
    const testLembrete = {
      titulo: 'Teste Lembrete Autenticado',
      descricao: 'Teste de criação com usuário autenticado',
      data_lembrete: '2025-01-20T10:00:00Z',
      categoria_id: null,
      concluido: false,
      user_id: user.id
    };
    
    console.log('📝 Dados do lembrete:', testLembrete);
    
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
    console.error('💥 Erro geral:', err);
  }
}

testAuthAndCreate();