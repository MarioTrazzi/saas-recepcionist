declare global {
  interface Window {
    FB: any
    fbAsyncInit: any
  }
}

const META_CONFIG_ID = '1672284410628170'

export function loadFacebookSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    const appId = import.meta.env.VITE_META_APP_ID
    if (!appId) {
      reject(new Error('VITE_META_APP_ID não configurado'))
      return
    }

    if (window.FB) {
      resolve()
      return
    }

    window.fbAsyncInit = () => {
      window.FB.init({ appId, cookie: true, xfbml: true, version: 'v22.0' })
      resolve()
    }

    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script')
      script.id = 'facebook-jssdk'
      script.src = 'https://connect.facebook.net/en_US/sdk.js'
      script.async = true
      script.defer = true
      script.onerror = () => reject(new Error('Falha ao carregar SDK do Facebook'))
      document.body.appendChild(script)
    }
  })
}

// Embedded Signup requires response_type=code — server exchanges code for token (no redirect_uri for JS SDK)
// NOTE: must be called synchronously within a user gesture (no await before this call)
// Preload the SDK with loadFacebookSDK() on component mount so FB is ready when user clicks
export function facebookEmbeddedSignup(): Promise<{ code: string } | null> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('SDK do Facebook não carregado. Aguarde um momento e tente novamente.'))
      return
    }
    // FB.login() called synchronously here — preserves user gesture context on mobile
    window.FB.login(
      (response: any) => {
        if (response.authResponse?.code) {
          resolve({ code: response.authResponse.code })
        } else {
          resolve(null)
        }
      },
      {
        config_id: META_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
      },
    )
  })
}
