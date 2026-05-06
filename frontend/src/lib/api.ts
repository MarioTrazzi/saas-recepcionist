import axios from 'axios'

// Em produção (Railway), VITE_API_URL aponta para o backend.
// Em dev local, fica vazio e o proxy do Vite cuida do /api.
const BASE = (import.meta.env.VITE_API_URL as string) || ''
const api = axios.create({ baseURL: `${BASE}/api` })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default api

export const authApi = {
  register: (data: any) => api.post('/auth/register', data).then(r => r.data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  metaCallback: (accessToken: string) =>
    api.post('/auth/meta/callback', { accessToken }).then(r => r.data as { token: string; isNew: boolean; whatsappConfigured: boolean }),
}

export const tenantApi = {
  getMe: () => api.get('/tenant/me').then(r => r.data),
  update: (data: any) => api.patch('/tenant/me', data).then(r => r.data),
}

export const agentApi = {
  getConfig: () => api.get('/agent/config').then(r => r.data),
  upsertConfig: (data: any) => api.put('/agent/config', data).then(r => r.data),
  generateTips: (systemPrompt: string, agentName: string, templateCategory?: string) =>
    api.post('/agent/tips', { systemPrompt, agentName, templateCategory }).then(r => r.data as { tips: string[] }),
}

export const phoneApi = {
  listNumbers: () => api.get('/phone/numbers').then(r => r.data),
  assign: (phoneSid: string) => api.post('/phone/assign', { phoneSid }).then(r => r.data),
  provision: (areaCode?: string) => api.post('/phone/provision', { areaCode }).then(r => r.data),
  createElevenLabsAgent: () => api.post('/phone/create-elevenlabs-agent').then(r => r.data),
  getElevenLabsAgent: () => api.get('/phone/elevenlabs-agent').then(r => r.data),
  updateElevenLabsAgent: (data: { name?: string; prompt?: string; firstMessage?: string; language?: string; voiceId?: string; expressiveMode?: boolean; interruptible?: boolean; llm?: string }) =>
    api.patch('/phone/elevenlabs-agent', data).then(r => r.data),
  listElevenLabsVoices: () => api.get('/phone/elevenlabs-voices').then(r => r.data),
  getConversationToken: () => api.get('/phone/elevenlabs-conversation-token').then(r => r.data as { signedUrl: string }),
}

export const whatsappApi = {
  setupCloudApi: (phoneNumberId: string, accessToken: string, appId?: string) =>
    api.post('/whatsapp/setup-cloudapi', { phoneNumberId, accessToken, appId }).then(r => r.data),
  setupEvolutionFallback: (evolutionApiUrl: string, evolutionApiKey: string, phoneNumber: string) =>
    api.post('/whatsapp/setup-evolution-fallback', { evolutionApiUrl, evolutionApiKey, phoneNumber }).then(r => r.data),
  embeddedSignup: (code: string) =>
    api.post('/whatsapp/embedded-signup', { code }).then(r => r.data as { phoneNumber: string }),
  clearUnanswered: () => api.post('/whatsapp/clear-unanswered').then(r => r.data),
  status: () => api.get('/whatsapp/status').then(r => r.data),
  // kept for backward compat
  setup: (phoneNumber: string) => api.post('/whatsapp/setup', { phoneNumber }).then(r => r.data),
}

export const knowledgeApi = {
  list: () => api.get('/knowledge').then(r => r.data),
  create: (data: any) => api.post('/knowledge', data).then(r => r.data),
  remove: (id: string) => api.delete(`/knowledge/${id}`).then(r => r.data),
  scrape: (url: string) => api.post('/knowledge/scrape', { url }).then(r => r.data),
  upload: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/knowledge/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },
}

export const conversationsApi = {
  list: (page = 1) => api.get('/conversations', { params: { page } }).then(r => r.data),
  stats: () => api.get('/conversations/stats').then(r => r.data),
}

export const templatesApi = {
  list: () => api.get('/templates').then(r => r.data),
  get: (id: string) => api.get(`/templates/${id}`).then(r => r.data),
  generateCustom: (description: string) =>
    api.post('/templates/custom/generate', { description }).then(r => r.data as {
      agentName: string
      greetingMessage: string
      systemPrompt: string
      sampleKnowledge: Array<{ title: string; content: string }>
    }),
}

export const billingApi = {
  plans: () => api.get('/billing/plans').then(r => r.data),
  checkout: (plan: string) => api.post(`/billing/checkout/${plan}`).then(r => r.data),
}

export const dashboardApi = {
  get: () => api.get('/dashboard').then(r => r.data),
}

export const supportApi = {
  chat: (messages: Array<{ role: 'user' | 'assistant'; content: string }>, currentStep?: string) =>
    api.post('/support/chat', { messages, currentStep }).then(r => r.data as { reply: string }),
}

export const calendarApi = {
  googleUrl: () => api.get('/calendar/google/url').then(r => r.data),
  setupBuiltin: (slotDurationMinutes: number) => api.post('/calendar/builtin/setup', { slotDurationMinutes }).then(r => r.data),
  getWorkingHours: () => api.get('/calendar/working-hours').then(r => r.data),
  saveWorkingHours: (hours: any[]) => api.post('/calendar/working-hours', { hours }).then(r => r.data),
  listAppointments: (from?: string, to?: string) => api.get('/calendar/appointments', { params: { from, to } }).then(r => r.data),
  listGoogleEvents: (from?: string, to?: string) => api.get('/calendar/google/events', { params: { from, to } }).then(r => r.data),
}
