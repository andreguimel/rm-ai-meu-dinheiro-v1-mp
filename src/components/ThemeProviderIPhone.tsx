import React, { createContext, useContext, useEffect, useState } from "react"

// Removido suporte ao modo dark - apenas modo claro
type Theme = "light"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  isIPhone: boolean
}

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
  isIPhone: false,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProviderIPhone({
  children,
  defaultTheme = "light",
  storageKey = "theme",
  ...props
}: ThemeProviderProps) {
  // Detectar iPhone
  const isIPhone = /iPhone|iPod/.test(navigator.userAgent)
  
  // Estado do tema - APENAS MODO CLARO
  const [theme, setThemeState] = useState<Theme>(() => {
    console.log('🍎🌞 iPhone detectado - forçando modo claro apenas')
    return "light"
  })

  // Função para aplicar tema - APENAS MODO CLARO
  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement
    const body = document.body
    
    // Remove qualquer classe de tema e força apenas light
    root.classList.remove("light", "dark")
    body.classList.remove("light", "dark")
    root.classList.add("light")
    body.classList.add("light")
    
    // Correções específicas para iPhone - APENAS MODO CLARO
    if (isIPhone) {
      // Força variáveis CSS para modo claro
      root.style.setProperty('--background', '#ffffff')
      root.style.setProperty('--foreground', '#000000')
      
      // Força meta theme-color para branco
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#ffffff')
      }
      
      // Forçar repaint para evitar tela branca
      root.style.display = 'none'
      root.offsetHeight // Trigger reflow
      root.style.display = ''
      
      console.log('🍎🌞 iPhone - Tema forçado para modo claro apenas')
    }
  }

  // Effect para aplicar tema - SEMPRE MODO CLARO
  useEffect(() => {
    applyTheme("light")
  }, [])

  // Effect específico para iPhone - monitoramento adicional
  useEffect(() => {
    if (!isIPhone) return
    
    // Verificação periódica para garantir que o tema está aplicado
    const interval = setInterval(() => {
      const root = document.documentElement
      const hasThemeClass = root.classList.contains('dark') || root.classList.contains('light')
      
      if (!hasThemeClass) {
        console.warn('⚠️ iPhone - Classe de tema perdida, reaplicando...')
        applyTheme(theme)
      }
    }, 2000)
    
    // Listener para mudanças de visibilidade (app volta do background)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ iPhone - App voltou ao foreground, verificando tema...')
        setTimeout(() => {
          applyTheme(theme)
        }, 100)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [theme, isIPhone])

  // Função para definir tema - SEMPRE MODO CLARO
  const setTheme = (newTheme: Theme) => {
    // Ignora qualquer tentativa de mudança - sempre modo claro
    console.log('🍎🌞 iPhone - Tentativa de mudança de tema ignorada, mantendo modo claro')
    setThemeState("light")
    applyTheme("light")
  }

  const value = {
    theme: "light" as Theme,
    setTheme,
    isIPhone
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useThemeIPhone = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useThemeIPhone must be used within a ThemeProviderIPhone")

  return context
}

// Função de debug para iPhone - MODO CLARO APENAS
if (typeof window !== 'undefined') {
  (window as any).iPhoneThemeProviderDebug = {
    getThemeInfo: () => {
      const root = document.documentElement
      return {
        isIPhone: /iPhone|iPod/.test(navigator.userAgent),
        forcedTheme: "light",
        rootClasses: Array.from(root.classList),
        cssVariables: {
          background: getComputedStyle(root).getPropertyValue('--background'),
          foreground: getComputedStyle(root).getPropertyValue('--foreground')
        },
        note: 'Tema forçado para modo claro apenas'
      }
    }
  }
}