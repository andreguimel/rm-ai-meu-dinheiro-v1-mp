import React from 'react';

// Versão ultra-simplificada para debug de tela branca no iPhone
function AppSimple() {
  console.log('🍎 AppSimple carregado - iPhone Debug');
  
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>🍎 iPhone Debug</h1>
      <p style={{ color: '#666', textAlign: 'center', maxWidth: '300px' }}>Se você está vendo esta tela, o React está funcionando no iPhone.</p>
      
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Informações do Dispositivo:</h3>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>User Agent: {navigator.userAgent}</p>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>Largura: {window.innerWidth}px</p>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>Altura: {window.innerHeight}px</p>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>Touch: {('ontouchstart' in window) ? 'Sim' : 'Não'}</p>
      </div>
      
      <button 
        onClick={() => {
          console.log('🔍 Botão clicado - testando interatividade');
          alert('Botão funcionando! ✅');
        }}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#007AFF',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        Testar Interatividade
      </button>
      
      <div style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#e8f5e8',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#2d5a2d'
      }}>
        ✅ Se esta tela apareceu, o problema não é no React básico
      </div>
    </div>
  );
}

export default AppSimple;