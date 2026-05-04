import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'

export interface SupportMessage {
  role: 'user' | 'assistant'
  content: string
}

const FAQ = `# WhatsApp Business API — Tutorial e FAQ

## Configuração Inicial

### 1. Criar App no Meta Developers
1. developers.facebook.com/apps/creation
2. Tipo **Empresa**
3. Adicione o produto **WhatsApp**

### 2. Obter Credenciais
WhatsApp → Configuração da API
- **Phone Number ID** (numérico, ex: 123456789012345) — NÃO é o número de telefone
- **Access Token** — gere um token permanente em Configurações do sistema

### 3. Configurar Webhook (PASSO CRÍTICO)
WhatsApp → Configuração → Webhooks
1. Clique em **Assinar webhook**
2. Cole a URL do webhook (mostrada no nosso wizard)
3. Cole o token de verificação: ai-receptionist-verify-2024
4. Confirme — a Meta testa a conexão
5. **MUITO IMPORTANTE**: depois de salvar, clique em "Gerenciar" ou na lista de eventos e clique em **Inscrever** no evento "messages"

### 4. ARMADILHA COMUM: tudo aparece como "Inscrever-se" / "Subscribe"
Por padrão, na Meta TODOS os eventos do webhook aparecem com o botão "Inscrever-se" (em inglês: "Subscribe").
Isso confunde porque parece que já está inscrito.
- Se está escrito **"Inscrever-se"** ou **"Subscribe"** → você AINDA NÃO ESTÁ INSCRITO
- Se está escrito **"Cancelar inscrição"** ou **"Unsubscribe"** → AÍ SIM você está inscrito
Você precisa CLICAR em "Inscrever-se" no evento "messages". Senão, o agente NÃO RECEBE mensagens.

### 5. Publicar o App (passo que muita gente esquece)
Por padrão o app fica em modo Desenvolvimento/Testing e SÓ FUNCIONA com o número de teste da Meta.
Para usar com seu número real:
1. No Meta Developers: App Review → Permissões e Recursos
2. Solicite as permissões: whatsapp_business_messaging e whatsapp_business_management
3. Em "Configurações Básicas", troque o app de **Desenvolvimento** para **Em Operação** (Live)
4. Para apps simples sem usar dados sensíveis, geralmente não precisa de revisão pra começar a enviar/receber

---

## Problemas Comuns

### Erro Meta: "Object with ID does not exist"
Causa: você usou o número de telefone em vez do Phone Number ID.
Solução: pegue o Phone Number ID em WhatsApp → Configuração da API. É um número longo (~15 dígitos), NÃO é o número de telefone com DDD.

### Erro Meta: "Unsupported get request"
Causa: Phone Number ID errado, ou o token não tem permissão pra esse número.
Solução: confira que o Phone Number ID pertence ao MESMO app onde o token foi gerado.

### WhatsApp não recebe mensagens
1. Webhook foi configurado no Meta? (URL + token corretos)
2. O evento **messages** está com "Cancelar inscrição" (= inscrito)? Se está com "Inscrever-se" você não está inscrito ainda.
3. Outro projeto está usando esse mesmo número? Só um pode estar conectado por vez.
4. Os créditos gratuitos da Meta acabaram? (1.000 conversas/mês grátis)

### App em modo Desenvolvimento não envia para números reais
Solução: publique o app (Live) e/ou adicione o número de destino como número de teste em WhatsApp → Configuração da API → "Para".

### Erro 403 access_denied no Google
Solução: adicione as URIs de redirect no Google Cloud Console → Credenciais → OAuth 2.0 Client.

### "Google não verificou este app"
Para desenvolvimento: clique em Avançado → "Ir para (app não verificado)".
Para produção: publique o app no Google Cloud Console → OAuth consent screen.

---

## Custos

### Tier gratuito Meta
1.000 conversas/mês grátis. Depois disso, é necessário cadastrar cartão no Meta Business.

### Estimativa Brasil
- 3.000 msgs: ~$0 (cabe no grátis)
- 7.000 msgs: ~$15/mês (~R$75)
- 15.000 msgs: ~$40/mês (~R$200)

---

## Seleção de número (Telefone)

No nosso wizard você digita o DDD (ex: 11 para São Paulo) e a gente lista números disponíveis.
- Números marcados como **Ativo** já estão na conta Twilio do projeto.
- Números sem o badge Ativo são números do pool — quando você seleciona, o sistema provisiona automaticamente.
- Não importa qual DDD você escolher pro custo: a tarifação é por minuto de chamada, não por DDD.

## Personalização do agente

- **Tom**: amigável é o padrão. Use formal pra advogados/contadores; profissional pra clínicas.
- **Mensagem de saudação**: a primeira frase que o cliente ouve. Mantenha curta (1-2 frases).
- **System prompt**: instruções de comportamento do agente. Quanto mais específico, melhor.
- **Idioma**: pt-BR é o padrão. O agente responde sempre nesse idioma, independente do que o cliente fala.
`

const STEP_CONTEXT: Record<string, string> = {
  '1': 'O usuário está escolhendo um TEMPLATE de negócio (clínica, salão, restaurante, etc.).',
  '2': 'O usuário está PERSONALIZANDO o agente — definindo nome, mensagem de saudação, tom e idioma.',
  '3': 'O usuário está adicionando BASE DE CONHECIMENTO sobre o negócio (textos, FAQs, links).',
  '4': 'O usuário está configurando os CANAIS — escolhendo número de telefone (DDD) e/ou conectando WhatsApp Business via Cloud API da Meta. Esta é a etapa onde aparecem mais dúvidas, principalmente sobre webhook, Phone Number ID, token, e a confusão do "Inscrever-se" / "Subscribe" no Meta.',
  '5': 'O usuário está configurando TRANSFERÊNCIA pra humano e AGENDAMENTO (Google Agenda ou agenda própria).',
  '6': 'O usuário está REVISANDO tudo pra ATIVAR o agente.',
}

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name)
  private openai: OpenAI
  private model: string

  constructor(private readonly config: ConfigService) {
    const groqKey = config.get<string>('GROQ_API_KEY')
    const geminiKey = config.get<string>('GEMINI_API_KEY')
    const openaiKey = config.get<string>('OPENAI_API_KEY')

    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey })
      this.model = config.get('OPENAI_MODEL') || 'gpt-4o-mini'
    } else if (geminiKey) {
      this.openai = new OpenAI({ apiKey: geminiKey, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })
      this.model = config.get('GEMINI_MODEL') || 'gemini-2.0-flash'
    } else if (groqKey) {
      this.openai = new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' })
      this.model = config.get('GROQ_MODEL') || 'llama-3.3-70b-versatile'
    }
  }

  async chat(messages: SupportMessage[], currentStep?: string): Promise<string> {
    if (!this.hasKey()) {
      return 'O suporte com IA não está disponível no momento (LLM não configurada). Confira o passo a passo no painel ao lado, ou abra o FAQ.'
    }

    const stepHint = currentStep && STEP_CONTEXT[currentStep]
      ? `\n\n## Contexto atual\nO usuário está agora no Passo ${currentStep} do wizard. ${STEP_CONTEXT[currentStep]}`
      : ''

    const systemPrompt = `Você é o assistente de suporte de configuração do AI Receptionist (um SaaS brasileiro de recepcionista por IA via telefone e WhatsApp).
Sua função é ajudar o usuário a configurar o sistema durante o wizard de onboarding.

Use exclusivamente as informações abaixo como base de conhecimento. Se a pergunta sair desse escopo, diga que não é a sua especialidade e sugira contatar suporte humano.
Responda sempre em português do Brasil, de forma direta, curta (3-6 frases), em tom amigável e prático.
Quando relevante, use listas numeradas ou bullets curtos. Não invente etapas que não estejam no FAQ.

## Base de conhecimento\n${FAQ}${stepHint}`

    const sanitized = messages
      .filter(m => m.content && (m.role === 'user' || m.role === 'assistant'))
      .slice(-10)

    try {
      const res = await this.openai.chat.completions.create({
        model: this.model,
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          ...sanitized.map(m => ({ role: m.role, content: m.content })),
        ],
      })
      return res.choices[0]?.message?.content?.trim() || 'Não consegui formular uma resposta agora. Pode reformular a pergunta?'
    } catch (err: any) {
      this.logger.error(`Support LLM error: ${err.message}`)
      return 'Tive um problema pra responder agora. Tenta de novo em instantes ou consulte o FAQ no painel.'
    }
  }

  private hasKey(): boolean {
    return !!(this.config.get('GROQ_API_KEY') || this.config.get('GEMINI_API_KEY') || this.config.get('OPENAI_API_KEY'))
  }
}
