import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  isIPhone: boolean
  systemTheme: "dark" | "light"
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  isIPhone: false,
  systemTheme: "light"
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProviderIPhone({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  ...props
}: ThemeProviderProps) {
  // Detectar iPhone
  const isIPhone = /iPhone|iPod/.test(navigator.userAgent)
  
  // Detectar tema do sistema
  const getSystemTheme = (): "dark" | "light" => {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark"
    }
    return "light"
  }
  
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">(getSystemTheme)
  
  // Estado do tema com lógica específica para iPhone
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme
      
      // Se é iPhone e não há tema armazenado, usar 'system' por padrão
      if (isIPhone && !stored) {
        console.log('🍎 iPhone detectado - usando tema system por padrão')
        return "system"
      }
      
      return stored || defaultTheme
    } catch (error) {
      console.warn('⚠️ Erro ao acessar localStorage para tema:', error)
      // Se há erro no localStorage (modo privado), usar tema do sistema
      return isIPhone ? "system" : defaultTheme
    }
  })

  // Função para aplicar tema com correções específicas do iPhone
  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement
    
    // Remover classes existentes
    root.classList.remove("light", "dark")
    
    let effectiveTheme: "dark" | "light"
    
    if (newTheme === "system") {
      effectiveTheme = systemTheme
    } else {
      effectiveTheme = newTheme
    }
    
    // Aplicar nova classe
    root.classList.add(effectiveTheme)
    
    // Correções específicas para iPhone
    if (isIPhone) {
      // Forçar repaint para evitar tela branca
      root.style.display = 'none'
      root.offsetHeight // Trigger reflow
      root.style.display = ''
      
      // Garantir que as variáveis CSS sejam aplicadas
      setTimeout(() => {
        const computedStyle = window.getComputedStyle(root)
        const bgColor = computedStyle.getPropertyValue('--background')
        
        if (!bgColor || bgColor.trim() === '') {
          console.warn('⚠️ Variáveis CSS de tema não aplicadas, forçando...')
          root.classList.remove(effectiveTheme)
          setTimeout(() => {
            root.classList.add(effectiveTheme)
          }, 50)
        }
      }, 100)
      
      console.log(`🎨 iPhone - Tema aplicado: ${newTheme} (efetivo: ${effectiveTheme})`)
    }
  }

  // Effect para aplicar tema
  useEffect(() => {
    applyTheme(theme)
  }, [theme, systemTheme])

  // Effect para monitorar mudanças no tema do sistema
  useEffect(() => {
    if (!window.matchMedia) return
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? "dark" : "light"
      setSystemTheme(newSystemTheme)
      
      if (isIPhone) {
        console.log(`🌓 iPhone - Mudança no tema do sistema: ${newSystemTheme}`)
        
        // Se o tema atual é 'system', reaplicar
        if (theme === "system") {
          setTimeout(() => {
            applyTheme("system")
          }, 100)
        }
      }
    }
    
    mediaQuery.addEventListener("change", handleChange)
    
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme, isIPhone])

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

  // Função para definir tema com tratamento de erro
  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem(storageKey, newTheme)
    } catch (error) {
      console.warn('⚠️ Erro ao salvar tema no localStorage:', error)
      // Continuar mesmo se não conseguir salvar
    }
    
    setThemeState(newTheme)
    
    if (isIPhone) {
      console.log(`🍎 iPhone - Tema alterado para: ${newTheme}`)
    }
  }

  const value = {
    theme,
    setTheme,
    isIPhone,
    systemTheme
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

// Função de debug para iPhone
if (typeof window !== 'undefined') {
  (window as any).iPhoneThemeProviderDebug = {
    getThemeInfo: () => {
      const root = document.documentElement
      return {
        isIPhone: /iPhone|iPod/.test(navigator.userAgent),
        systemTheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
        rootClasses: Array.from(root.classList),
        cssVariables: {
          background: getComputedStyle(root).getPropertyValue('--background'),
          foreground: getComputedStyle(root).getPropertyValue('--foreground')
        },
        localStorage: (() => {
          try {
            return localStorage.getItem('theme')
          } catch {
            return 'erro-acesso'
          }
        })()
      }
    }
  }
}