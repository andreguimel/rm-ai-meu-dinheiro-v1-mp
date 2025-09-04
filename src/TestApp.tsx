import React from "react";

function TestApp() {
  return (
    <div style={{ padding: "20px", fontSize: "24px", color: "blue" }}>
      <h1>🔧 Teste de Carregamento</h1>
      <p>Se você está vendo isso, a aplicação está carregando!</p>
      <p>Data: {new Date().toLocaleString()}</p>
    </div>
  );
}

export default TestApp;
