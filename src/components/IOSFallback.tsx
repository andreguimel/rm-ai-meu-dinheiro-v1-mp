import React, { useState, useEffect } from "react";
import { AlertCircle, RefreshCw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  applySecureWebSocketConfig, 
  testWebSocketConnection, 
  detectIOSWebSocketIssues,
  createSecureWebSocket 
} from "@/utils/websocket-config";

interface IOSFallbackProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

// Detectar se é iOS/Safari
const isIOS = () => {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent;
  const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isWebKit = /WebKit/.test(userAgent);

  return isIOSDevice || (isSafari && isWebKit);
};

// Detectar se é iPhone físico (não simulador)
const isPhysicalIPhone = () => {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent;
  const isIPhone = /iPhone/.test(userAgent);
  const hasTouch = "ontouchstart" in window;

  return isIPhone && hasTouch;
};

// Função para forçar fallback HTTP quando WebSocket falha
const forceHTTPFallback = async () => {
  try {
    console.log('🔄 Aplicando fallback HTTP para WebSocket...');
    
    // Testar conectividade WebSocket primeiro
    const wsWorking = await testWebSocketConnection();
    
    if (!wsWorking) {
      console.log('❌ WebSocket não funciona, aplicando fallback');
      
      // Desabilita WebSocket temporariamente
      if (window.WebSocket) {
        (window as any).WebSocketBackup = window.WebSocket;
        (window as any).WebSocket = undefined;
      }
      
      // Configurar para usar polling
      const config = applySecureWebSocketConfig();
      config.ios.forcePolling = true;
      config.ios.disableWebSocket = true;
      
      // Salvar configuração no localStorage
      localStorage.setItem('__websocket_fallback', 'true');
      localStorage.setItem('__force_polling', 'true');
    }

    // Força reload para usar polling
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (e) {
    console.warn("Erro ao aplicar fallback HTTP:", e);
    // Fallback do fallback - apenas recarregar
    window.location.reload();
  }
};

// Função para restaurar WebSocket
const restoreWebSocket = () => {
  try {
    if ((window as any).WebSocketBackup) {
      (window as any).WebSocket = (window as any).WebSocketBackup;
      delete (window as any).WebSocketBackup;
    }
    
    // Limpar configurações de fallback
    localStorage.removeItem('__websocket_fallback');
    localStorage.removeItem('__force_polling');
    
    console.log('✅ WebSocket restaurado');
  } catch (e) {
    console.warn('Erro ao restaurar WebSocket:', e);
  }
};

// Função para verificar e aplicar configurações automáticas
const autoConfigureWebSocket = async () => {
  try {
    const config = applySecureWebSocketConfig();
    const iosIssues = detectIOSWebSocketIssues();
    
    // Se há problemas no iOS, aplicar configurações automáticas
    if (iosIssues.hasIssues) {
      console.log('🍎 Problemas iOS detectados, aplicando configurações automáticas');
      
      // Verificar se fallback já foi aplicado
      const fallbackApplied = localStorage.getItem('__websocket_fallback') === 'true';
      
      if (!fallbackApplied) {
        // Testar WebSocket primeiro
        const wsWorking = await testWebSocketConnection();
        
        if (!wsWorking) {
          console.log('🔄 Aplicando fallback automático');
          await forceHTTPFallback();
        }
      }
    }
    
    return config;
  } catch (e) {
    console.warn('Erro na configuração automática:', e);
    return null;
  }
};

// Detectar se está em modo privado do Safari
const isPrivateMode = async (): Promise<boolean> => {
  try {
    // Tentar usar localStorage
    const testKey = "__private_mode_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return false;
  } catch {
    return true;
  }
};

// Componente de erro específico para iOS
const IOSErrorFallback: React.FC<{
  error: Error;
  resetError: () => void;
  isPrivate: boolean;
}> = ({ error, resetError, isPrivate }) => {
  const isWebSocketError =
    error.message.includes("WebSocket") || error.message.includes("insecure");
  const isPhysicalDevice = isPhysicalIPhone();

  const handleReload = () => {
    window.location.reload();
  };

  const handleClearStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      console.warn("Não foi possível limpar o storage:", e);
      window.location.reload();
    }
  };

  const handleHTTPFallback = () => {
    forceHTTPFallback();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Problema no iOS/Safari
          </CardTitle>
          <CardDescription>
            {isWebSocketError && isPhysicalDevice
              ? "Detectamos um problema de WebSocket em iPhone físico. Isso é comum devido às restrições de segurança do Safari mobile."
              : isWebSocketError
              ? "Detectamos um problema de conexão WebSocket. Isso é comum no iOS quando a conexão não é segura."
              : isPrivate
              ? "Detectamos que você está usando o modo privado do Safari. Isso pode causar problemas de compatibilidade."
              : "Ocorreu um erro específico do iOS/Safari. Vamos tentar algumas soluções."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Erro:</strong> {error.message}
            </p>
            {isPrivate && (
              <p className="mt-2 text-amber-600">
                <strong>Dica:</strong> Tente sair do modo privado ou usar o
                Safari normal.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Button onClick={resetError} className="w-full" variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>

            <Button onClick={handleReload} className="w-full" variant="outline">
              <Smartphone className="mr-2 h-4 w-4" />
              Recarregar Página
            </Button>

            {!isPrivate && (
              <Button
                onClick={handleClearStorage}
                className="w-full"
                variant="secondary"
              >
                Limpar Cache e Recarregar
              </Button>
            )}

            {isWebSocketError && isPhysicalDevice && (
              <>
                <Button
                  onClick={handleHTTPFallback}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  variant="default"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Usar Modo Compatibilidade (iPhone)
                </Button>
                
                <Button
                  onClick={() => {
                    restoreWebSocket();
                    window.location.reload();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restaurar WebSocket
                </Button>
              </>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            <p>Se o problema persistir:</p>
            <ul className="mt-1 space-y-1 text-left">
              {isWebSocketError ? (
                <>
                  {isPhysicalDevice ? (
                    <>
                      <li>• Use o endereço de rede: http://192.168.0.5:8081</li>
                      <li>• Certifique-se de estar na mesma rede Wi-Fi</li>
                      <li>• Tente o botão "Modo Compatibilidade" acima</li>
                      <li>
                        • Desative o modo "Bloquear Rastreamento" no Safari
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        • Acesse http://localhost:8081 diretamente no Safari
                      </li>
                      <li>• Use o endereço de rede: http://192.168.0.5:8081</li>
                    </>
                  )}
                  <li>• Certifique-se de estar na mesma rede Wi-Fi</li>
                  <li>• Tente recarregar a página algumas vezes</li>
                </>
              ) : (
                <>
                  <li>• Atualize o Safari para a versão mais recente</li>
                  <li>• Tente usar o Chrome no iOS</li>
                  <li>• Desative o modo privado se estiver ativo</li>
                  <li>• Reinicie o dispositivo</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Error Boundary específico para iOS
class IOSErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<any> },
  { hasError: boolean; error: Error | null; isPrivate: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, isPrivate: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: any) {
    console.error("iOS Error Boundary capturou um erro:", error, errorInfo);

    // Verificar se está em modo privado
    const privateMode = await isPrivateMode();
    this.setState({ isPrivate: privateMode });

    // Log específico para iOS
    if (isIOS()) {
      console.error("🍎 Erro específico do iOS:", {
        error: error.message,
        stack: error.stack,
        userAgent: navigator.userAgent,
        isPrivateMode: privateMode,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
        },
      });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <IOSErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          isPrivate={this.state.isPrivate}
        />
      );
    }

    return this.props.children;
  }
}

// Componente principal IOSFallback
export const IOSFallback: React.FC<IOSFallbackProps> = ({
  children,
  fallbackMessage = "Carregando...",
}) => {
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isPrivateModeDetected, setIsPrivateModeDetected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkIOSAndPrivateMode = async () => {
      const iosDetected = isIOS();
      const privateMode = await isPrivateMode();

      setIsIOSDevice(iosDetected);
      setIsPrivateModeDetected(privateMode);

      if (iosDetected) {
        console.log("🍎 iOS detectado:", {
          userAgent: navigator.userAgent,
          isPrivateMode: privateMode,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        });
        
        // Aplicar configuração automática de WebSocket para iOS
        await autoConfigureWebSocket();
      } else {
        // Para outros dispositivos, apenas aplicar configuração básica
        applySecureWebSocketConfig();
      }
      
      setIsLoading(false);
    };

    checkIOSAndPrivateMode();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            {fallbackMessage}
          </p>
        </div>
      </div>
    );
  }

  // Se for iOS, usar Error Boundary específico
  if (isIOSDevice) {
    return (
      <IOSErrorBoundary fallback={IOSErrorFallback}>
        {children}
      </IOSErrorBoundary>
    );
  }

  // Se não for iOS, renderizar normalmente
  return <>{children}</>;
};

export default IOSFallback;