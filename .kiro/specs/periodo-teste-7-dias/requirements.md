# Requirements Document

## Introduction

O sistema "Meu Dinheiro" precisa implementar um período de teste gratuito de 7 dias para novos usuários. Atualmente, existe uma infraestrutura parcial para trials, mas não está completamente funcional ou integrada ao frontend. Esta funcionalidade permitirá que novos usuários experimentem todas as funcionalidades premium do sistema por 7 dias antes de precisarem assinar um plano pago.

## Requirements

### Requirement 1

**User Story:** Como um novo usuário, eu quero receber automaticamente um período de teste de 7 dias ao me cadastrar, para que eu possa experimentar todas as funcionalidades do sistema antes de decidir assinar um plano pago.

#### Acceptance Criteria

1. WHEN um novo usuário se cadastra no sistema THEN o sistema SHALL criar automaticamente um período de teste de 7 dias
2. WHEN o período de teste é criado THEN o sistema SHALL definir trial_start como a data/hora atual e trial_end como 7 dias no futuro
3. WHEN o usuário está no período de teste THEN o sistema SHALL permitir acesso a todas as funcionalidades premium
4. WHEN o período de teste é criado THEN o sistema SHALL armazenar as informações na tabela subscribers com subscription_tier = "Trial"

### Requirement 2

**User Story:** Como um usuário em período de teste, eu quero ver claramente quantos dias restam do meu teste, para que eu possa me planejar para assinar o serviço antes que expire.

#### Acceptance Criteria

1. WHEN o usuário acessa o dashboard THEN o sistema SHALL exibir um indicador visual do período de teste ativo
2. WHEN o período de teste está ativo THEN o sistema SHALL mostrar o número exato de dias restantes
3. WHEN restam 3 dias ou menos THEN o sistema SHALL destacar o aviso com cor de alerta
4. WHEN o período de teste expira THEN o sistema SHALL exibir uma mensagem informando que o teste expirou

### Requirement 3

**User Story:** Como um usuário cujo período de teste expirou, eu quero ser direcionado para assinar um plano, para que eu possa continuar usando o sistema.

#### Acceptance Criteria

1. WHEN o período de teste expira THEN o sistema SHALL bloquear o acesso às funcionalidades premium
2. WHEN o usuário tenta acessar funcionalidades premium após expiração THEN o sistema SHALL exibir um modal de assinatura
3. WHEN o período de teste expira THEN o sistema SHALL manter acesso apenas às funcionalidades básicas de visualização
4. WHEN o usuário assina um plano após expiração THEN o sistema SHALL restaurar imediatamente o acesso completo

### Requirement 4

**User Story:** Como administrador do sistema, eu quero que o sistema verifique automaticamente o status dos períodos de teste, para que os usuários sejam tratados corretamente conforme seu status de assinatura.

#### Acceptance Criteria

1. WHEN o sistema verifica o status de assinatura THEN o sistema SHALL considerar o período de teste ativo se trial_end > data atual
2. WHEN um usuário tem tanto trial ativo quanto assinatura paga THEN o sistema SHALL priorizar a assinatura paga
3. WHEN o sistema verifica status THEN o sistema SHALL atualizar automaticamente o campo subscribed baseado no trial ativo ou assinatura paga
4. WHEN há inconsistências nos dados THEN o sistema SHALL corrigir automaticamente o status do usuário

### Requirement 5

**User Story:** Como um usuário existente sem período de teste, eu quero poder iniciar um período de teste se elegível, para que eu possa experimentar funcionalidades premium que ainda não usei.

#### Acceptance Criteria

1. WHEN um usuário existente nunca teve trial THEN o sistema SHALL permitir iniciar um período de teste
2. WHEN um usuário já teve trial anteriormente THEN o sistema SHALL impedir criar novo período de teste
3. WHEN um usuário solicita trial THEN o sistema SHALL verificar elegibilidade baseada no histórico
4. WHEN o trial é iniciado manualmente THEN o sistema SHALL seguir as mesmas regras de duração e funcionalidades

### Requirement 6

**User Story:** Como desenvolvedor, eu quero que o sistema de trials seja integrado com as verificações de assinatura existentes, para que não haja conflitos entre diferentes métodos de autenticação de acesso.

#### Acceptance Criteria

1. WHEN o sistema verifica acesso premium THEN o sistema SHALL considerar tanto trials ativos quanto assinaturas pagas
2. WHEN há múltiplas fontes de acesso premium THEN o sistema SHALL usar a hierarquia: assinatura paga > trial ativo > sem acesso
3. WHEN o sistema atualiza status de assinatura THEN o sistema SHALL preservar informações de trial para histórico
4. WHEN há erro na verificação THEN o sistema SHALL usar fallback seguro negando acesso premium
