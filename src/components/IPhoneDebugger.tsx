import { useEffect, useState } from 'react';

interface DebugInfo {
  step: string;
  timestamp: string;
  error?: string;
  userAgent: string;
  isIPhone: boolean;
}

export const IPhoneDebugger = () => {
  const [debugLogs, setDebugLogs] = useState<DebugInfo[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const addLog = (step: string, error?: string) => {
    const log: DebugInfo = {
      step,
      timestamp: new Date().toISOString(),
      error,
      userAgent: navigator.userAgent,
      isIPhone: /iPhone/.test(navigator.userAgent) && !window.MSStream && 'ontouchstart' in window
    };
    
    setDebugLogs(prev => [...prev, log]);
    console.log('iPhone Debug:', log);
  };

  useEffect(() => {
    addLog('IPhoneDebugger: Componente montado');
    
    // Detectar se é iPhone
    const isIPhone = /iPhone/.test(navigator.userAgent) && !window.MSStream && 'ontouchstart' in window;
    if (isIPhone) {
      addLog('iPhone detectado - ativando debug');
      setIsVisible(true);
    }

    // Interceptar erros globais
    const handleError = (event: ErrorEvent) => {
      addLog('Erro JavaScript capturado', event.message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addLog('Promise rejeitada', event.reason?.toString());
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Testar APIs críticas
    try {
      addLog('Testando localStorage');
      localStorage.setItem('test', 'ok');
      localStorage.removeItem('test');
      addLog('localStorage: OK');
    } catch (e) {
      addLog('localStorage: ERRO', e instanceof Error ? e.message : 'Erro desconhecido');
    }

    try {
      addLog('Testando sessionStorage');
      sessionStorage.setItem('test', 'ok');
      sessionStorage.removeItem('test');
      addLog('sessionStorage: OK');
    } catch (e) {
      addLog('sessionStorage: ERRO', e instanceof Error ? e.message : 'Erro desconhecido');
    }

    try {
      addLog('Testando fetch API');
      fetch('/manifest.json').then(() => {
        addLog('fetch API: OK');
      }).catch(e => {
        addLog('fetch API: ERRO', e.message);
      });
    } catch (e) {
      addLog('fetch API: ERRO', e instanceof Error ? e.message : 'Erro desconhecido');
    }

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '20px',
      fontSize: '12px',
      fontFamily: 'monospace',
      overflow: 'auto',
      zIndex: 9999
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h2>🐛 iPhone Debug Console</h2>
        <button 
          onClick={() => setIsVisible(false)}
          style={{
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            padding: '10px',
            borderRadius: '5px',
            marginLeft: '10px'
          }}
        >
          Fechar Debug
        </button>
        <button 
          onClick={() => {
            const logs = JSON.stringify(debugLogs, null, 2);
            navigator.clipboard?.writeText(logs).catch(() => {
              // Fallback se clipboard não funcionar
              console.log('Debug Logs:', logs);
            });
          }}
          style={{
            backgroundColor: '#4444ff',
            color: 'white',
            border: 'none',
            padding: '10px',
            borderRadius: '5px',
            marginLeft: '10px'
          }}
        >
          Copiar Logs
        </button>
      </div>
      
      <div>
        <h3>Logs de Debug:</h3>
        {debugLogs.map((log, index) => (
          <div key={index} style={{ 
            marginBottom: '10px', 
            padding: '5px',
            backgroundColor: log.error ? '#ff4444' : '#444',
            borderRadius: '3px'
          }}>
            <div><strong>{log.timestamp}</strong></div>
            <div>{log.step}</div>
            {log.error && <div style={{ color: '#ffaaaa' }}>Erro: {log.error}</div>}
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Informações do Sistema:</h3>
        <div>User Agent: {navigator.userAgent}</div>
        <div>É iPhone: {/iPhone/.test(navigator.userAgent) ? 'Sim' : 'Não'}</div>
        <div>Suporte Touch: {'ontouchstart' in window ? 'Sim' : 'Não'}</div>
        <div>Viewport: {window.innerWidth}x{window.innerHeight}</div>
        <div>Memory: {(performance as any).memory ? JSON.stringify((performance as any).memory) : 'N/A'}</div>
      </div>
    </div>
  );
};