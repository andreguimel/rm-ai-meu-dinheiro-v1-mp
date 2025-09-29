import React, { Component, ErrorInfo, ReactNode } from 'react';
import { isIOS } from '../lib/ios-safe-utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza o state para mostrar a UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro para debugging
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log específico para iPhone
    if (isIOS()) {
      console.error('🍎 Erro capturado no iPhone:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    }

    // Tentar reportar o erro (opcional)
    try {
      // Aqui você pode adicionar integração com serviços de monitoramento
      // como Sentry, LogRocket, etc.
    } catch (reportError) {
      console.error('Falha ao reportar erro:', reportError);
    }
  }

  render() {
    if (this.state.hasError) {
      // UI de fallback customizada
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
            
            <h1 className="text-lg font-semibold text-gray-900 mb-2">
              Ops! Algo deu errado
            </h1>
            
            <p className="text-gray-600 mb-4">
              {isIOS() 
                ? "Detectamos um problema específico do iPhone. Estamos trabalhando para resolver isso."
                : "Ocorreu um erro inesperado. Por favor, recarregue a página."
              }
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-4 p-3 bg-gray-100 rounded text-sm">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <div className="text-xs text-gray-600 space-y-2">
                  <div>
                    <strong>Erro:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1 text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Recarregar página
              </button>
              
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                }}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Tentar novamente
              </button>
              
              {isIOS() && (
                <div className="text-xs text-gray-500 mt-4 p-2 bg-blue-50 rounded">
                  💡 <strong>Dica para iPhone:</strong> Tente fechar e reabrir o navegador Safari, 
                  ou use o modo privado se o problema persistir.
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;