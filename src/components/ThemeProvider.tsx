import React, { createContext, useContext, useEffect } from "react"

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
}

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(
    () => "light" // Sempre força modo claro
  )

  useEffect(() => {
    const root = window.document.documentElement

    // Remove qualquer classe de tema e força apenas light
    root.classList.remove("light", "dark")
    root.classList.add("light")
    
    // Limpa qualquer tema armazenado que possa causar conflito
    try {
      localStorage.removeItem(storageKey)
      localStorage.setItem(storageKey, "light")
    } catch (error) {
      console.warn('Erro ao limpar tema do localStorage:', error)
    }
    
    console.log('🌞 Tema forçado para modo claro apenas')
  }, [theme, storageKey])

  const value = {
    theme: "light" as Theme,
    setTheme: (newTheme: Theme) => {
      // Ignora qualquer tentativa de mudar tema - sempre mantém light
      console.log('🚫 Tentativa de mudança de tema ignorada - modo claro forçado')
      localStorage.setItem(storageKey, "light")
      setTheme("light")
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}