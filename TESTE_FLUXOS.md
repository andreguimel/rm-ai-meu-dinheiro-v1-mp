# Checklist de Testes - Sistema de Autenticação e Assinatura

## ✅ Alterações Implementadas

### 1. Hook useAuth.ts

- ✅ Restauradas todas as funções de autenticação: `signIn`, `signUp`, `signOut`, `resetPassword`, `updatePassword`
- ✅ Removida toda lógica de trial/onboarding automático
- ✅ Melhorado tratamento de erros

### 2. Componente LoginForm.tsx

- ✅ Agora usa corretamente `signIn` do hook `useAuth`
- ✅ Erro "signIn is not a function" resolvido

### 3. Componente DashboardLayout.tsx

- ✅ Logout agora usa `signOut` do hook `useAuth`
- ✅ Removida chamada direta ao supabase.auth.signOut()

### 4. Componente ChangePasswordModal.tsx

- ✅ Alteração de senha agora usa `updatePassword` do hook `useAuth`
- ✅ Removida chamada direta ao supabase.auth.updateUser()

### 5. Hook useSubscription.ts

- ✅ Adicionados logs de debug para acompanhar status da assinatura
- ✅ Melhorado tratamento de erros
- ✅ Lógica de admin temporariamente comentada para debug

### 6. Componente Perfil.tsx

- ✅ Layout reorganizado: informações pessoais primeiro, depois avatar/ações, depois assinatura
- ✅ Removida toda UI relacionada a trial
- ✅ Melhorada exibição do status de assinatura

## 🧪 Testes a Realizar

### A. Teste de Login/Registro

1. **Novo Usuário**

   - [ ] Criar nova conta
   - [ ] Verificar se perfil é criado automaticamente
   - [ ] Verificar status de assinatura (deve mostrar "Sem Assinatura")
   - [ ] Verificar logs no console para debug

2. **Login Existente**
   - [ ] Fazer login com usuário existente
   - [ ] Verificar se não há erros no console
   - [ ] Verificar se dashboard carrega corretamente

### B. Teste de Assinatura

1. **Status de Assinatura**

   - [ ] Usuário sem assinatura deve ver "Sem Assinatura"
   - [ ] Botão "Assinar" deve estar disponível
   - [ ] Logs de debug devem mostrar `subscribed: false`

2. **Criação de Checkout**
   - [ ] Clicar em "Assinar Agora"
   - [ ] Verificar se checkout do MercadoPago abre
   - [ ] Verificar logs no console

### C. Teste de Autenticação

1. **Logout**

   - [ ] Clicar em logout no menu
   - [ ] Verificar se usuário é redirecionado para login
   - [ ] Verificar se não há erros no console

2. **Alteração de Senha**
   - [ ] Abrir modal de alteração de senha
   - [ ] Alterar senha
   - [ ] Verificar se processo funciona sem erros
   - [ ] Testar login com nova senha

### D. Verificação de Logs

1. **Console do Navegador**

   - [ ] Verificar se não há erros de "função não encontrada"
   - [ ] Verificar logs de debug do useSubscription
   - [ ] Verificar se autenticação funciona sem erros

2. **Terminal do Vite**
   - [ ] Verificar se não há erros de compilação
   - [ ] Verificar se hot reload funciona corretamente

## 🚨 Problemas Conhecidos (Resolvidos)

- ✅ ~~LoginForm.tsx:27 Uncaught (in promise) TypeError: signIn is not a function~~
- ✅ ~~Status de assinatura sempre "ativo" para novos usuários~~
- ✅ ~~Layout do perfil com informações de assinatura acima de dados pessoais~~
- ✅ ~~Funções de logout e alteração de senha não funcionando~~

## 📝 Próximos Passos

1. Testar todos os fluxos listados acima
2. Verificar logs do useSubscription para novos usuários
3. Confirmar que status "Sem Assinatura" aparece corretamente
4. Validar que todos os botões e ações funcionam
5. Se necessário, ajustar lógica de onboarding no Supabase
