import React, { useEffect, useState } from 'react';

// Versão de debug específica para iPhone com logs detalhados
function AppDebugIOS() {
  const [logs, setLogs] = useState<string[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<any>({});
  
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(`🍎 ${logEntry}`);
    setLogs(prev => [...prev, logEntry]);
  };
  
  useEffect(() => {
    addLog('AppDebugIOS iniciado');
    
    // Capturar informações do dispositivo
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenWidth: screen.width,
      screenHeight: screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window,
      localStorage: (() => {
        try {
          localStorage.setItem('test', 'test');
          localStorage.removeItem('test');
          return 'OK';
        } catch (e) {
          return `ERRO: ${e.message}`;
        }
      })(),
      sessionStorage: (() => {
        try {
          sessionStorage.setItem('test', 'test');
          sessionStorage.removeItem('test');
          return 'OK';
        } catch (e) {
          return `ERRO: ${e.message}`;
        }
      })()
    };
    
    setDeviceInfo(info);
    addLog('Informações do dispositivo coletadas');
    
    // Capturar erros globais
    const handleError = (event: ErrorEvent) => {
      addLog(`ERRO GLOBAL: ${event.message} em ${event.filename}:${event.lineno}`);
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addLog(`PROMISE REJEITADA: ${event.reason}`);
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Testar APIs críticas
    setTimeout(() => {
      addLog('Testando fetch API...');
      fetch('/vite.svg')
        .then(() => addLog('Fetch API: OK'))
        .catch(e => addLog(`Fetch API: ERRO - ${e.message}`));
    }, 1000);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  return (
    <div style={{
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '12px',
      backgroundColor: '#000',
      color: '#0f0',
      minHeight: '100vh',
      overflow: 'auto'
    }}>
      <h1 style={{ color: '#fff', marginBottom: '20px', fontSize: '16px' }}>🍎 iPhone Debug Console</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#111', borderRadius: '4px' }}>
        <h3 style={{ color: '#ff0', margin: '0 0 10px 0' }}>Informações do Dispositivo:</h3>
        {Object.entries(deviceInfo).map(([key, value]) => (
          <div key={key} style={{ margin: '2px 0' }}>
            <strong>{key}:</strong> {String(value)}
          </div>
        ))}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ff0', margin: '0 0 10px 0' }}>Logs de Debug:</h3>
        <div style={{ 
          maxHeight: '300px', 
          overflow: 'auto', 
          backgroundColor: '#111', 
          padding: '10px', 
          borderRadius: '4px'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{ margin: '2px 0', wordBreak: 'break-word' }}>
              {log}
            </div>
          ))}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => addLog('Botão de teste clicado')}
          style={{
            padding: '10px',
            backgroundColor: '#333',
            color: '#0f0',
            border: '1px solid #0f0',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Teste Click
        </button>
        
        <button 
          onClick={() => {
            addLog('Testando localStorage...');
            try {
              localStorage.setItem('debug-test', Date.now().toString());
              const value = localStorage.getItem('debug-test');
              addLog(`localStorage OK: ${value}`);
              localStorage.removeItem('debug-test');
            } catch (e) {
              addLog(`localStorage ERRO: ${e.message}`);
            }
          }}
          style={{
            padding: '10px',
            backgroundColor: '#333',
            color: '#0f0',
            border: '1px solid #0f0',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Teste Storage
        </button>
        
        <button 
          onClick={() => {
            addLog('Forçando erro para teste...');
            throw new Error('Erro de teste intencional');
          }}
          style={{
            padding: '10px',
            backgroundColor: '#333',
            color: '#f00',
            border: '1px solid #f00',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Forçar Erro
        </button>
      </div>
      
      <div style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#004400',
        borderRadius: '4px',
        fontSize: '10px'
      }}>
        ✅ Se você está vendo esta tela, o React está carregando no iPhone.<br/>
        📱 Use os botões acima para testar funcionalidades específicas.<br/>
        🔍 Verifique os logs para identificar problemas.
      </div>
    </div>
  );
}

export default AppDebugIOS;