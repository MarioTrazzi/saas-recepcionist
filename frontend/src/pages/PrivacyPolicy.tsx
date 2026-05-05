import { Link } from 'react-router-dom'
import { Phone } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Phone className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white">AI Receptionist</span>
          </Link>
          <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
            Entrar
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-white mb-2">Política de Privacidade</h1>
        <p className="text-sm text-gray-500 mb-10">Última atualização: maio de 2025</p>

        <div className="space-y-10 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Quem somos</h2>
            <p>
              O AI Receptionist é uma plataforma SaaS que permite a empresas configurar um agente de inteligência artificial
              para atendimento automático via telefone e WhatsApp Business. Ao utilizar a plataforma, o utilizador aceita
              os termos desta política de privacidade.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Dados que recolhemos</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><span className="text-gray-300">Dados de conta:</span> nome, endereço de e-mail e palavra-passe encriptada fornecidos no registo.</li>
              <li><span className="text-gray-300">Dados de autenticação social:</span> nome e e-mail obtidos através do login com Google ou Meta/Facebook, quando o utilizador o autoriza.</li>
              <li><span className="text-gray-300">Credenciais de integração:</span> tokens de acesso e identificadores de conta para serviços como WhatsApp Business API (Meta), Twilio e Google Calendar — armazenados de forma encriptada e usados exclusivamente para operar o agente.</li>
              <li><span className="text-gray-300">Conteúdo de conhecimento:</span> textos, documentos e informações de negócio que o utilizador introduz para treinar o agente.</li>
              <li><span className="text-gray-300">Histórico de conversas:</span> mensagens trocadas entre o agente e os clientes finais, para fins de monitorização e melhoria do serviço.</li>
              <li><span className="text-gray-300">Dados de utilização:</span> registos de acesso, ações na plataforma e métricas de desempenho do agente.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Como utilizamos os dados</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Operar e fornecer os serviços da plataforma.</li>
              <li>Autenticar utilizadores e gerir sessões de forma segura.</li>
              <li>Conectar o agente às APIs de terceiros (Meta WhatsApp, Twilio, ElevenLabs, Google).</li>
              <li>Monitorizar a qualidade do serviço e diagnosticar problemas técnicos.</li>
              <li>Enviar notificações essenciais relacionadas com a conta (sem fins de marketing sem consentimento).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Partilha de dados com terceiros</h2>
            <p className="mb-3">
              Não vendemos nem partilhamos os seus dados pessoais com terceiros para fins de marketing.
              Os dados são partilhados apenas com os prestadores de serviço necessários para o funcionamento da plataforma:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><span className="text-gray-300">Meta (Facebook/WhatsApp):</span> para integração com a WhatsApp Business API.</li>
              <li><span className="text-gray-300">Twilio:</span> para serviços de telefonia e voz.</li>
              <li><span className="text-gray-300">ElevenLabs:</span> para síntese de voz do agente.</li>
              <li><span className="text-gray-300">Google:</span> para login OAuth e integração com Google Calendar.</li>
              <li><span className="text-gray-300">OpenAI / Anthropic / Groq:</span> para processamento de linguagem natural pelo agente de IA.</li>
              <li><span className="text-gray-300">Railway:</span> infraestrutura de alojamento dos servidores.</li>
            </ul>
            <p className="mt-3">
              Cada prestador opera segundo a sua própria política de privacidade e cumpre os regulamentos aplicáveis (RGPD, LGPD e similares).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Retenção de dados</h2>
            <p>
              Os dados de conta são mantidos enquanto a conta estiver ativa. O histórico de conversas é conservado por
              até 12 meses. Após o cancelamento da conta, os dados são eliminados no prazo de 30 dias,
              exceto quando exigido por obrigação legal.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Segurança</h2>
            <p>
              Utilizamos encriptação em trânsito (HTTPS/TLS) e em repouso para dados sensíveis.
              As palavras-passe são armazenadas com hash bcrypt. Os tokens de acesso a APIs de terceiros
              são encriptados na base de dados. Realizamos auditorias de segurança periódicas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Direitos do utilizador</h2>
            <p className="mb-3">O utilizador tem direito a:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Aceder, corrigir ou eliminar os seus dados pessoais.</li>
              <li>Exportar os dados em formato legível.</li>
              <li>Revogar integrações com terceiros a qualquer momento.</li>
              <li>Solicitar a eliminação completa da conta e dados associados.</li>
            </ul>
            <p className="mt-3">
              Para exercer qualquer um destes direitos, contacte-nos através do e-mail indicado abaixo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Cookies</h2>
            <p>
              A plataforma utiliza cookies de sessão estritamente necessários para autenticação e funcionamento.
              Não utilizamos cookies de rastreamento ou publicidade de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Alterações a esta política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Notificaremos os utilizadores ativos por e-mail
              em caso de alterações materiais. A data da última atualização é indicada no topo desta página.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Contacto</h2>
            <p>
              Para questões sobre privacidade ou para exercer os seus direitos, contacte-nos em:{' '}
              <a href="mailto:mariotrazzi@gmail.com" className="text-primary hover:underline">
                mariotrazzi@gmail.com
              </a>
            </p>
          </section>

        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 mt-16">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-gray-600">
          <span>© {new Date().getFullYear()} AI Receptionist. Todos os direitos reservados.</span>
          <Link to="/" className="hover:text-gray-400 transition-colors">Voltar ao início</Link>
        </div>
      </div>
    </div>
  )
}
