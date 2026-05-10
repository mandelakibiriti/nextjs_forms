/**
 * FormForge Embed SDK
 *
 * Usage (script tag):
 *   <script src="https://cdn.formforge.io/embed.js"></script>
 *   <script>
 *     FormForge.init({
 *       container: '#my-form',
 *       formSlug: 'contact-us',
 *       apiUrl: 'https://api.formforge.io',
 *       onSubmit: (data) => console.log(data),
 *     })
 *   </script>
 *
 * Usage (ESM):
 *   import { init } from '@formforge/embed'
 *   init({ container: '#my-form', formSlug: 'contact-us', apiUrl: '...' })
 */

export interface EmbedOptions {
  /** CSS selector or HTMLElement where the form will be mounted */
  container: string | HTMLElement
  /** The form's slug (from FormForge API) */
  formSlug: string
  /** Base URL of the FormForge API */
  apiUrl: string
  /** Called with form data after successful submission */
  onSubmit?: (data: Record<string, unknown>) => void
  /** Called if the form fails to load */
  onError?: (error: Error) => void
  /** Height for the iframe (default: 600px) */
  height?: string | number
  /** Additional query params passed to the iframe URL */
  params?: Record<string, string>
}

export interface FormForgeInstance {
  /** Destroy the embed and clean up the DOM */
  destroy: () => void
  /** Get the current iframe element */
  getIframe: () => HTMLIFrameElement | null
}

const IFRAME_ORIGIN_KEY = '__ff_origin'

/**
 * Initialize a FormForge form embed in the given container.
 * Uses an iframe pointing to the FormForge renderer endpoint.
 */
export function init(options: EmbedOptions): FormForgeInstance {
  const {
    container,
    formSlug,
    apiUrl,
    onSubmit,
    onError,
    height = 600,
    params = {},
  } = options

  const root =
    typeof container === 'string'
      ? document.querySelector<HTMLElement>(container)
      : container

  if (!root) {
    const err = new Error(`FormForge: container "${container}" not found`)
    onError?.(err)
    return { destroy: () => {}, getIframe: () => null }
  }

  // Build iframe src URL
  const url = new URL(`${apiUrl}/embed/${formSlug}`)
  url.searchParams.set(IFRAME_ORIGIN_KEY, window.location.origin)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  const iframe = document.createElement('iframe')
  iframe.src = url.toString()
  iframe.style.width = '100%'
  iframe.style.height = typeof height === 'number' ? `${height}px` : height
  iframe.style.border = 'none'
  iframe.style.display = 'block'
  iframe.setAttribute('loading', 'lazy')
  iframe.setAttribute('allow', 'camera; microphone')
  iframe.setAttribute('title', `FormForge form: ${formSlug}`)

  root.appendChild(iframe)

  // Listen for postMessage from embedded iframe
  function handleMessage(event: MessageEvent) {
    // Only trust messages from our iframe's origin
    if (event.source !== iframe.contentWindow) return

    const msg = event.data as { type?: string; data?: Record<string, unknown>; height?: number }

    if (msg?.type === 'ff:submitted' && onSubmit) {
      onSubmit(msg.data ?? {})
    }

    if (msg?.type === 'ff:resize' && typeof msg.height === 'number') {
      iframe.style.height = `${msg.height}px`
    }

    if (msg?.type === 'ff:error' && onError) {
      onError(new Error('Form load error'))
    }
  }

  window.addEventListener('message', handleMessage)

  return {
    destroy() {
      window.removeEventListener('message', handleMessage)
      root.removeChild(iframe)
    },
    getIframe() {
      return iframe
    },
  }
}

/**
 * Web Component: <formforge-form slug="contact-us" api-url="https://..."></formforge-form>
 */
class FormForgeElement extends HTMLElement {
  private instance: FormForgeInstance | null = null

  static get observedAttributes() {
    return ['slug', 'api-url', 'height']
  }

  connectedCallback() {
    this.mount()
  }

  disconnectedCallback() {
    this.instance?.destroy()
    this.instance = null
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this.instance?.destroy()
      this.mount()
    }
  }

  private mount() {
    const slug = this.getAttribute('slug')
    const apiUrl = this.getAttribute('api-url')
    const height = this.getAttribute('height') ?? '600'

    if (!slug || !apiUrl) return

    this.instance = init({
      container: this,
      formSlug: slug,
      apiUrl,
      height,
      onSubmit: (data) => {
        this.dispatchEvent(new CustomEvent('ff-submit', { detail: data, bubbles: true }))
      },
    })
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('formforge-form')) {
  customElements.define('formforge-form', FormForgeElement)
}

// Default export for IIFE / window.FormForge
export default { init }
