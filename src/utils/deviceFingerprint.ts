/**
 * Device Fingerprinting Utility
 * Generates a stable device fingerprint for browser-based per-device access tracking
 * Replaces IP-based tracking with MAC address-like identifiers
 */

/**
 * Generate a canvas fingerprint for device identification
 */
async function getCanvasFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return 'no-canvas'
    
    // Set canvas size
    canvas.width = 200
    canvas.height = 50
    
    // Draw text with specific styling
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(0, 0, 100, 50)
    ctx.fillStyle = '#069'
    ctx.fillText('Browser Fingerprint', 2, 2)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('Device ID Generator', 4, 17)
    
    return canvas.toDataURL()
  } catch {
    return 'canvas-error'
  }
}

/**
 * Get WebGL fingerprint for device identification
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
    
    if (!gl) return 'no-webgl'
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (!debugInfo) return 'no-debug-info'
    
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    
    return `${vendor}~${renderer}`
  } catch {
    return 'webgl-error'
  }
}

/**
 * Detect available fonts (simplified version)
 */
async function detectFonts(): Promise<string> {
  const baseFonts = ['monospace', 'sans-serif', 'serif']
  const testFonts = [
    'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
    'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS',
    'Impact', 'Lucida Console'
  ]
  
  const detected: string[] = []
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return 'no-canvas'
  
  // Measure baseline widths
  const baseWidths = baseFonts.map(font => {
    ctx.font = `12px ${font}`
    return ctx.measureText('mmmmmmmmmmlli').width
  })
  
  // Test each font
  for (const font of testFonts) {
    let detected_font = false
    
    for (let i = 0; i < baseFonts.length; i++) {
      ctx.font = `12px '${font}', ${baseFonts[i]}`
      const width = ctx.measureText('mmmmmmmmmmlli').width
      
      // If width differs from base font, the font is likely available
      if (width !== baseWidths[i]) {
        detected_font = true
        break
      }
    }
    
    if (detected_font) {
      detected.push(font)
    }
  }
  
  return detected.join(',')
}

/**
 * Get audio context fingerprint
 */
async function getAudioFingerprint(): Promise<string> {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return 'no-audio'
    
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const analyser = context.createAnalyser()
    const gainNode = context.createGain()
    const scriptProcessor = context.createScriptProcessor(4096, 1, 1)
    
    gainNode.gain.value = 0 // Mute
    oscillator.type = 'triangle'
    oscillator.connect(analyser)
    analyser.connect(scriptProcessor)
    scriptProcessor.connect(gainNode)
    gainNode.connect(context.destination)
    
    oscillator.start(0)
    
    return new Promise((resolve) => {
      scriptProcessor.onaudioprocess = (event) => {
        const output = event.inputBuffer.getChannelData(0)
        const sum = output.reduce((acc, val) => acc + Math.abs(val), 0)
        oscillator.stop()
        scriptProcessor.disconnect()
        gainNode.disconnect()
        analyser.disconnect()
        oscillator.disconnect()
        context.close()
        
        resolve(sum.toString())
      }
    })
  } catch {
    return 'audio-error'
  }
}

/**
 * Generate a stable device fingerprint for browsers
 * Returns a pseudo-MAC address in format "XX:XX:XX:XX:XX:XX"
 */
export async function generateBrowserFingerprint(): Promise<string> {
  try {
    // Collect browser characteristics
    const fingerprint = {
      canvas: await getCanvasFingerprint(),
      webgl: getWebGLFingerprint(),
      audio: await getAudioFingerprint(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages?.join(',') || '',
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      memory: (navigator as any).deviceMemory || 'unknown',
      cores: navigator.hardwareConcurrency || 'unknown',
      touchSupport: navigator.maxTouchPoints || 0,
      plugins: Array.from(navigator.plugins || []).map(p => p.name).join(','),
      fonts: await detectFonts(),
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
      sessionStorage: typeof sessionStorage !== 'undefined',
      localStorage: typeof localStorage !== 'undefined',
      indexedDB: !!window.indexedDB,
      cpuClass: (navigator as any).cpuClass || 'unknown',
      doNotTrack: navigator.doNotTrack || 'unknown'
    }
    
    // Create a hash of all characteristics
    const fingerprintString = JSON.stringify(fingerprint)
    const hashBuffer = await crypto.subtle.digest('SHA-256', 
      new TextEncoder().encode(fingerprintString))
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    // Format as MAC address (first 12 hex chars)
    const macHex = hashHex.substring(0, 12)
    return macHex.match(/.{1,2}/g)?.join(':') || '00:00:00:00:00:00'
  } catch (error) {
    console.error('Error generating browser fingerprint:', error)
    // Fallback to a simpler method
    return generateSimpleFallbackId()
  }
}

/**
 * Simple fallback device ID generation
 * Uses localStorage-based UUID if fingerprinting fails
 */
function generateSimpleFallbackId(): string {
  try {
    let deviceId = localStorage.getItem('whso_device_id')
    
    if (!deviceId) {
      // Generate a UUID-like device ID
      deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
      
      localStorage.setItem('whso_device_id', deviceId)
    }
    
    // Convert to MAC-like format (first 12 chars)
    return deviceId.substring(0, 12).replace(/-/g, '').match(/.{1,2}/g)?.join(':') || '00:00:00:00:00:00'
  } catch {
    // If localStorage fails, generate a session-based ID
    return 'ff:ff:ff:ff:ff:ff'
  }
}

/**
 * Get or generate a persistent device MAC address
 * Caches the result in localStorage for consistency
 */
export async function getDeviceMacAddress(): Promise<string> {
  try {
    // Check if we already have a cached MAC address
    const cachedMac = localStorage.getItem('whso_device_mac')
    
    if (cachedMac) {
      return cachedMac
    }
    
    // Generate a new fingerprint
    const macAddress = await generateBrowserFingerprint()
    
    // Cache it for future use
    localStorage.setItem('whso_device_mac', macAddress)
    
    return macAddress
  } catch (error) {
    console.error('Error getting device MAC address:', error)
    return generateSimpleFallbackId()
  }
}

/**
 * Get additional device headers for fingerprinting
 */
export function getDeviceHeaders(): Record<string, string> {
  return {
    'X-Screen-Resolution': `${screen.width}x${screen.height}`,
    'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
    'X-Platform': navigator.platform,
    'X-User-Agent': navigator.userAgent,
    'X-Language': navigator.language
  }
}

/**
 * Clear cached device fingerprint (for testing or privacy)
 */
export function clearDeviceFingerprint(): void {
  try {
    localStorage.removeItem('whso_device_mac')
    localStorage.removeItem('whso_device_id')
  } catch {
    // Ignore errors
  }
}
