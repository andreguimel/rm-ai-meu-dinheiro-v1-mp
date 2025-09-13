import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Eye, Palette, Smartphone } from 'lucide-react'

interface ThemeInfo {
  isIPhone: boolean
  systemTheme: 'dark' | 'light'
  storedTheme: string | null
  appliedTheme: string
  rootClasses: string[]
  cssVariables: {
    background: string
    foreground: string
    [key: string]: string
  }
  invisibleElements: number
  hasThemeConflict: boolean
}

export function IPhoneThemeDiagnostic() {
  const [themeInfo, setThemeInfo] = useState<ThemeInfo | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Função para coletar informações do tema
  const collectThemeInfo = (): ThemeInfo => {
    const isIPhone = /iPhone|iPod/.test(navigator.userAgent)
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    
    let storedTheme: string | null = null
    try {
      storedTheme = localStorage.getItem('theme')
    } catch (error) {
      storedTheme = 'erro-localStorage'
    }
    
    const root = document.documentElement
    const rootClasses = Array.from(root.classList)
    
    let appliedTheme = 'nenhum'
    if (rootClasses.includes('dark')) appliedTheme = 'dark'
    else if (rootClasses.includes('light')) appliedTheme = 'light'
    
    const cssVariables = {
      background: getComputedStyle(root).getPropertyValue('--background').trim(),
      foreground: getComputedStyle(root).getPropertyValue('--foreground').trim(),
      card: getComputedStyle(root).getPropertyValue('--card').trim(),
      border: getComputedStyle(root).getPropertyValue('--border').trim()
    }
    
    // Contar elementos potencialmente invisíveis
    const allElements = document.querySelectorAll('*')
    let invisibleElements = 0
    
    allElements.forEach(el => {
      const style = window.getComputedStyle(el)
      if (style.color === 'transparent' || 
          style.backgroundColor === 'transparent' ||
          style.opacity === '0' ||
          style.visibility === 'hidden') {
        invisibleElements++
      }
    })
    
    // Detectar conflitos
    const hasThemeConflict = (
      (storedTheme === 'system' && appliedTheme !== systemTheme) ||
      (storedTheme && storedTheme !== 'system' && appliedTheme !== storedTheme) ||
      !cssVariables.background ||
      !cssVariables.foreground
    )
    
    return {
      isIPhone,
      systemTheme,
      storedTheme,
      appliedTheme,
      rootClasses,
      cssVariables,
      invisibleElements,
      hasThemeConflict
    }
  }

  // Função para atualizar informações
  const updateThemeInfo = () => {
    setThemeInfo(collectThemeInfo())
  }

  // Função para forçar sincronização do tema
  const forceSyncTheme = () => {
    const info = collectThemeInfo()
    const root = document.documentElement
    
    // Remover classes existentes
    root.classList.remove('light', 'dark')
    
    // Determinar tema correto
    let correctTheme: 'light' | 'dark'
    if (info.storedTheme === 'system' || !info.storedTheme) {
      correctTheme = info.systemTheme
    } else {
      correctTheme = info.storedTheme as 'light' | 'dark'
    }
    
    // Aplicar tema correto
    root.classList.add(correctTheme)
    
    // Forçar repaint
    root.style.display = 'none'
    root.offsetHeight
    root.style.display = ''
    
    console.log(`🔄 Tema sincronizado forçadamente: ${correctTheme}`)
    
    // Atualizar informações após um delay
    setTimeout(updateThemeInfo, 200)
  }

  // Função para limpar e resetar tema
  const resetTheme = () => {
    try {
      localStorage.removeItem('theme')
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      
      // Aplicar tema do sistema
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
      
      console.log('🔄 Tema resetado para sistema')
      setTimeout(updateThemeInfo, 200)
    } catch (error) {
      console.error('Erro ao resetar tema:', error)
    }
  }

  // Effect para auto-refresh
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(updateThemeInfo, 2000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  // Effect inicial
  useEffect(() => {
    updateThemeInfo()
  }, [])

  // Só mostrar no iPhone ou quando forçado
  const shouldShow = themeInfo?.isIPhone || isVisible

  if (!shouldShow) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-orange-500 text-white border-orange-600 hover:bg-orange-600"
      >
        <Smartphone className="w-4 h-4 mr-2" />
        Debug Tema
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 shadow-lg border-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <Palette className="w-4 h-4 mr-2" />
            Diagnóstico de Tema
          </div>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3 text-xs">
        {/* Status Geral */}
        <div className="flex items-center justify-between">
          <span>Status:</span>
          <Badge variant={themeInfo?.hasThemeConflict ? "destructive" : "default"}>
            {themeInfo?.hasThemeConflict ? "Conflito" : "OK"}
          </Badge>
        </div>
        
        {/* Informações do Dispositivo */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>iPhone:</span>
            <Badge variant={themeInfo?.isIPhone ? "default" : "secondary"}>
              {themeInfo?.isIPhone ? "Sim" : "Não"}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span>Sistema:</span>
            <Badge variant="outline">
              {themeInfo?.systemTheme}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span>Armazenado:</span>
            <Badge variant="outline">
              {themeInfo?.storedTheme || "nenhum"}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span>Aplicado:</span>
            <Badge variant={themeInfo?.appliedTheme === "nenhum" ? "destructive" : "default"}>
              {themeInfo?.appliedTheme}
            </Badge>
          </div>
        </div>
        
        {/* Variáveis CSS */}
        <div className="space-y-1">
          <div className="font-medium">Variáveis CSS:</div>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Background:</span>
              <span className={themeInfo?.cssVariables.background ? "text-green-600" : "text-red-600"}>
                {themeInfo?.cssVariables.background ? "✓" : "✗"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Foreground:</span>
              <span className={themeInfo?.cssVariables.foreground ? "text-green-600" : "text-red-600"}>
                {themeInfo?.cssVariables.foreground ? "✓" : "✗"}
              </span>
            </div>
          </div>
        </div>
        
        {/* Elementos Invisíveis */}
        {themeInfo && themeInfo.invisibleElements > 0 && (
          <div className="flex justify-between">
            <span>Elementos invisíveis:</span>
            <Badge variant="destructive">
              {themeInfo.invisibleElements}
            </Badge>
          </div>
        )}
        
        {/* Ações */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex gap-2">
            <Button
              onClick={updateThemeInfo}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Atualizar
            </Button>
            
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              className="flex-1"
            >
              <Eye className="w-3 h-3 mr-1" />
              Auto
            </Button>
          </div>
          
          <Button
            onClick={forceSyncTheme}
            variant="default"
            size="sm"
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            Forçar Sincronização
          </Button>
          
          <Button
            onClick={resetTheme}
            variant="destructive"
            size="sm"
            className="w-full"
          >
            Resetar Tema
          </Button>
        </div>
        
        {/* Debug Info */}
        <details className="text-xs">
          <summary className="cursor-pointer font-medium">Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
            {JSON.stringify(themeInfo, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  )
}

// Hook para usar o diagnóstico
export function useIPhoneThemeDiagnostic() {
  const [isEnabled, setIsEnabled] = useState(false)
  
  useEffect(() => {
    // Habilitar automaticamente no iPhone ou em desenvolvimento
    const isIPhone = /iPhone|iPod/.test(navigator.userAgent)
    const isDev = process.env.NODE_ENV === 'development'
    
    if (isIPhone || isDev) {
      setIsEnabled(true)
    }
  }, [])
  
  return {
    isEnabled,
    enable: () => setIsEnabled(true),
    disable: () => setIsEnabled(false)
  }
}