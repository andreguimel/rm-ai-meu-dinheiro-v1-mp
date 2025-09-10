import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Image,
  Mail,
  Settings,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportData {
  chartData: any[];
  categoryData: any[];
  filteredTransactions: any[];
  currentPeriodData: any;
  previousPeriodData: any;
}

interface ProfessionalExportProps {
  data: ExportData;
  period: string;
}

interface ExportConfig {
  format: "pdf" | "excel" | "powerpoint";
  template: "executive" | "detailed" | "presentation" | "custom";
  includeCharts: boolean;
  includeInsights: boolean;
  includeTransactions: boolean;
  includeComparison: boolean;
  companyName: string;
  reportTitle: string;
  comments: string;
  logoUrl?: string;
}

export const ProfessionalExport: React.FC<ProfessionalExportProps> = ({
  data,
  period,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [config, setConfig] = useState<ExportConfig>({
    format: "pdf",
    template: "executive",
    includeCharts: true,
    includeInsights: true,
    includeTransactions: true,
    includeComparison: true,
    companyName: "Meu Dinheiro",
    reportTitle: `Relatório Financeiro - ${period}`,
    comments: "",
  });

  const { toast } = useToast();

  const templates = {
    executive: {
      name: "Executivo",
      description: "Resumo executivo com métricas principais e insights",
      sections: [
        "Resumo Executivo",
        "Métricas Principais",
        "Insights",
        "Recomendações",
      ],
    },
    detailed: {
      name: "Detalhado",
      description: "Análise completa com todos os dados e gráficos",
      sections: [
        "Capa",
        "Resumo",
        "Análise Detalhada",
        "Gráficos",
        "Transações",
        "Anexos",
      ],
    },
    presentation: {
      name: "Apresentação",
      description: "Formato otimizado para apresentações",
      sections: [
        "Slide de Abertura",
        "Principais Métricas",
        "Gráficos Visuais",
        "Conclusões",
      ],
    },
    custom: {
      name: "Personalizado",
      description: "Configure as seções manualmente",
      sections: ["Configurável pelo usuário"],
    },
  };

  const generateExecutiveReport = () => {
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
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${config.reportTitle}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background: #fff;
          }
          .container { max-width: 210mm; margin: 0 auto; padding: 20mm; }
          
          /* Header */
          .header { 
            border-bottom: 3px solid #f97316; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .logo { font-size: 24px; font-weight: bold; color: #f97316; }
          .report-info { text-align: right; }
          .report-title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .report-date { color: #666; font-size: 14px; }
          
          /* Executive Summary */
          .executive-summary {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
          }
          .summary-title { font-size: 24px; margin-bottom: 20px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .summary-card { text-align: center; }
          .summary-value { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
          .summary-label { font-size: 14px; opacity: 0.9; }
          
          /* Health Score */
          .health-score {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 30px;
            text-align: center;
          }
          .score-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: bold;
            color: white;
          }
          .score-excellent { background: linear-gradient(135deg, #10b981, #059669); }
          .score-good { background: linear-gradient(135deg, #f59e0b, #d97706); }
          .score-poor { background: linear-gradient(135deg, #ef4444, #dc2626); }
          
          /* Metrics Grid */
          .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 20px; 
            margin-bottom: 30px; 
          }
          .metric-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            background: #fff;
          }
          .metric-title { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
          .metric-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .metric-change { font-size: 12px; }
          .positive { color: #10b981; }
          .negative { color: #ef4444; }
          
          /* Insights */
          .insights {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin-bottom: 30px;
          }
          .insights-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #1e40af; }
          .insight-item { margin-bottom: 10px; padding-left: 20px; position: relative; }
          .insight-item:before { 
            content: "💡"; 
            position: absolute; 
            left: 0; 
            top: 0; 
          }
          
          /* Recommendations */
          .recommendations {
            background: #f0fdf4;
            border-left: 4px solid #22c55e;
            padding: 20px;
            margin-bottom: 30px;
          }
          .recommendations-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #15803d; }
          .recommendation-item { margin-bottom: 10px; padding-left: 20px; position: relative; }
          .recommendation-item:before { 
            content: "✅"; 
            position: absolute; 
            left: 0; 
            top: 0; 
          }
          
          /* Footer */
          .footer {
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            margin-top: 40px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          
          /* Print Styles */
          @media print {
            .container { padding: 10mm; }
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="logo">${config.companyName}</div>
            <div class="report-info">
              <div class="report-title">${config.reportTitle}</div>
              <div class="report-date">Gerado em ${new Date().toLocaleDateString(
                "pt-BR"
              )}</div>
            </div>
          </div>

          <!-- Executive Summary -->
          <div class="executive-summary">
            <div class="summary-title">Resumo Executivo - ${period}</div>
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
                <div class="summary-label">Saldo Líquido</div>
              </div>
            </div>
          </div>

          <!-- Health Score -->
          <div class="health-score">
            <h3>Score de Saúde Financeira</h3>
            <div class="score-circle ${
              healthScore >= 80
                ? "score-excellent"
                : healthScore >= 60
                ? "score-good"
                : "score-poor"
            }">
              ${healthScore}/100
            </div>
            <p><strong>${
              healthScore >= 80
                ? "Excelente"
                : healthScore >= 60
                ? "Boa"
                : "Precisa Atenção"
            }</strong></p>
            <p>Sua saúde financeira está ${
              healthScore >= 80
                ? "muito bem"
                : healthScore >= 60
                ? "em bom estado"
                : "precisando de atenção"
            }.</p>
          </div>

          <!-- Metrics Comparison -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-title">Crescimento de Receitas</div>
              <div class="metric-value ${
                receitasGrowth >= 0 ? "positive" : "negative"
              }">
                ${receitasGrowth >= 0 ? "+" : ""}${receitasGrowth.toFixed(1)}%
              </div>
              <div class="metric-change">vs ${period} anterior</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">Variação de Despesas</div>
              <div class="metric-value ${
                despesasGrowth <= 0 ? "positive" : "negative"
              }">
                ${despesasGrowth >= 0 ? "+" : ""}${despesasGrowth.toFixed(1)}%
              </div>
              <div class="metric-change">vs ${period} anterior</div>
            </div>
          </div>

          <!-- Insights -->
          <div class="insights">
            <div class="insights-title">Principais Insights</div>
            <div class="insight-item">
              ${
                currentPeriodData.saldo > 0
                  ? `Resultado positivo de R$ ${currentPeriodData.saldo.toLocaleString(
                      "pt-BR"
                    )} demonstra boa gestão financeira.`
                  : `Déficit de R$ ${Math.abs(
                      currentPeriodData.saldo
                    ).toLocaleString("pt-BR")} requer atenção imediata.`
              }
            </div>
            <div class="insight-item">
              ${
                receitasGrowth > 0
                  ? `Crescimento de ${receitasGrowth.toFixed(
                      1
                    )}% nas receitas indica tendência positiva.`
                  : `Queda nas receitas de ${Math.abs(receitasGrowth).toFixed(
                      1
                    )}% requer estratégias de recuperação.`
              }
            </div>
            <div class="insight-item">
              ${
                despesasGrowth < 5
                  ? `Controle eficiente de despesas com variação de apenas ${despesasGrowth.toFixed(
                      1
                    )}%.`
                  : `Aumento significativo de despesas (${despesasGrowth.toFixed(
                      1
                    )}%) precisa ser monitorado.`
              }
            </div>
          </div>

          <!-- Recommendations -->
          <div class="recommendations">
            <div class="recommendations-title">Recomendações Estratégicas</div>
            ${
              currentPeriodData.saldo < 0
                ? `
              <div class="recommendation-item">Implementar plano de redução de custos imediato</div>
              <div class="recommendation-item">Revisar e renegociar contratos de maior impacto</div>
            `
                : ""
            }
            ${
              receitasGrowth < 0
                ? `
              <div class="recommendation-item">Desenvolver estratégias para recuperação de receitas</div>
              <div class="recommendation-item">Analisar novos canais de geração de receita</div>
            `
                : ""
            }
            ${
              despesasGrowth > 10
                ? `
              <div class="recommendation-item">Implementar controles mais rigorosos de despesas</div>
              <div class="recommendation-item">Revisar processos de aprovação de gastos</div>
            `
                : ""
            }
            <div class="recommendation-item">Manter monitoramento contínuo das métricas financeiras</div>
            <div class="recommendation-item">Estabelecer metas claras para o próximo período</div>
          </div>

          ${
            config.comments
              ? `
            <!-- Comments -->
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <h3 style="margin-bottom: 15px;">Observações Adicionais</h3>
              <p>${config.comments}</p>
            </div>
          `
              : ""
          }

          <!-- Footer -->
          <div class="footer">
            <p>Relatório gerado automaticamente pelo ${config.companyName}</p>
            <p>Este documento contém informações confidenciais e deve ser tratado com sigilo apropriado.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const generateDetailedReport = () => {
    // Implementar relatório detalhado com gráficos e tabelas completas
    return (
      generateExecutiveReport() +
      `
      <div class="page-break"></div>
      <!-- Página 2: Análise Detalhada -->
      <div class="container">
        <h2>Análise Detalhada de Transações</h2>
        <!-- Tabela de transações -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left;">Data</th>
              <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left;">Descrição</th>
              <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left;">Categoria</th>
              <th style="border: 1px solid #d1d5db; padding: 12px; text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${data.filteredTransactions
              .slice(0, 20)
              .map(
                (t) => `
              <tr>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${new Date(
                  t.data
                ).toLocaleDateString("pt-BR")}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${
                  t.descricao
                }</td>
                <td style="border: 1px solid #d1d5db; padding: 8px;">${
                  t.categoria
                }</td>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; color: ${
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
    `
    );
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let htmlContent = "";

      switch (config.template) {
        case "executive":
          htmlContent = generateExecutiveReport();
          break;
        case "detailed":
          htmlContent = generateDetailedReport();
          break;
        case "presentation":
          htmlContent = generateExecutiveReport(); // Simplificado por agora
          break;
        default:
          htmlContent = generateExecutiveReport();
      }

      if (config.format === "pdf") {
        // Abrir em nova janela para impressão/PDF
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();

          setTimeout(() => {
            printWindow.print();
          }, 1000);
        }
      }

      toast({
        title: "Relatório profissional gerado!",
        description: `Relatório ${
          config.template
        } em formato ${config.format.toUpperCase()} está pronto.`,
      });

      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description:
          "Ocorreu um erro ao tentar gerar o relatório profissional.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
        >
          <FileText className="w-4 h-4 mr-2" />
          Relatório Profissional
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurar Relatório Profissional
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Modelo de Relatório</Label>
            <Select
              value={config.template}
              onValueChange={(value: any) =>
                setConfig({ ...config, template: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(templates).map(([key, template]) => (
                  <SelectItem key={key} value={key}>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Template Preview */}
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Seções incluídas:</h4>
                <ul className="text-sm space-y-1">
                  {templates[config.template].sections.map((section, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      {section}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <Input
                id="companyName"
                value={config.companyName}
                onChange={(e) =>
                  setConfig({ ...config, companyName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportTitle">Título do Relatório</Label>
              <Input
                id="reportTitle"
                value={config.reportTitle}
                onChange={(e) =>
                  setConfig({ ...config, reportTitle: e.target.value })
                }
              />
            </div>
          </div>

          {/* Content Options */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Conteúdo a Incluir</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={config.includeCharts}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, includeCharts: !!checked })
                  }
                />
                <Label
                  htmlFor="includeCharts"
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Gráficos e Visualizações
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeInsights"
                  checked={config.includeInsights}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, includeInsights: !!checked })
                  }
                />
                <Label
                  htmlFor="includeInsights"
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Insights e Análises
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTransactions"
                  checked={config.includeTransactions}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, includeTransactions: !!checked })
                  }
                />
                <Label
                  htmlFor="includeTransactions"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Lista de Transações
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeComparison"
                  checked={config.includeComparison}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, includeComparison: !!checked })
                  }
                />
                <Label
                  htmlFor="includeComparison"
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Comparação Temporal
                </Label>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Observações Adicionais (Opcional)</Label>
            <Textarea
              id="comments"
              placeholder="Adicione comentários ou observações que devem aparecer no relatório..."
              value={config.comments}
              onChange={(e) =>
                setConfig({ ...config, comments: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* Export Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            >
              {isExporting ? (
                <>Gerando...</>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Gerar Relatório
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
