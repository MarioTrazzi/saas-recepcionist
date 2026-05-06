import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Phone, MessageSquare, CheckCircle2, ArrowRight,
  Globe, BarChart3, Calendar, Users, Brain, Plus, Zap,
  FileText, Upload, MousePointerClick, Wifi, UserPlus,
  LayoutDashboard, LogOut, ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import './Landing.css'

/* ─────────────────────────────────────────────
   User menu — avatar + dropdown when logged in
───────────────────────────────────────────── */
function UserMenu() {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  if (!user) return null

  const displayName = user.name || user.email?.split('@')[0] || 'Usuário'
  const initials = displayName
    .split(' ')
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'

  const handleLogout = () => {
    logout()
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 12px 6px 6px',
          height: 40,
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,.14)',
          background: 'rgba(255,255,255,.04)',
          color: 'var(--text)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 14,
          fontWeight: 500,
          transition: 'background .15s, border-color .15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,.07)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,.22)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,.04)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,.14)'
        }}
      >
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary, #6c3ce1), var(--accent, #00d4aa))',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '.02em',
          flexShrink: 0,
        }}>{initials}</span>
        <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName}
        </span>
        <ChevronDown style={{
          width: 14,
          height: 14,
          opacity: .6,
          transition: 'transform .15s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            minWidth: 220,
            background: 'rgba(20,18,32,.96)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 12,
            boxShadow: '0 20px 50px -10px rgba(0,0,0,.5)',
            padding: 6,
            zIndex: 60,
          }}
        >
          <div style={{
            padding: '10px 12px',
            borderBottom: '1px solid rgba(255,255,255,.08)',
            marginBottom: 4,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{displayName}</div>
            {user.email && (
              <div style={{ fontSize: 11, color: 'var(--text-mute, #888)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            )}
          </div>
          <button
            role="menuitem"
            onClick={() => { setOpen(false); navigate('/app/dashboard') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 12px', borderRadius: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <LayoutDashboard style={{ width: 16, height: 16, opacity: .8 }} /> Ir para o painel
          </button>
          <button
            role="menuitem"
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 12px', borderRadius: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#ff8585', fontSize: 13, fontFamily: 'inherit', textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <LogOut style={{ width: 16, height: 16 }} /> Sair
          </button>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Step visuals — lightweight JSX mock-UIs
───────────────────────────────────────────── */

function VisualTemplate() {
  const [selected, setSelected] = useState(0)
  const cards = [
    {
      emoji: '🏥', label: 'Saúde', name: 'Clínica São Lucas', agent: 'Sofia',
      howItWorks: 'A Sofia entende pedidos de agendamento, verifica a disponibilidade na agenda e confirma automaticamente. Se o paciente perguntar sobre especialidades ou convênios, ela responde com base nas informações cadastradas.',
      features: ['Agenda consultas com data e hora', 'Informa especialidades e médicos', 'Verifica convênios e planos de saúde', 'Cancela ou reagenda horários'],
      conversation: [
        { from: 'user', text: 'Quero marcar com o cardiologista' },
        { from: 'agent', text: 'Temos terça às 14h ou quarta às 10h. Qual prefere?' },
      ],
    },
    {
      emoji: '🍕', label: 'Alimentação', name: 'Bella Pasta', agent: 'Bia',
      howItWorks: 'A Bia conhece todo o cardápio e preços. Ela monta o pedido, calcula o total e pergunta se é delivery ou retirada. Para reservas, verifica disponibilidade e confirma na hora.',
      features: ['Mostra cardápio completo com preços', 'Aceita pedidos para delivery ou retirada', 'Faz reservas de mesa', 'Indica pratos do dia e promoções'],
      conversation: [
        { from: 'user', text: 'Quero uma pizza margherita' },
        { from: 'agent', text: 'Pizza margherita R$39,90. Delivery ou retirada?' },
      ],
    },
    {
      emoji: '🏠', label: 'Imóveis', name: 'Prime Imóveis', agent: 'Ana',
      howItWorks: 'A Ana conhece o portfólio de imóveis e ajuda o cliente a encontrar o que procura. Filtra por região, preço e tipo, e agenda visitas quando o cliente demonstra interesse.',
      features: ['Apresenta imóveis disponíveis', 'Filtra por região, preço e tipo', 'Agenda visitas presenciais', 'Tira dúvidas sobre financiamento'],
      conversation: [
        { from: 'user', text: 'Procuro apê de 2 quartos em SP' },
        { from: 'agent', text: 'Tenho 3 opções entre R$350k e R$500k. Quer agendar visita?' },
      ],
    },
    {
      emoji: '💆', label: 'Estética', name: 'Studio Belle', agent: 'Lara',
      howItWorks: 'A Lara agenda serviços de beleza, informa preços e duração de cada procedimento, e sugere horários disponíveis. Também pode indicar profissionais e combinar serviços.',
      features: ['Agenda serviços de beleza', 'Informa preços e duração', 'Sugere profissionais disponíveis', 'Combina múltiplos serviços'],
      conversation: [
        { from: 'user', text: 'Quero fazer corte e manicure' },
        { from: 'agent', text: 'Corte R$60 + Manicure R$35. Amanhã às 10h ou 14h?' },
      ],
    },
    {
      emoji: '🎓', label: 'Educação', name: 'EduCursos', agent: 'Edu',
      howItWorks: 'O Edu conhece todos os cursos, valores e processos de matrícula. Responde dúvidas, envia informações detalhadas e agenda aulas experimentais para novos alunos.',
      features: ['Informa cursos e grade curricular', 'Tira dúvidas sobre matrícula', 'Informa valores e pagamento', 'Agenda aulas experimentais'],
      conversation: [
        { from: 'user', text: 'Quero saber sobre o curso de Inglês' },
        { from: 'agent', text: 'Inglês para adultos, R$450/mês. Quer aula experimental gratuita?' },
      ],
    },
    {
      emoji: '🔧', label: 'Serviços', name: 'TechFix', agent: 'Carlos',
      howItWorks: 'O Carlos entende o tipo de serviço solicitado, verifica disponibilidade na agenda e agenda automaticamente. Para orçamentos, coleta informações e envia uma estimativa.',
      features: ['Agenda serviços e visitas técnicas', 'Informa preços e prazos', 'Envia orçamentos estimados', 'Confirma agendamentos'],
      conversation: [
        { from: 'user', text: 'Preciso de um encanador' },
        { from: 'agent', text: 'Temos amanhã às 9h ou 14h. Qual horário funciona melhor?' },
      ],
    },
  ]

  const s = cards[selected]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Grid de cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {cards.map((c, i) => (
          <button key={i} onClick={() => setSelected(i)} style={{
            background: i === selected ? 'linear-gradient(135deg,rgba(108,60,225,.2),rgba(0,212,170,.12))' : 'rgba(255,255,255,.03)',
            border: `1px solid ${i === selected ? 'rgba(108,60,225,.5)' : 'rgba(255,255,255,.08)'}`,
            borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', gap: 4,
            transition: 'all .2s', textAlign: 'left', fontFamily: 'inherit', color: 'inherit',
            outline: 'none',
          }}>
            <span style={{ fontSize: 22 }}>{c.emoji}</span>
            <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' }}>{c.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.name}</span>
            {i === selected && <span style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 style={{ width: 10, height: 10 }} /> Ver detalhes
            </span>}
          </button>
        ))}
      </div>

      {/* Painel de detalhes do template selecionado */}
      <div style={{
        background: 'rgba(255,255,255,.03)',
        border: '1px solid rgba(108,60,225,.3)',
        borderRadius: 14,
        padding: '18px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 24 }}>{s.emoji}</span>
          <div>
            <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Agente: {s.agent}</div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 12 }}>
          {s.howItWorks}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
          {s.features.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, fontSize: 11, color: 'var(--text-dim)', alignItems: 'center' }}>
              <CheckCircle2 style={{ width: 10, height: 10, color: 'var(--accent)', flexShrink: 0 }} />
              {f}
            </div>
          ))}
        </div>

        {/* Mini chat */}
        <div style={{
          background: 'rgba(0,0,0,.2)',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {s.conversation.map((msg, i) => (
            <div key={i} style={{
              maxWidth: '85%',
              padding: '8px 12px',
              borderRadius: 12,
              fontSize: 11,
              lineHeight: 1.5,
              alignSelf: msg.from === 'agent' ? 'flex-start' : 'flex-end',
              background: msg.from === 'agent'
                ? 'linear-gradient(135deg, rgba(108,60,225,.18), rgba(0,212,170,.10))'
                : 'rgba(255,255,255,.06)',
              border: `1px solid ${msg.from === 'agent' ? 'rgba(108,60,225,.3)' : 'rgba(255,255,255,.08)'}`,
              color: msg.from === 'agent' ? 'var(--text)' : 'var(--text-dim)',
              borderBottomLeftRadius: msg.from === 'agent' ? 4 : 12,
              borderBottomRightRadius: msg.from === 'agent' ? 12 : 4,
            }}>
              <span style={{ fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', opacity: .6, display: 'block', marginBottom: 2, fontWeight: 600 }}>
                {msg.from === 'agent' ? s.agent : 'Cliente'}
              </span>
              {msg.text}
            </div>
          ))}
        </div>
      </div>
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
        { label: 'Leads capturados', value: '18', color: '#ffa040' },
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

function VisualLeads() {
  const leads = [
    { initials: 'FO', name: 'Fernanda Oliveira', channel: 'WhatsApp', intent: 'Apartamento 2q · até R$400k', time: '08:42', tag: 'quente' },
    { initials: 'RS', name: 'Ricardo Santos', channel: 'Telefone', intent: 'Reforma hidráulica urgente', time: '09:15', tag: 'novo' },
    { initials: 'AM', name: 'Ana Paula M.', channel: 'WhatsApp', intent: 'Matrícula curso de inglês', time: '10:03', tag: 'novo' },
    { initials: 'CH', name: 'Carlos H.', channel: 'Telefone', intent: 'Consulta cardiologista', time: '10:38', tag: 'convertido' },
  ]
  const tagMap: Record<string, { bg: string; color: string; label: string }> = {
    novo:       { bg: 'rgba(108,60,225,.15)', color: 'var(--primary-2)', label: 'Novo' },
    quente:     { bg: 'rgba(255,140,0,.15)',  color: '#ffa040',          label: '🔥 Quente' },
    convertido: { bg: 'rgba(0,212,170,.15)',  color: 'var(--accent)',    label: 'Convertido' },
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Hot lead alert */}
      <div style={{
        background: 'rgba(255,140,0,.08)', border: '1px solid rgba(255,140,0,.3)',
        borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <span style={{ fontSize: 18 }}>🔥</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#ffa040' }}>Lead quente detectado</div>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 1 }}>
            Fernanda quer comprar agora — notificação enviada no seu WhatsApp
          </div>
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-mute)', flexShrink: 0 }}>agora</span>
      </div>

      {/* List header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>Leads capturados hoje</span>
        <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>4 novos</span>
      </div>

      {/* Leads */}
      {leads.map((lead, i) => {
        const s = tagMap[lead.tag]
        return (
          <div key={i} style={{
            background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg,rgba(108,60,225,.3),rgba(0,212,170,.2))',
              display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text)',
            }}>{lead.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lead.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lead.channel} · {lead.intent}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>
              <span style={{ fontSize: 9, color: 'var(--text-mute)' }}>{lead.time}</span>
            </div>
          </div>
        )
      })}

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 4 }}>
        {[
          { label: 'Capturados', value: '4', color: 'var(--primary-2)' },
          { label: 'Quentes', value: '1', color: '#ffa040' },
          { label: 'Convertidos', value: '1', color: 'var(--accent)' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 10, padding: '10px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 9, color: 'var(--text-mute)', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>
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
        'Perguntas de qualificação de leads já configuradas por setor',
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
  { icon: <UserPlus />, title: 'Captação de leads 24/7', desc: 'Cada atendimento vira um lead registrado. Nome, contato e intenção de compra no dashboard — prontos para seu time fechar.' },
]

const USE_CASES = [
  {
    emoji: '🏥', label: 'Saúde', name: 'Clínicas & Consultórios',
    agent: 'Sofia',
    quote: 'Bom dia! Clínica São Lucas. Tem consulta disponível amanhã às 10h com o Dr. Alves. Posso confirmar seu agendamento?',
    howItWorks: 'A Sofia entende pedidos de agendamento, verifica a disponibilidade na agenda e confirma automaticamente. Ao confirmar a consulta, coleta o WhatsApp do paciente para envio de lembretes e follow-up — transformando cada atendimento em um lead registrado na clínica.',
    features: ['Agenda consultas com data e hora', 'Informa especialidades e médicos', 'Verifica convênios e planos de saúde', 'Cancela ou reagenda horários', 'Envia lembretes de consulta', 'Registra pacientes interessados com plano e intenção para follow-up'],
    conversation: [
      { from: 'patient', text: 'Tenho Unimed. Quero agendar com o cardiologista.' },
      { from: 'agent', text: 'Temos o Dr. Alves terça às 14h ou quarta às 10h. Qual horário prefere?' },
      { from: 'patient', text: 'Terça às 14h.' },
      { from: 'agent', text: 'Agendado! ✅ Para te enviar o lembrete e avisar sobre retornos, qual é o seu WhatsApp?' },
      { from: 'patient', text: '(11) 91234-5678' },
      { from: 'agent', text: 'Perfeito, cadastrado! Até terça às 14h com o Dr. Alves. 😊' },
    ],
  },
  {
    emoji: '🍕', label: 'Alimentação', name: 'Restaurantes & Delivery',
    agent: 'Bia',
    quote: 'Olá! Nosso cardápio de hoje inclui frango grelhado, macarrão ao pesto e saladas. Delivery em até 35 minutos. Qual você gostaria?',
    howItWorks: 'A Bia conhece todo o cardápio e preços. Monta o pedido, calcula o total e fecha o pagamento. Ao final, convida o cliente a entrar na lista de promoções — cadastrando nome e contato para campanhas de fidelização e reativação.',
    features: ['Mostra cardápio completo com preços', 'Aceita pedidos para delivery ou retirada', 'Informa horários de funcionamento', 'Faz reservas de mesa', 'Indica pratos do dia e promoções', 'Captura dados de novos clientes para promoções e fidelização'],
    conversation: [
      { from: 'customer', text: 'Quero uma pizza margherita e uma coca-cola' },
      { from: 'agent', text: 'Pizza margherita R$39,90 + Coca 2L R$12,90 = R$52,80. Vai pagar como?' },
      { from: 'customer', text: 'Pix' },
      { from: 'agent', text: 'Chave Pix: CNPJ 12.345.678/0001-90. Confirmado, vai pra produção! 🍕' },
      { from: 'agent', text: 'Posso te incluir na lista de promoções e pratos especiais da semana? É só me passar seu nome.' },
      { from: 'customer', text: 'Claro! Lucas.' },
      { from: 'agent', text: 'Feito, Lucas! Você vai receber nossas ofertas em primeira mão. Bom apetite! 😄' },
    ],
  },
  {
    emoji: '🏠', label: 'Imóveis', name: 'Imobiliárias',
    agent: 'Ana',
    quote: 'Encontrei 4 opções de 2 quartos no Bairro Jardins dentro do seu orçamento. Posso agendar uma visita para esse sábado?',
    howItWorks: 'A Ana filtra imóveis por orçamento, região e tipo antes de qualquer coisa — qualificando o lead automaticamente. Só depois de entender o perfil do comprador ela apresenta opções e captura o contato para o corretor agir com contexto.',
    features: ['Apresenta imóveis disponíveis com detalhes', 'Filtra por região, preço e tipo', 'Agenda visitas presenciais', 'Informa documentação necessária', 'Tira dúvidas sobre financiamento', 'Qualifica leads por orçamento, região e tipo de imóvel'],
    conversation: [
      { from: 'client', text: 'Procuro apartamento de 2 quartos em SP, até R$400k' },
      { from: 'agent', text: 'Encontrei 3 opções: Pinheiros (R$380k), Vila Mariana (R$395k) e Moema (R$400k). Qual te interessa?' },
      { from: 'client', text: 'Vila Mariana' },
      { from: 'agent', text: '65m², 2 quartos, 1 vaga, varanda. Próximo ao metrô. Posso agendar visita para sábado?' },
      { from: 'client', text: 'Sim!' },
      { from: 'agent', text: 'Para confirmar a visita e enviar o endereço, qual o seu nome e WhatsApp?' },
      { from: 'client', text: 'Fernanda, (11) 99876-5432' },
      { from: 'agent', text: 'Perfeito, Fernanda! Visita confirmada sábado. Nosso corretor vai entrar em contato para combinar o horário. 🏠' },
    ],
  },
  {
    emoji: '💆', label: 'Estética', name: 'Salões & Clínicas de Estética',
    agent: 'Lara',
    quote: 'Oi! Temos horário disponível amanhã para corte e escova às 10h e às 15h. Quer agendar?',
    howItWorks: 'A Lara agenda serviços, informa preços e sugere horários. Ao confirmar o atendimento, convida o cliente a entrar na lista VIP do salão — construindo uma base de clientes para campanhas de reativação e promoções sazonais.',
    features: ['Agenda serviços de beleza', 'Informa preços e duração', 'Sugere profissionais disponíveis', 'Combina múltiplos serviços', 'Envia confirmação e lembrete', 'Constrói lista de clientes para reativação e promoções'],
    conversation: [
      { from: 'client', text: 'Quero fazer corte e manicure' },
      { from: 'agent', text: 'Corte R$60 + Manicure R$35 = R$95. Temos amanhã às 10h ou 14h. Qual prefere?' },
      { from: 'client', text: '14h com a Patrícia' },
      { from: 'agent', text: 'Confirmado! Corte e manicure amanhã às 14h. ✅' },
      { from: 'agent', text: 'Posso te incluir na nossa lista VIP? Você recebe promoções e aviso quando abrem horários com a Patrícia.' },
      { from: 'client', text: 'Quero sim!' },
      { from: 'agent', text: 'Ótimo! Cadastrada. Até amanhã! 💅' },
    ],
  },
  {
    emoji: '🎓', label: 'Educação', name: 'Escolas & Cursos',
    agent: 'Edu',
    quote: 'Temos Inglês para adultos, R$450/mês, aulas 2x por semana. Quer agendar uma aula experimental gratuita?',
    howItWorks: 'O Edu responde dúvidas sobre cursos e matrícula. Antes de enviar qualquer material, coleta nome e email do interessado — alimentando o funil de matrículas com leads qualificados prontos para o time pedagógico abordar.',
    features: ['Informa cursos e grade curricular', 'Tira dúvidas sobre matrícula', 'Informa valores e formas de pagamento', 'Agenda aulas experimentais', 'Envia material informativo', 'Captura interessados e envia material de captação automaticamente'],
    conversation: [
      { from: 'student', text: 'Quero saber sobre o curso de Inglês' },
      { from: 'agent', text: 'Inglês para adultos, R$450/mês, 2x por semana. Temos aula experimental gratuita. Quer participar?' },
      { from: 'student', text: 'Quero!' },
      { from: 'agent', text: 'Para garantir sua vaga e enviar o material, qual é o seu nome e email?' },
      { from: 'student', text: 'Ana, ana@email.com' },
      { from: 'agent', text: 'Perfeito, Ana! Material enviado no seu email. A aula experimental é terça às 19h — te esperamos! 🎓' },
    ],
  },
  {
    emoji: '🔧', label: 'Serviços', name: 'Serviços Técnicos & Manutenção',
    agent: 'Carlos',
    quote: 'Temos disponibilidade amanhã às 9h ou 14h para o reparo. Qual horário fica melhor para você?',
    howItWorks: 'O Carlos entende o serviço, informa o preço estimado e agenda o técnico. Ao confirmar, coleta nome e WhatsApp do cliente — garantindo que nenhum orçamento fique sem follow-up e que o histórico do lead esteja salvo para contatos futuros.',
    features: ['Agenda serviços e visitas técnicas', 'Informa preços e prazos', 'Tira dúvidas sobre tipos de serviço', 'Envia orçamentos estimados', 'Confirma agendamentos por WhatsApp', 'Coleta dados do lead e agenda follow-up automático para orçamentos'],
    conversation: [
      { from: 'customer', text: 'Preciso de um encanador, meu chuveiro está vazando' },
      { from: 'agent', text: 'Entendi! Reparo de chuveiro sai entre R$80 e R$150. Temos amanhã às 9h ou 14h. Qual prefere?' },
      { from: 'customer', text: '9h' },
      { from: 'agent', text: 'Para confirmar e enviar os dados do técnico, qual é o seu nome e WhatsApp?' },
      { from: 'customer', text: 'Roberto, (11) 98888-1234' },
      { from: 'agent', text: 'Confirmado, Roberto! Técnico amanhã às 9h. Você receberá uma mensagem de confirmação em breve. 🔧' },
    ],
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
    features: ['100 min de chamada/mês', 'WhatsApp ilimitado', '1 número de telefone', 'Base de conhecimento', 'Painel de leads básico', 'Suporte por email'],
  },
  {
    name: 'Pro', price: 297, tag: '500 minutos de voz/mês', featured: true,
    features: ['500 min de chamada/mês', 'WhatsApp ilimitado', '1 número de telefone', 'Integração Google Agenda', 'Painel de leads + alertas WhatsApp', 'Follow-up automático de leads', 'Transferência para humano', 'Suporte prioritário'],
  },
  {
    name: 'Enterprise', price: 797, tag: '2.000 minutos de voz/mês', featured: false,
    features: ['2.000 min/mês', 'Múltiplos números', 'Multi-canal', 'CRM de leads completo + exportação', 'Integração com CRMs externos', 'API de integração', 'Relatórios avançados de conversão', 'Suporte dedicado'],
  },
]

const FAQS = [
  { q: 'Preciso de conhecimento técnico para configurar?', a: 'Não. O wizard guiado leva qualquer pessoa do zero ao agente ativo em menos de 10 minutos, sem código.' },
  { q: 'O cliente percebe que está falando com uma IA?', a: 'A voz é gerada por ElevenLabs e soa muito natural. A maioria dos clientes não percebe. Você pode inclusive dar um nome humano ao agente.' },
  { q: 'O que acontece quando acabo os minutos?', a: 'Você pode fazer upgrade a qualquer momento. Até lá, chamadas excedentes são direcionadas para caixa postal ou número alternativo.' },
  { q: 'Funciona com qualquer número de telefone?', a: 'Fornecemos um número brasileiro (DDD à sua escolha) incluso em todos os planos. Portabilidade de número próprio disponível no Enterprise.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Toda conversa é criptografada, armazenada em servidores no Brasil e você pode exportar ou deletar a qualquer momento.' },
  { q: 'Posso testar antes de contratar?', a: 'Sim! 14 dias grátis, sem cartão de crédito. Configure, teste com clientes reais e só assine se gostar.' },
  { q: 'O agente realmente captura e organiza os leads?', a: 'Sim. Cada atendimento gera um lead com nome, contato e intenção de compra registrados. Leads com alta intenção disparam uma notificação imediata no seu WhatsApp. Leads não convertidos recebem um follow-up automático no dia seguinte. Tudo visível no painel com histórico completo da conversa.' },
]

function formatTimer(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function LandingPage() {
  const user = useAuthStore(s => s.user)
  const token = useAuthStore(s => s.token)
  const isLoggedIn = !!token && !!user
  const [liveCount, setLiveCount] = useState(1247)
  const [callTimer, setCallTimer] = useState(14)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [activeTemplate, setActiveTemplate] = useState<number | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const faqBodyRefs = useRef<(HTMLDivElement | null)[]>([])
  const faqRevealedRef = useRef<Set<number>>(new Set())
  const stepRevealedRef = useRef<Set<number>>(new Set())
  const stepDetailRef = useRef<HTMLDivElement>(null)
  const templateDetailRef = useRef<HTMLDivElement>(null)

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
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in')
          const faqIdx = (e.target as HTMLElement).dataset.faqIdx
          if (faqIdx !== undefined) faqRevealedRef.current.add(Number(faqIdx))
          const stepIdx = (e.target as HTMLElement).dataset.stepIdx
          if (stepIdx !== undefined) stepRevealedRef.current.add(Number(stepIdx))
          obs.unobserve(e.target)
        }
      }),
      { threshold: 0.12 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  useLayoutEffect(() => {
    faqRevealedRef.current.forEach(idx => {
      const el = document.querySelector(`.faq-item[data-faq-idx="${idx}"]`)
      if (el && !el.classList.contains('in')) {
        el.classList.add('in')
      }
    })
  }, [openFaq])

  useLayoutEffect(() => {
    stepRevealedRef.current.forEach(idx => {
      const el = document.querySelector(`.step[data-step-idx="${idx}"]`)
      if (el && !el.classList.contains('in')) {
        el.classList.add('in')
      }
    })
  }, [activeStep])

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
            <a href="#leads">Leads</a>
            <a href="#casos">Casos de uso</a>
            <a href="#precos">Preços</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="nav-right">
            {isLoggedIn ? (
              <>
                <Link to="/app/dashboard" className="btn btn-primary">Ir para o painel</Link>
                <UserMenu />
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">Entrar</Link>
                <Link to="/register" className="btn btn-primary">Começar grátis</Link>
              </>
            )}
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
                natural, captura leads, agenda compromissos e faz follow-up automático
                — enquanto você dorme.
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
                  <span className="stat">Lead <strong style={{ color: 'var(--accent)', marginLeft: 4 }}>Capturado</strong></span>
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
            <p><strong style={{ color: 'var(--accent)' }}>Clique</strong> em cada passo para ver como funciona na prática.</p>
          </div>

          {/* Step cards — clickable */}
          <div className="steps">
            {STEPS.map((s, i) => {
              const btn = (
                <button
                  className={`step reveal ${i === 0 && activeStep === null ? 'step-click-hint' : ''}`}
                  data-step-idx={i}
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
              )

              if (i === 0) {
                return (
                  <div key={i} style={{ position: 'relative' }}>
                    {activeStep === null && (
                      <div className="float-hand">
                        <div className="float-hand-ring" />
                        <div className="float-hand-inner">
                          <MousePointerClick />
                        </div>
                      </div>
                    )}
                    {btn}
                  </div>
                )
              }

              return <div key={i}>{btn}</div>
            })}
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
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          document.getElementById('casos')?.scrollIntoView({ behavior: 'smooth' })
                        }}
                      >
                        {s.detail.cta} <ArrowRight />
                      </button>
                      {activeStep < STEPS.length - 1 ? (
                        <button
                          className="btn btn-ghost"
                          onClick={() => handleStepClick(activeStep + 1)}
                        >
                          Próximo passo <ArrowRight />
                        </button>
                      ) : (
                        <Link to={isLoggedIn ? '/app/dashboard' : '/login'} className="btn btn-ghost">
                          Próximo passo <ArrowRight />
                        </Link>
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

      {/* ── LEAD CAPTURE ── */}
      <section className="lp-section" id="leads" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="reveal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            {/* Left — text */}
            <div>
              <span className="eyebrow" style={{ marginBottom: 18, display: 'inline-flex' }}>Captação de leads</span>
              <h2 style={{ marginTop: 12, marginBottom: 20 }}>
                Pare de perder leads.<br />
                Seu agente captura todos — 24h por dia.
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--text-dim)', marginBottom: 32 }}>
                Você paga por marketing, mas quando o lead chega às 22h ninguém atende — e ele vai pro concorrente.
                Seu agente captura, qualifica e registra cada contato. Você acorda com uma lista de oportunidades prontas para fechar.
              </p>
              <ul style={{ listStyle: 'none', margin: '0 0 36px', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'Coleta nome, contato e intenção de compra de cada conversa',
                  'Qualifica leads com perguntas específicas do seu setor',
                  'Alerta no WhatsApp quando um lead quente entra',
                  'Painel com histórico completo de cada lead',
                  'Follow-up automático para leads que não fecharam',
                  'Relatório diário de leads por email ou WhatsApp',
                ].map((f, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                    <CheckCircle2 style={{ color: 'var(--accent)', flexShrink: 0, width: 16, height: 16, marginTop: 2 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn btn-primary btn-lg">
                Capturar mais leads <ArrowRight />
              </Link>
            </div>
            {/* Right — visual */}
            <div>
              <VisualLeads />
            </div>
          </div>
        </div>
      </section>

      {/* ── CASOS DE USO ── */}
      <section className="lp-section" id="casos" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">Templates por setor</span>
            <h2 style={{ marginTop: 18 }}>Veja como o agente se comporta<br />no seu tipo de negócio</h2>
            <p>Cada template é otimizado para o seu setor. <strong style={{ color: 'var(--accent)' }}>Clique</strong> para ver como funciona na prática.</p>
          </div>

          {/* Template grid */}
          <div className="uc-grid">
            {USE_CASES.map((u, i) => (
              <button
                key={i}
                className={`uc-card ${activeTemplate === i ? 'active' : ''}`}
                onClick={() => {
                  setActiveTemplate(activeTemplate === i ? null : i)
                  if (activeTemplate !== i) {
                    setTimeout(() => templateDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80)
                  }
                }}
              >
                <div className="uc-card-emoji">{u.emoji}</div>
                <div className="uc-card-label">{u.label}</div>
                <h3 className="uc-card-name">{u.name}</h3>
                <div className="uc-card-agent">Agente: {u.agent}</div>
                <div className="uc-card-cta">
                  {activeTemplate === i ? 'Fechar' : 'Ver como funciona →'}
                </div>
              </button>
            ))}
          </div>

          {/* Expanded detail panel */}
          <div ref={templateDetailRef} className="uc-detail-wrap" style={{
            maxHeight: activeTemplate !== null ? 800 : 0,
            opacity: activeTemplate !== null ? 1 : 0,
            marginTop: activeTemplate !== null ? 32 : 0,
          }}>
            {activeTemplate !== null && (() => {
              const u = USE_CASES[activeTemplate]
              return (
                <div className="uc-detail">
                  <div className="uc-detail-grid">
                    {/* Left — how it works */}
                    <div className="uc-detail-left">
                      <div className="uc-detail-head">
                        <span className="uc-detail-emoji">{u.emoji}</span>
                        <div>
                          <div className="uc-detail-label">{u.label}</div>
                          <h3 className="uc-detail-name">{u.name}</h3>
                        </div>
                      </div>

                      <div className="uc-detail-section">
                        <h4>Como o agente {u.agent} funciona</h4>
                        <p>{u.howItWorks}</p>
                      </div>

                      <div className="uc-detail-section">
                        <h4>O que ele faz</h4>
                        <ul className="uc-features">
                          {u.features.map((f, j) => (
                            <li key={j}><CheckCircle2 />{f}</li>
                          ))}
                        </ul>
                      </div>

                      <Link to="/register" className="btn btn-primary" style={{ marginTop: 8 }}>
                        Começar com este template <ArrowRight />
                      </Link>
                    </div>

                    {/* Right — conversation */}
                    <div className="uc-detail-right">
                      <div className="uc-chat-header">
                        <div className="uc-chat-avatar">{u.agent[0]}</div>
                        <div>
                          <div className="uc-chat-name">{u.agent}</div>
                          <div className="uc-chat-status">Online agora</div>
                        </div>
                      </div>
                      <div className="uc-chat-body">
                        {u.conversation.map((msg, j) => (
                          <div key={j} className={`uc-msg ${msg.from === 'agent' ? 'agent' : 'user'}`}>
                            {msg.text}
                          </div>
                        ))}
                      </div>
                      <div className="uc-chat-input">
                        <span>Digite uma mensagem...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Testar grátis — 14 dias <ArrowRight />
            </Link>
            <p style={{ fontSize: 13, color: 'var(--text-mute)', marginTop: 14 }}>
              Sem cartão de crédito · Configure em minutos
            </p>
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
              <div key={i} data-faq-idx={i} className={`faq-item reveal ${openFaq === i ? 'open' : ''}`}>
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
