// Templates de relatórios profissionais
export const ReportTemplates = {
  // Template Executivo - Foco em métricas e insights
  executive: {
    name: "Executivo",
    description: "Resumo executivo com métricas principais e insights",

    generateCSS: () => `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333;
          background: #fff;
        }
        .container { max-width: 210mm; margin: 0 auto; padding: 20mm; }
        
        /* Header Corporativo */
        .header { 
          border-bottom: 4px solid #f97316; 
          padding-bottom: 25px; 
          margin-bottom: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo { 
          font-size: 28px; 
          font-weight: bold; 
          background: linear-gradient(135deg, #f97316, #ea580c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .report-info { text-align: right; }
        .report-title { font-size: 32px; font-weight: bold; margin-bottom: 8px; color: #1f2937; }
        .report-subtitle { color: #6b7280; font-size: 16px; margin-bottom: 4px; }
        .report-date { color: #9ca3af; font-size: 14px; }
        
        /* Executive Summary Card */
        .executive-summary {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          padding: 40px;
          border-radius: 16px;
          margin-bottom: 40px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .summary-title { font-size: 28px; margin-bottom: 25px; font-weight: 600; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
        .summary-card { text-align: center; }
        .summary-value { font-size: 36px; font-weight: bold; margin-bottom: 8px; }
        .summary-label { font-size: 16px; opacity: 0.9; }
        
        /* Health Score */
        .health-score {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 35px;
          margin-bottom: 40px;
          text-align: center;
        }
        .score-circle {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          margin: 0 auto 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 42px;
          font-weight: bold;
          color: white;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .score-excellent { background: linear-gradient(135deg, #10b981, #059669); }
        .score-good { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .score-poor { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .score-description { font-size: 18px; color: #4b5563; margin-top: 10px; }
        
        /* Metrics Grid */
        .metrics-grid { 
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: 25px; 
          margin-bottom: 40px; 
        }
        .metric-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 25px;
          background: #fff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }
        .metric-card:hover { transform: translateY(-2px); }
        .metric-title { font-size: 16px; color: #6b7280; margin-bottom: 12px; font-weight: 500; }
        .metric-value { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
        .metric-change { font-size: 14px; }
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        
        /* Insights Section */
        .insights {
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border-left: 6px solid #3b82f6;
          padding: 30px;
          margin-bottom: 40px;
          border-radius: 0 12px 12px 0;
        }
        .insights-title { 
          font-size: 22px; 
          font-weight: bold; 
          margin-bottom: 20px; 
          color: #1e40af;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .insight-item { 
          margin-bottom: 15px; 
          padding: 15px 20px; 
          background: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          position: relative;
          padding-left: 50px;
        }
        .insight-item:before { 
          content: "💡"; 
          position: absolute; 
          left: 15px; 
          top: 15px;
          font-size: 20px;
        }
        
        /* Recommendations */
        .recommendations {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border-left: 6px solid #22c55e;
          padding: 30px;
          margin-bottom: 40px;
          border-radius: 0 12px 12px 0;
        }
        .recommendations-title { 
          font-size: 22px; 
          font-weight: bold; 
          margin-bottom: 20px; 
          color: #15803d;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .recommendation-item { 
          margin-bottom: 15px; 
          padding: 15px 20px; 
          background: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          position: relative;
          padding-left: 50px;
        }
        .recommendation-item:before { 
          content: "✅"; 
          position: absolute; 
          left: 15px; 
          top: 15px;
          font-size: 18px;
        }
        
        /* Comments Section */
        .comments-section {
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 40px;
        }
        .comments-title { 
          font-size: 20px; 
          font-weight: bold; 
          margin-bottom: 15px;
          color: #374151;
        }
        .comments-content { 
          font-size: 16px; 
          line-height: 1.7;
          color: #4b5563;
        }
        
        /* Footer */
        .footer {
          border-top: 2px solid #e5e7eb;
          padding-top: 25px;
          margin-top: 50px;
          text-align: center;
          color: #6b7280;
        }
        .footer-main { font-size: 14px; margin-bottom: 8px; }
        .footer-disclaimer { font-size: 12px; font-style: italic; }
        
        /* Print Styles */
        @media print {
          .container { padding: 15mm; }
          .page-break { page-break-before: always; }
          .no-print { display: none; }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .summary-grid { grid-template-columns: 1fr; gap: 20px; }
          .metrics-grid { grid-template-columns: 1fr; }
          .header { flex-direction: column; text-align: center; gap: 20px; }
        }
      </style>
    `,

    generateContent: (data: any, config: any) => {
      const { currentPeriodData, previousPeriodData } = data;

      // Calcular métricas
      const receitasGrowth =
        previousPeriodData.receitas > 0
          ? ((currentPeriodData.receitas - previousPeriodData.receitas) /
              previousPeriodData.receitas) *
            100
          : 0;
      const despesasGrowth =
        previousPeriodData.despesas > 0
          ? ((currentPeriodData.despesas - previousPeriodData.despesas) /
              previousPeriodData.despesas) *
            100
          : 0;

      // Calcular score de saúde financeira
      let healthScore = 50;
      if (currentPeriodData.saldo > 0) healthScore += 20;
      if (receitasGrowth > 0) healthScore += 15;
      if (despesasGrowth < 5) healthScore += 10;
      const ratio =
        currentPeriodData.receitas / (currentPeriodData.despesas || 1);
      if (ratio > 1.2) healthScore += 5;
      healthScore = Math.min(100, Math.max(0, healthScore));

      return `
        <div class="container">
          <!-- Header Corporativo -->
          <div class="header">
            <div class="logo">${config.companyName}</div>
            <div class="report-info">
              <div class="report-title">${config.reportTitle}</div>
              <div class="report-subtitle">Análise Financeira Executiva</div>
              <div class="report-date">Gerado em ${new Date().toLocaleDateString(
                "pt-BR",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}</div>
            </div>
          </div>

          <!-- Executive Summary -->
          <div class="executive-summary">
            <div class="summary-title">📊 Resumo Executivo - ${
              config.period
            }</div>
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-value">R$ ${currentPeriodData.receitas.toLocaleString(
                  "pt-BR"
                )}</div>
                <div class="summary-label">Total de Receitas</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">R$ ${currentPeriodData.despesas.toLocaleString(
                  "pt-BR"
                )}</div>
                <div class="summary-label">Total de Despesas</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">R$ ${currentPeriodData.saldo.toLocaleString(
                  "pt-BR"
                )}</div>
                <div class="summary-label">Resultado Líquido</div>
              </div>
            </div>
          </div>

          <!-- Health Score -->
          <div class="health-score">
            <h3 style="font-size: 24px; margin-bottom: 20px; color: #1f2937;">🎯 Score de Saúde Financeira</h3>
            <div class="score-circle ${
              healthScore >= 80
                ? "score-excellent"
                : healthScore >= 60
                ? "score-good"
                : "score-poor"
            }">
              ${healthScore}/100
            </div>
            <p style="font-size: 20px; font-weight: 600; color: #1f2937;">
              ${
                healthScore >= 80
                  ? "🟢 Excelente"
                  : healthScore >= 60
                  ? "🟡 Boa"
                  : "🔴 Precisa Atenção"
              }
            </p>
            <p class="score-description">
              ${
                healthScore >= 80
                  ? "Sua gestão financeira está exemplar, com indicadores muito positivos."
                  : healthScore >= 60
                  ? "Situação financeira estável, com oportunidades de melhoria identificadas."
                  : "Recomenda-se atenção imediata aos indicadores financeiros críticos."
              }
            </p>
          </div>

          <!-- Metrics Comparison -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-title">📈 Crescimento de Receitas</div>
              <div class="metric-value ${
                receitasGrowth >= 0 ? "positive" : "negative"
              }">
                ${receitasGrowth >= 0 ? "+" : ""}${receitasGrowth.toFixed(1)}%
              </div>
              <div class="metric-change">vs ${config.period} anterior</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">📉 Controle de Despesas</div>
              <div class="metric-value ${
                despesasGrowth <= 0 ? "positive" : "negative"
              }">
                ${despesasGrowth >= 0 ? "+" : ""}${despesasGrowth.toFixed(1)}%
              </div>
              <div class="metric-change">vs ${config.period} anterior</div>
            </div>
          </div>

          <!-- Insights -->
          <div class="insights">
            <div class="insights-title">
              🧠 Principais Insights
            </div>
            <div class="insight-item">
              <strong>Resultado Financeiro:</strong> 
              ${
                currentPeriodData.saldo > 0
                  ? `Resultado positivo de R$ ${currentPeriodData.saldo.toLocaleString(
                      "pt-BR"
                    )} demonstra gestão eficiente e sustentabilidade financeira.`
                  : `Déficit de R$ ${Math.abs(
                      currentPeriodData.saldo
                    ).toLocaleString(
                      "pt-BR"
                    )} requer implementação imediata de medidas corretivas.`
              }
            </div>
            <div class="insight-item">
              <strong>Tendência de Receitas:</strong> 
              ${
                receitasGrowth > 0
                  ? `Crescimento de ${receitasGrowth.toFixed(
                      1
                    )}% nas receitas indica momentum positivo e oportunidades de expansão.`
                  : `Declínio de ${Math.abs(receitasGrowth).toFixed(
                      1
                    )}% nas receitas demanda estratégias urgentes de recuperação e diversificação.`
              }
            </div>
            <div class="insight-item">
              <strong>Gestão de Custos:</strong> 
              ${
                despesasGrowth < 5
                  ? `Controle exemplar de despesas com variação de apenas ${despesasGrowth.toFixed(
                      1
                    )}%, demonstrando disciplina operacional.`
                  : `Aumento significativo de ${despesasGrowth.toFixed(
                      1
                    )}% nas despesas requer revisão imediata de processos e contratos.`
              }
            </div>
          </div>

          <!-- Recommendations -->
          <div class="recommendations">
            <div class="recommendations-title">
              🎯 Recomendações Estratégicas
            </div>
            ${
              currentPeriodData.saldo < 0
                ? `
              <div class="recommendation-item">
                <strong>Ação Imediata:</strong> Implementar plano emergencial de redução de custos e otimização de fluxo de caixa.
              </div>
              <div class="recommendation-item">
                <strong>Revisão Contratual:</strong> Renegociar contratos de maior impacto financeiro e eliminar gastos não essenciais.
              </div>
            `
                : ""
            }
            ${
              receitasGrowth < 0
                ? `
              <div class="recommendation-item">
                <strong>Estratégia de Receitas:</strong> Desenvolver iniciativas para diversificação e recuperação de receitas.
              </div>
              <div class="recommendation-item">
                <strong>Novos Mercados:</strong> Explorar canais alternativos de geração de receita e oportunidades de crescimento.
              </div>
            `
                : ""
            }
            ${
              despesasGrowth > 10
                ? `
              <div class="recommendation-item">
                <strong>Controle de Gastos:</strong> Estabelecer governança mais rigorosa para aprovação e monitoramento de despesas.
              </div>
            `
                : ""
            }
            <div class="recommendation-item">
              <strong>Monitoramento Contínuo:</strong> Implementar dashboard executivo para acompanhamento em tempo real das métricas críticas.
            </div>
            <div class="recommendation-item">
              <strong>Planejamento Estratégico:</strong> Definir metas quantificáveis e planos de ação para o próximo período fiscal.
            </div>
          </div>

          ${
            config.comments
              ? `
            <div class="comments-section">
              <div class="comments-title">📝 Observações Executivas</div>
              <div class="comments-content">${config.comments}</div>
            </div>
          `
              : ""
          }

          <!-- Footer -->
          <div class="footer">
            <div class="footer-main">
              <strong>Relatório gerado automaticamente pelo ${
                config.companyName
              }</strong>
            </div>
            <div class="footer-disclaimer">
              Este documento contém informações confidenciais e estratégicas. 
              Distribuição restrita à alta administração e stakeholders autorizados.
            </div>
          </div>
        </div>
      `;
    },
  },

  // Template Detalhado - Análise completa
  detailed: {
    name: "Detalhado",
    description: "Análise completa com todos os dados, gráficos e transações",

    generateContent: (data: any, config: any) => {
      // Usar o template executivo como base e adicionar seções detalhadas
      const executiveContent = ReportTemplates.executive.generateContent(
        data,
        config
      );

      const detailedSections = `
        <div class="page-break"></div>
        <div class="container">
          <h2 style="font-size: 28px; margin-bottom: 30px; color: #1f2937; border-bottom: 3px solid #f97316; padding-bottom: 10px;">
            📋 Análise Detalhada de Transações
          </h2>
          
          <!-- Resumo por Categoria -->
          <div style="margin-bottom: 40px;">
            <h3 style="font-size: 22px; margin-bottom: 20px; color: #374151;">💼 Distribuição por Categoria</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
              ${data.categoryData
                .slice(0, 6)
                .map(
                  (cat: any) => `
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #fff;">
                  <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${
                      cat.cor
                    };"></div>
                    <span style="font-weight: 600; font-size: 14px;">${
                      cat.categoria
                    }</span>
                  </div>
                  <div style="font-size: 18px; font-weight: bold; color: #ef4444;">
                    R$ ${cat.valor.toLocaleString("pt-BR")}
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <!-- Tabela de Transações -->
          <div style="margin-bottom: 40px;">
            <h3 style="font-size: 22px; margin-bottom: 20px; color: #374151;">📊 Principais Transações</h3>
            <table style="width: 100%; border-collapse: collapse; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: linear-gradient(135deg, #f97316, #ea580c); color: white;">
                  <th style="padding: 15px; text-align: left; font-weight: 600;">Data</th>
                  <th style="padding: 15px; text-align: left; font-weight: 600;">Descrição</th>
                  <th style="padding: 15px; text-align: left; font-weight: 600;">Categoria</th>
                  <th style="padding: 15px; text-align: right; font-weight: 600;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${data.filteredTransactions
                  .slice(0, 15)
                  .map(
                    (t: any, index: number) => `
                  <tr style="background: ${
                    index % 2 === 0 ? "#f9fafb" : "#fff"
                  }; border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; font-size: 14px;">${new Date(
                      t.data
                    ).toLocaleDateString("pt-BR")}</td>
                    <td style="padding: 12px; font-weight: 500;">${
                      t.descricao
                    }</td>
                    <td style="padding: 12px; font-size: 14px; color: #6b7280;">${
                      t.categoria
                    }</td>
                    <td style="padding: 12px; text-align: right; font-weight: 600; color: ${
                      t.tipo === "receita" ? "#10b981" : "#ef4444"
                    };">
                      ${t.tipo === "receita" ? "+" : "-"}R$ ${Math.abs(
                      t.valor
                    ).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;

      return executiveContent + detailedSections;
    },
  },
};

export default ReportTemplates;
