import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Phone, MessageSquare, CheckCircle2, ArrowRight,
  Globe, BarChart3, Calendar, Users, Brain, Plus, Zap,
  FileText, Upload, MousePointerClick, Wifi,
} from 'lucide-react'
import './Landing.css'

/* ─────────────────────────────────────────────
   Step visuals — lightweight JSX mock-UIs
───────────────────────────────────────────── */

function VisualTemplate() {
  const cards = [
    { emoji: '🏥', label: 'Saúde', name: 'Clínica São Lucas' },
    { emoji: '🍕', label: 'Alimentação', name: 'Bella Pasta' },
    { emoji: '🏠', label: 'Imóveis', name: 'Prime Imóveis' },
    { emoji: '💆', label: 'Estética', name: 'Studio Belle' },
    { emoji: '🎓', label: 'Educação', name: 'EduCursos' },
    { emoji: '🔧', label: 'Serviços', name: 'TechFix' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {cards.map((c, i) => (
        <div key={i} style={{
          background: i === 0 ? 'linear-gradient(135deg,rgba(108,60,225,.2),rgba(0,212,170,.12))' : 'rgba(255,255,255,.03)',
          border: `1px solid ${i === 0 ? 'rgba(108,60,225,.5)' : 'rgba(255,255,255,.08)'}`,
          borderRadius: 12, padding: '14px 16px', cursor: 'default',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <span style={{ fontSize: 22 }}>{c.emoji}</span>
          <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' }}>{c.label}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.name}</span>
          {i === 0 && <span style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 style={{ width: 10, height: 10 }} /> Selecionado
          </span>}
        </div>
      ))}
    </div>
  )
}

function VisualKnowledge() {
  const items = [
    { icon: '🌐', title: 'site: clinicasaolucas.com.br', sub: '8 seções importadas' },
    { icon: '📄', title: 'tabela-precos-2025.txt', sub: '1 documento' },
    { icon: '🕐', title: 'Horário de Funcionamento', sub: 'Adicionado manualmente' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <Globe style={{ width: 16, height: 16, color: 'var(--primary-2)', flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'var(--text-mute)', flex: 1 }}>https://www.seusite.com.br</span>
        <span style={{ fontSize: 11, background: 'rgba(108,60,225,.2)', color: 'var(--primary-2)', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>Importar</span>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{
          background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <span style={{ fontSize: 18 }}>{item.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>{item.sub}</div>
          </div>
          <CheckCircle2 style={{ width: 14, height: 14, color: 'var(--accent)', flexShrink: 0 }} />
        </div>
      ))}
      <div style={{
        background: 'rgba(0,212,170,.06)', border: '1px dashed rgba(0,212,170,.3)',
        borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <Upload style={{ width: 15, height: 15, color: 'var(--accent)' }} />
        <span style={{ fontSize: 13, color: 'var(--accent)' }}>Soltar arquivo ou colar URL…</span>
      </div>
    </div>
  )
}

function VisualActivate() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Status card */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(0,212,170,.12),rgba(108,60,225,.08))',
        border: '1px solid rgba(0,212,170,.3)', borderRadius: 14, padding: '20px 22px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(0,212,170,.15)', display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <Wifi style={{ width: 22, height: 22, color: 'var(--accent)' }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>Sophia está ONLINE</div>
          <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 2 }}>Atendendo chamadas e WhatsApp</div>
        </div>
      </div>
      {/* Stats row */}
      {[
        { label: 'Chamadas hoje', value: '23', color: 'var(--primary-2)' },
        { label: 'WhatsApp', value: '47', color: 'var(--accent)' },
        { label: 'Agendamentos', value: '12', color: '#ffc83d' },
      ].map((s, i) => (
        <div key={i} style={{
          background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{s.label}</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   STEPS data (with detail)
───────────────────────────────────────────── */
const STEPS = [
  {
    icon: <Zap />,
    num: '01',
    title: 'Escolha o template',
    desc: 'Modelos prontos para cada setor. Personalize tudo depois.',
    detail: {
      eyebrow: 'Passo 01 — Template',
      heading: 'Templates criados por especialistas em atendimento',
      body: 'Não comece do zero. Escolha entre modelos prontos para clínicas, restaurantes, imobiliárias, salões, escolas e muito mais. Cada template já vem com prompts otimizados, tom de voz adequado ao setor e uma base de conhecimento de exemplo para você editar.',
      features: [
        'Mais de 6 templates por setor',
        'Prompt e personalidade já configurados',
        'Base de conhecimento de exemplo inclusa',
        'Personalize nome, voz e comportamento',
        'Troque de template a qualquer momento',
        'Ou comece do zero com template em branco',
      ],
      cta: 'Explorar templates',
      visual: <VisualTemplate />,
    },
  },
  {
    icon: <Brain />,
    num: '02',
    title: 'Ensine seu agente',
    desc: 'Importe seu site, suba arquivos ou adicione manualmente.',
    detail: {
      eyebrow: 'Passo 02 — Base de Conhecimento',
      heading: 'Seu agente aprende tudo sobre o seu negócio',
      body: 'A base de conhecimento é o que torna seu agente realmente útil. Quanto mais informação você adiciona, mais preciso e natural ele responde. Importe o conteúdo do seu site em segundos, suba documentos ou adicione manualmente horários, preços e políticas.',
      features: [
        'Importação automática do seu site',
        'Upload de arquivos .txt e .pdf',
        'Sugestões inteligentes por setor',
        'O agente aprende em tempo real',
        'Edite e atualize a qualquer momento',
        'Sem limite de documentos (plano Pro)',
      ],
      cta: 'Montar minha base de conhecimento',
      visual: <VisualKnowledge />,
    },
  },
  {
    icon: <Phone />,
    num: '03',
    title: 'Ative e pronto',
    desc: 'Um clique para ir ao ar. Telefone e WhatsApp prontos em minutos.',
    detail: {
      eyebrow: 'Passo 03 — Ativação',
      heading: 'Do zero a atendendo em menos de 10 minutos',
      body: 'Com um clique, seu agente recebe um número de telefone brasileiro e se conecta ao WhatsApp Business. Nenhuma configuração técnica. Monitore todas as conversas em tempo real pelo dashboard e ajuste o que quiser sem precisar de suporte.',
      features: [
        'Número de telefone brasileiro incluso',
        'Conexão com WhatsApp Business',
        'Dashboard de conversas em tempo real',
        'Transferência automática para humano',
        'Relatórios diários por email',
        'Suporte via chat no onboarding',
      ],
      cta: 'Ativar meu agente agora',
      visual: <VisualActivate />,
    },
  },
]

/* ─────────────────────────────────────────────
   Remaining static data
───────────────────────────────────────────── */
const FEATURES = [
  { icon: <Phone />, title: 'Telefone 24/7', desc: 'Voz natural gerada por IA. Seu cliente não percebe a diferença. Nunca mais telefone ocupado.' },
  { icon: <MessageSquare />, title: 'WhatsApp integrado', desc: 'Responde mensagens em segundos, agenda, tira dúvidas e fecha negócios pelo WhatsApp.' },
  { icon: <Calendar />, title: 'Agenda automática', desc: 'Integração com Google Agenda. Agenda, cancela e confirma compromissos sem intervenção humana.' },
  { icon: <Brain />, title: 'IA com contexto', desc: 'Baseado em GPT-4o. Entende contexto, lembra da conversa e dá respostas coerentes e naturais.' },
  { icon: <BarChart3 />, title: 'Dashboard completo', desc: 'Acompanhe volume de chamadas, assuntos mais perguntados, horários de pico e satisfação.' },
  { icon: <Users />, title: 'Transferência humana', desc: 'Detecta quando o cliente precisa de atendimento humano e transfere na hora certa.' },
]

const USE_CASES = [
  {
    emoji: '🏥', label: 'Saúde', name: 'Clínicas & Consultórios',
    quote: 'Bom dia! Clínica São Lucas. Tem consulta disponível amanhã às 10h com o Dr. Alves. Posso confirmar seu agendamento?',
    agent: 'Sophia — Assistente da Clínica São Lucas',
  },
  {
    emoji: '🍕', label: 'Alimentação', name: 'Restaurantes & Delivery',
    quote: 'Olá! Nosso cardápio de hoje inclui frango grelhado, macarrão ao pesto e saladas. Delivery em até 35 minutos. Qual você gostaria?',
    agent: 'Luigi — Assistente do Restaurante Bella Pasta',
  },
  {
    emoji: '🏠', label: 'Imóveis', name: 'Imobiliárias',
    quote: 'Encontrei 4 opções de 2 quartos no Bairro Jardins dentro do seu orçamento. Posso agendar uma visita para esse sábado?',
    agent: 'Ana — Assistente da Prime Imóveis',
  },
]

const TESTIMONIALS = [
  {
    initials: 'RC', name: 'Roberto C.', role: 'Dono, Clínica Saúde Total',
    quote: 'Antes perdia 30% das ligações por não ter recepcionista à noite. Hoje o agente atende 24h e nossa taxa de agendamento aumentou 40%.',
  },
  {
    initials: 'MF', name: 'Mariana F.', role: 'Gerente, Imobiliária Lar Certo',
    quote: 'Nossos leads chegam a qualquer hora. Com o AI Receptionist, nenhum cliente fica sem resposta. Vale cada centavo.',
  },
  {
    initials: 'LP', name: 'Lucas P.', role: 'Proprietário, Bella Cozinha',
    quote: 'Implementei em 15 minutos. O agente conhece todo o cardápio, faz pedidos e ainda informa o tempo de entrega. Incrível.',
  },
]

const PLANS = [
  {
    name: 'Starter', price: 97, tag: '100 minutos de voz/mês', featured: false,
    features: ['100 min de chamada/mês', 'WhatsApp ilimitado', '1 número de telefone', 'Base de conhecimento', 'Suporte por email'],
  },
  {
    name: 'Pro', price: 297, tag: '500 minutos de voz/mês', featured: true,
    features: ['500 min de chamada/mês', 'WhatsApp ilimitado', '1 número de telefone', 'Integração Google Agenda', 'Transferência para humano', 'Suporte prioritário'],
  },
  {
    name: 'Enterprise', price: 797, tag: '2.000 minutos de voz/mês', featured: false,
    features: ['2.000 min/mês', 'Múltiplos números', 'Multi-canal', 'API de integração', 'Relatórios avançados', 'Suporte dedicado'],
  },
]

const FAQS = [
  { q: 'Preciso de conhecimento técnico para configurar?', a: 'Não. O wizard guiado leva qualquer pessoa do zero ao agente ativo em menos de 10 minutos, sem código.' },
  { q: 'O cliente percebe que está falando com uma IA?', a: 'A voz é gerada por ElevenLabs e soa muito natural. A maioria dos clientes não percebe. Você pode inclusive dar um nome humano ao agente.' },
  { q: 'O que acontece quando acabo os minutos?', a: 'Você pode fazer upgrade a qualquer momento. Até lá, chamadas excedentes são direcionadas para caixa postal ou número alternativo.' },
  { q: 'Funciona com qualquer número de telefone?', a: 'Fornecemos um número brasileiro (DDD à sua escolha) incluso em todos os planos. Portabilidade de número próprio disponível no Enterprise.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Toda conversa é criptografada, armazenada em servidores no Brasil e você pode exportar ou deletar a qualquer momento.' },
  { q: 'Posso testar antes de contratar?', a: 'Sim! 14 dias grátis, sem cartão de crédito. Configure, teste com clientes reais e só assine se gostar.' },
]

function formatTimer(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function LandingPage() {
  const [liveCount, setLiveCount] = useState(1247)
  const [callTimer, setCallTimer] = useState(14)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const faqBodyRefs = useRef<(HTMLDivElement | null)[]>([])
  const stepDetailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const handler = () => nav.classList.toggle('scrolled', window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target) } }),
      { threshold: 0.12 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setLiveCount(n => {
        const next = n + Math.floor(Math.random() * 3) - 1
        return next < 1180 ? 1180 : next > 1320 ? 1320 : next
      })
    }, 2200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setCallTimer(t => (t >= 95 ? 0 : t + 1)), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const container = featuresRef.current
    if (!container) return
    const cards = Array.from(container.querySelectorAll<HTMLElement>('.feature'))
    const listeners: Array<() => void> = []
    cards.forEach(card => {
      const handler = (e: PointerEvent) => {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--x', `${e.clientX - r.left}px`)
        card.style.setProperty('--y', `${e.clientY - r.top}px`)
      }
      card.addEventListener('pointermove', handler)
      listeners.push(() => card.removeEventListener('pointermove', handler))
    })
    return () => listeners.forEach(f => f())
  }, [])

  const handleStepClick = (i: number) => {
    const next = activeStep === i ? null : i
    setActiveStep(next)
    if (next !== null) {
      setTimeout(() => stepDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
    }
  }

  const toggleFaq = (i: number) => {
    setOpenFaq(prev => {
      const next = prev === i ? null : i
      faqBodyRefs.current.forEach((el, idx) => {
        if (!el) return
        el.style.maxHeight = idx === next ? `${el.scrollHeight}px` : '0'
      })
      return next
    })
  }

  return (
    <div className="lp-root">
      <div className="lp-ambient-before" />
      <div className="lp-ambient-after" />

      {/* ── NAV ── */}
      <nav className="lp-nav" ref={navRef}>
        <div className="wrap nav-inner">
          <a href="#" className="logo">
            <div className="logo-mark"><Phone /></div>
            AI Receptionist
          </a>
          <div className="nav-links">
            <a href="#como-funciona">Como funciona</a>
            <a href="#casos">Casos de uso</a>
            <a href="#precos">Preços</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="nav-right">
            <Link to="/login" className="btn btn-ghost">Entrar</Link>
            <Link to="/register" className="btn btn-primary">Começar grátis</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero" id="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div>
              <div className="live-badge">
                <span className="live-dot" />
                <span className="count">{liveCount.toLocaleString('pt-BR')}</span>&nbsp;atendimentos ativos agora
              </div>
              <h1>
                Seu negócio atende{' '}
                <span className="accent">24 horas</span>
                <br />sem contratar ninguém
              </h1>
              <p className="lead">
                Configure um assistente de IA que atende ligações e WhatsApp com voz
                natural, agenda compromissos e resolve dúvidas — enquanto você dorme.
              </p>
              <div className="hero-cta">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Testar grátis 14 dias <ArrowRight />
                </Link>
                <a href="#como-funciona" className="btn btn-ghost btn-lg">
                  Como funciona
                </a>
              </div>
              <div className="hero-trust">
                <span className="item"><CheckCircle2 className="check" /> Sem cartão de crédito</span>
                <span className="item"><CheckCircle2 className="check" /> Setup em 5 minutos</span>
                <span className="item"><CheckCircle2 className="check" /> Cancele quando quiser</span>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div className="floater f1">
                <span className="dot green" />
                Chamada ativa
              </div>
              <div className="call-card">
                <div className="cc-head">
                  <div className="cc-caller">
                    <div className="cc-avatar">MR</div>
                    <div>
                      <div className="cc-name">Marcos Ribeiro</div>
                      <div className="cc-phone">(11) 9 8765-4321</div>
                    </div>
                  </div>
                  <div className="cc-time">{formatTimer(callTimer)}</div>
                </div>
                <div className="waveform">
                  {Array.from({ length: 20 }).map((_, i) => <div key={i} className="bar" />)}
                </div>
                <div className="transcript">
                  <div className="bubble them">
                    <span className="who">Cliente</span>
                    Oi, queria saber se tem consulta disponível amanhã?
                  </div>
                  <div className="bubble us">
                    <span className="who">Sophia — IA</span>
                    Olá, Marcos! Temos horário às 10h e às 14h com o Dr. Alves. Qual prefere?
                  </div>
                  <div className="bubble them">
                    <span className="who">Cliente</span>
                    <span className="typing"><i /><i /><i /></span>
                  </div>
                </div>
                <div className="cc-foot">
                  <span className="stat">Sentimento <strong style={{ color: 'var(--accent)', marginLeft: 4 }}>Positivo</strong></span>
                  <span className="stat">Canal <strong style={{ marginLeft: 4 }}>Telefone</strong></span>
                </div>
              </div>
              <div className="floater f2">
                <span className="dot purple" />
                WhatsApp: 12 msgs/min
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA (Steps) ── */}
      <section className="lp-section" id="como-funciona">
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Como funciona</span>
            <h2 style={{ marginTop: 18 }}>Do zero ao agente ativo<br />em menos de 10 minutos</h2>
            <p>Clique em cada passo para ver como funciona na prática.</p>
          </div>

          {/* Step cards — clickable */}
          <div className="steps">
            {STEPS.map((s, i) => (
              <button
                key={i}
                className="step reveal"
                data-delay={String(i + 1) as any}
                onClick={() => handleStepClick(i)}
                style={{
                  textAlign: 'left', cursor: 'pointer', width: '100%',
                  borderColor: activeStep === i ? 'rgba(108,60,225,.6)' : undefined,
                  background: activeStep === i
                    ? 'linear-gradient(180deg,rgba(108,60,225,.12),rgba(108,60,225,.04))'
                    : undefined,
                  boxShadow: activeStep === i ? '0 0 0 1px rgba(108,60,225,.4)' : undefined,
                  outline: 'none',
                }}
              >
                <span className="step-num">{s.num}</span>
                <div className="step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <div style={{
                  marginTop: 18, display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 500,
                  color: activeStep === i ? 'var(--accent)' : 'var(--text-mute)',
                  transition: 'color .2s',
                }}>
                  <MousePointerClick style={{ width: 14, height: 14 }} />
                  {activeStep === i ? 'Fechar detalhes' : 'Ver detalhes'}
                </div>
              </button>
            ))}
          </div>

          {/* Step detail panel */}
          <div ref={stepDetailRef} style={{
            overflow: 'hidden',
            maxHeight: activeStep !== null ? 600 : 0,
            opacity: activeStep !== null ? 1 : 0,
            transition: 'max-height .45s cubic-bezier(.2,.7,.2,1), opacity .35s ease',
            marginTop: activeStep !== null ? 24 : 0,
          }}>
            {activeStep !== null && (() => {
              const s = STEPS[activeStep]
              return (
                <div style={{
                  background: 'linear-gradient(180deg, var(--bg-3), var(--bg-2))',
                  border: '1px solid rgba(108,60,225,.3)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '40px 40px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 48,
                  alignItems: 'start',
                }}>
                  {/* Left — text */}
                  <div>
                    <span className="eyebrow" style={{ marginBottom: 18, display: 'inline-flex' }}>
                      {s.detail.eyebrow}
                    </span>
                    <h3 style={{ fontSize: 26, marginBottom: 14, marginTop: 0 }}>{s.detail.heading}</h3>
                    <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 28, color: 'var(--text-dim)' }}>
                      {s.detail.body}
                    </p>
                    <ul style={{ listStyle: 'none', margin: '0 0 32px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {s.detail.features.map((f, j) => (
                        <li key={j} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                          <CheckCircle2 style={{ color: 'var(--accent)', flexShrink: 0, width: 16, height: 16, marginTop: 2 }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <Link to="/register" className="btn btn-primary">
                        {s.detail.cta} <ArrowRight />
                      </Link>
                      {activeStep < STEPS.length - 1 && (
                        <button
                          className="btn btn-ghost"
                          onClick={() => handleStepClick(activeStep + 1)}
                        >
                          Próximo passo <ArrowRight />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right — visual */}
                  <div style={{ paddingTop: 4 }}>
                    {s.detail.visual}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* CTA after steps */}
          <div style={{
            marginTop: 48, textAlign: 'center',
            padding: '32px 24px',
            background: 'rgba(108,60,225,.06)',
            border: '1px solid rgba(108,60,225,.18)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <p style={{ fontSize: 16, color: 'var(--text-dim)', marginBottom: 20 }}>
              Pronto para ver na prática? Configure seu agente em menos de 10 minutos.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary btn-lg">
                Começar grátis — 14 dias <ArrowRight />
              </Link>
              <Link to="/register" className="btn btn-ghost btn-lg">
                Ver planos e preços
              </Link>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 14 }}>
              Sem cartão de crédito · Cancele quando quiser · Suporte em português
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-section" id="features" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Funcionalidades</span>
            <h2 style={{ marginTop: 18 }}>Tudo que você precisa<br />em uma plataforma</h2>
            <p>Simples de configurar, poderoso o suficiente para substituir uma equipe de atendimento.</p>
          </div>
          <div className="features" ref={featuresRef}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature reveal" data-delay={String((i % 3) + 1) as any}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CASOS DE USO ── */}
      <section className="lp-section" id="casos" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Casos de uso</span>
            <h2 style={{ marginTop: 18 }}>Para qualquer<br />tipo de negócio</h2>
            <p>Templates prontos para os principais segmentos. Escolha o seu e personalize.</p>
          </div>
          <div className="uc-list">
            {USE_CASES.map((u, i) => (
              <div key={i} className="uc reveal" data-delay={String(i + 1) as any}>
                <div className="uc-emoji">{u.emoji}</div>
                <div className="uc-meta">
                  <div className="label">{u.label}</div>
                  <h3>{u.name}</h3>
                </div>
                <div className="uc-quote">
                  <span className="agent">{u.agent}</span>
                  {u.quote}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Ver todos os templates <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="lp-section" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Depoimentos</span>
            <h2 style={{ marginTop: 18 }}>Quem já usa<br />não para mais</h2>
          </div>
          <div className="testimonials">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="tcard reveal" data-delay={String(i + 1) as any}>
                <div className="stars">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg key={j} viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                  ))}
                </div>
                <q>{t.quote}</q>
                <div className="tperson">
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    display: 'grid', placeItems: 'center',
                    fontSize: 13, fontWeight: 600, color: '#fff',
                    border: '1px solid var(--line-2)', flexShrink: 0,
                  }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="n">{t.name}</div>
                    <div className="r">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="lp-section" id="precos" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Preços</span>
            <h2 style={{ marginTop: 18 }}>Simples e transparente</h2>
            <p>Cancele quando quiser. Sem taxas escondidas. Sem fidelidade.</p>
          </div>
          <div className="pricing">
            {PLANS.map((p, i) => (
              <div key={i} className={`plan reveal ${p.featured ? 'featured' : ''}`} data-delay={String(i + 1) as any}>
                <div>
                  <div className="plan-name">{p.name}</div>
                  <div className="plan-price">
                    <span className="v">R${p.price}</span>
                    <span className="u">/mês</span>
                  </div>
                  <div className="plan-tag">{p.tag}</div>
                </div>
                <ul>
                  {p.features.map((f, j) => (
                    <li key={j}><CheckCircle2 />{f}</li>
                  ))}
                </ul>
                <Link to="/register" className={`btn ${p.featured ? 'btn-primary' : 'btn-ghost'}`}>
                  {p.featured ? 'Começar agora — mais popular' : 'Começar agora'}
                </Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-mute)', marginTop: 32 }}>
            Todos os planos incluem 14 dias grátis sem cartão de crédito.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="lp-section" id="faq" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">FAQ</span>
            <h2 style={{ marginTop: 18 }}>Perguntas frequentes</h2>
          </div>
          <div className="faq">
            {FAQS.map((item, i) => (
              <div key={i} className={`faq-item reveal ${openFaq === i ? 'open' : ''}`}>
                <button className="faq-q" onClick={() => toggleFaq(i)}>
                  {item.q}
                  <span className="ico"><Plus /></span>
                </button>
                <div className="faq-a" ref={el => { faqBodyRefs.current[i] = el }}>
                  <div className="faq-a-inner">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Ainda tem dúvidas? Fale conosco <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="lp-section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="cta-final reveal">
            <h2>Pronto para nunca perder um cliente?</h2>
            <p>Ative seu AI Receptionist em menos de 5 minutos. Sem cartão de crédito.</p>
            <div className="btn-row">
              <Link to="/register" className="btn btn-primary btn-lg">
                Começar grátis <ArrowRight />
              </Link>
              <a href="#precos" className="btn btn-ghost btn-lg">
                Ver planos
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="wrap">
          <div className="foot">
            <div className="logo">
              <div className="logo-mark" style={{ width: 26, height: 26, borderRadius: 7 }}><Phone /></div>
              AI Receptionist © 2025
            </div>
            <div className="foot-links">
              <a href="#">Termos</a>
              <a href="#">Privacidade</a>
              <a href="#">Contato</a>
            </div>
            <span>Powered by ElevenLabs · Twilio · OpenAI</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
