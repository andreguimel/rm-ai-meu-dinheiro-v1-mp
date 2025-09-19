import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔧 Configurações:');
console.log('URL:', supabaseUrl);
console.log('Service Key disponível:', !!supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log('📝 Criando usuário de teste...');
    
    const testEmail = 'teste@exemplo.com';
    const testPassword = '123456789';
    
    // Primeiro, tentar criar o usuário
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        name: 'Usuário Teste',
        telefone: '11999999999'
      }
    });

    if (error) {
      console.error('❌ Erro ao criar usuário:', error);
      
      // Se o usuário já existe, tentar fazer login
      if (error.message.includes('already registered')) {
        console.log('👤 Usuário já existe, testando login...');
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });
        
        if (loginError) {
          console.error('❌ Erro no login:', loginError);
        } else {
          console.log('✅ Login bem-sucedido:', loginData.user?.email);
          console.log('🎯 Use estas credenciais para testar:');
          console.log('Email:', testEmail);
          console.log('Senha:', testPassword);
        }
      }
    } else {
      console.log('✅ Usuário criado com sucesso:', data.user?.email);
      console.log('🎯 Use estas credenciais para testar:');
      console.log('Email:', testEmail);
      console.log('Senha:', testPassword);
    }
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

createTestUser();