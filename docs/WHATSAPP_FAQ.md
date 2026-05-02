# WhatsApp Business API - Tutorial e FAQ

## Configuração Inicial

### 1. Criar App no Meta Developers
1. Acesse [developers.facebook.com/apps/creation](https://developers.facebook.com/apps/creation/)
2. Escolha o tipo **Empresa**
3. Adicione o produto **WhatsApp**

### 2. Obter Credenciais
No painel do app: **WhatsApp → Configuração da API**
- **Phone Number ID**: ID numérico do número (ex: `123456789012345`)
- **Access Token**: Gere um token permanente em **Configurações do sistema**

### 3. Configurar Webhook
Em **WhatsApp → Configuração → Webhooks**:
1. Clique em **Assinar webhook**
2. Cole a URL: `https://backend-production-e05e.up.railway.app/api/whatsapp/meta-webhook`
3. Cole o Token: `ai-receptionist-verify-2024`
4. Confirme (Meta testa a conexão)
5. Assine o evento **messages** (obrigatório)

### 4. Verificar no Wizard
- Cole o Phone Number ID e Access Token no wizard
- Clique em **Verificar e conectar**

---

## Problemas Comuns

### Erro 403: access_denied
**Causa:** Redirect URI não autorizado no Google Cloud Console

**Solução:**
1. Acesse [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Edite o OAuth 2.0 Client ID
3. Adicione as URIs de redirect:
   - `https://backend-production-e05e.up.railway.app/api/auth/google/callback`
   - `https://backend-production-e05e.up.railway.app/api/calendar/google/callback`

### Erro 403: "O Google não verificou este app"
**Causa:** App em modo Testing com scopes sensíveis

**Solução:**
- Clique em **Avançado** → **Ir para (app não verificado)**
- Para produção: publique o app ou adicione emails como test users

### Erro 500 do Google no OAuth
**Causa:** Redirect URI incorreto ou consent screen mal configurado

**Solução:**
- Verifique se o redirect_uri no Google Cloud Console corresponde exatamente
- Não pode ter `/` no final

### "type TemplateCategory already exists"
**Causa:** Conflito de enum do TypeORM após mudanças no schema

**Solução:**
```sql
-- Conectar ao banco e executar:
ALTER TABLE templates DROP COLUMN IF EXISTS category;
DROP TYPE IF EXISTS "TemplateCategory" CASCADE;
DELETE FROM templates;
```
O TypeORM recriará automaticamente com `synchronize: true`

### "column 'category' of relation 'templates' contains null values"
**Causa:** Coluna foi removida mas dados existentes têm NULL

**Solução:**
```sql
DELETE FROM templates;
```
Os templates serão re-seedados automaticamente

### Erro Meta API: "Object with ID does not exist"
**Causa:** Usando número de telefone em vez do Phone Number ID

**Solução:**
- Use o **Phone Number ID** (numérico), não o número de telefone
- Encontre em: Meta Business → WhatsApp → Configuração da API

### Erro Meta API: Unsupported get request
**Causa:** Phone Number ID incorreto ou sem permissão

**Solução:**
- Verifique se o Phone Number ID pertence ao app correto
- Verifique se o token tem as permissões necessárias

### WhatsApp não recebe mensagens
**Causas possíveis:**
1. Webhook não configurado no Meta
2. Evento `messages` não assinado
3. Outro serviço usando o mesmo número
4. Créditos gratuitos esgotados

**Solução:**
1. Configure o webhook no Meta (veja seção 3)
2. Assine o evento `messages`
3. Verifique se não há outro projeto usando o mesmo número
4. Adicione cartão no Meta Business para continuar usando

### "Google hasn't verified this app"
**Causa:** App usando scopes sensíveis (Calendar) sem verificação

**Solução:**
- Para desenvolvimento: clique em **Avançado** → **Ir para (unsafe)**
- Para produção: submeta para verificação do Google

---

## Custos da API WhatsApp

### Tier Gratuito
- **1.000 conversas/mês** incluídas pela Meta
- Após esse limite, é necessário cadastrar cartão no Meta Business

### Estimativa de Custos (Brasil)
| Volume | Custo Estimado | BRL |
|--------|---------------|-----|
| 3.000 msgs | ~$0/mês | Plano gratuito |
| 7.000 msgs | ~$15/mês | ~R$75 |
| 15.000 msgs | ~$40/mês | ~R$200 |

*Conversas de serviço (respostas a clientes) são as mais baratas. Valores podem variar.*

---

## Configuração de Múltiplos Projetos

### Mesmo Número em Projetos Diferentes
**Problema:** Dois projetos Railway apontando para o mesmo número WhatsApp

**Solução:**
1. Pausar o serviço do projeto antigo
2. Configurar webhook no Meta para o novo projeto
3. Testar enviando mensagem

### Como Pausar Serviço no Railway
1. Via CLI: `railway service stop`
2. Via API: usar mutation `deploymentStop`
3. Via Dashboard: botão de pause no serviço

---

## Verificação do Google OAuth para Produção

### Obrigações para Publicar
1. Política de privacidade pública
2. Vídeo demo do app
3. Justificativa de cada scope sensível
4. Revisão do Google (pode levar dias/semanas)

### Scopes Sensíveis
- `https://www.googleapis.com/auth/calendar` - requer justificativa
- `https://www.googleapis.com/auth/userinfo.profile` - padrão
- `https://www.googleapis.com/auth/userinfo.email` - padrão

---

## Troubleshooting Rápido

| Sintoma | Verificar |
|---------|-----------|
| WhatsApp não recebe msgs | Webhook configurado no Meta? Evento `messages` assinado? |
| Erro 403 Google | Redirect URIs no Cloud Console? |
| Erro 500 Google | Redirect URI exato? Consent screen publicado? |
| Msgs vão para outro projeto | Outro serviço usando mesmo número? Pausar serviço antigo |
| Créditos esgotados | Adicionar cartão no Meta Business |
| TemplateCategory error | Executar SQL de reset do enum |
