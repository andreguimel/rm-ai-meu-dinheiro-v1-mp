import { useState, useEffect } from 'react';

export const IPhoneBasicDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('iPhone Basic: Componente carregado');
    
    // Simular carregamento mínimo
    const timer = setTimeout(() => {
      setLoading(false);
      console.log('iPhone Basic: Carregamento concluído');
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f9fafb', 
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ 
          maxWidth: '400px', 
          margin: '0 auto',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>Erro</h2>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f9fafb', 
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid #e5e7eb',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280' }}>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            💰 Meu Dinheiro
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Dashboard iPhone
          </p>
        </div>

        {/* Saldo Card */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>
                Saldo Atual
              </p>
              <p style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: '#059669',
                margin: 0
              }}>
                R$ 1.500,00
              </p>
            </div>
            <div style={{ fontSize: '32px' }}>💵</div>
          </div>
        </div>

        {/* Receitas Card */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>
                Receitas
              </p>
              <p style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: '#059669',
                margin: 0
              }}>
                R$ 5.000,00
              </p>
            </div>
            <div style={{ fontSize: '32px' }}>📈</div>
          </div>
        </div>

        {/* Despesas Card */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>
                Despesas
              </p>
              <p style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: '#dc2626',
                margin: 0
              }}>
                R$ 3.500,00
              </p>
            </div>
            <div style={{ fontSize: '32px' }}>📉</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={() => window.location.href = '/transacoes'}
            style={{
              backgroundColor: 'white',
              color: '#374151',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            📊 Ver Transações
          </button>
          
          <button 
            onClick={() => window.location.href = '/receitas'}
            style={{
              backgroundColor: 'white',
              color: '#374151',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            💰 Gerenciar Receitas
          </button>
          
          <button 
            onClick={() => window.location.href = '/despesas'}
            style={{
              backgroundColor: 'white',
              color: '#374151',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            💸 Gerenciar Despesas
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔄 Atualizar Dados
          </button>
        </div>

        {/* Debug Info */}
        <div style={{
          backgroundColor: '#dbeafe',
          padding: '12px',
          borderRadius: '6px',
          marginTop: '24px',
          textAlign: 'center'
        }}>
          <p style={{ 
            fontSize: '12px', 
            color: '#1e40af',
            margin: 0
          }}>
            Dashboard Ultra Básico para iPhone<br/>
            Sem hooks • Sem dependências • CSS inline
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};