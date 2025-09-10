import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Image,
  Mail,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProfessionalExport } from "./ProfessionalExport";

interface ExportOptionsProps {
  data: {
    chartData: any[];
    categoryData: any[];
    filteredTransactions: any[];
    currentPeriodData: any;
    previousPeriodData: any;
  };
  period: string;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  data,
  period,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToCSV = () => {
    try {
      setIsExporting(true);

      // Preparar dados para CSV
      const csvHeader = "Data,Descrição,Categoria,Valor,Tipo\n";
      const csvData = data.filteredTransactions
        .map(
          (transaction: any) =>
            `${transaction.data},"${transaction.descricao}","${transaction.categoria}",${transaction.valor},${transaction.tipo}`
        )
        .join("\n");

      const csvContent = csvHeader + csvData;

      // Criar e baixar arquivo
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `relatorio-financeiro-${period}-${
          new Date().toISOString().split("T")[0]
        }.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Relatório CSV exportado!",
        description: "O arquivo foi baixado para seu computador.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar CSV",
        description: "Ocorreu um erro ao tentar exportar o relatório.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    try {
      setIsExporting(true);

      // Criar conteúdo HTML para PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório Financeiro - ${period}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .card h3 { margin: 0 0 10px 0; color: #333; }
            .card .value { font-size: 24px; font-weight: bold; }
            .green { color: #22c55e; }
            .red { color: #ef4444; }
            .blue { color: #3b82f6; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .footer { margin-top: 30px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório Financeiro</h1>
            <p>Período: ${period} | Data: ${new Date().toLocaleDateString(
        "pt-BR"
      )}</p>
          </div>
          
          <div class="summary">
            <div class="card">
              <h3>Total Receitas</h3>
              <div class="value green">R$ ${data.currentPeriodData.receitas.toLocaleString(
                "pt-BR"
              )}</div>
            </div>
            <div class="card">
              <h3>Total Despesas</h3>
              <div class="value red">R$ ${data.currentPeriodData.despesas.toLocaleString(
                "pt-BR"
              )}</div>
            </div>
            <div class="card">
              <h3>Saldo Total</h3>
              <div class="value ${
                data.currentPeriodData.saldo >= 0 ? "green" : "red"
              }">
                R$ ${data.currentPeriodData.saldo.toLocaleString("pt-BR")}
              </div>
            </div>
          </div>

          <h2>Transações</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Valor</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              ${data.filteredTransactions
                .map(
                  (t: any) => `
                <tr>
                  <td>${new Date(t.data).toLocaleDateString("pt-BR")}</td>
                  <td>${t.descricao}</td>
                  <td>${t.categoria}</td>
                  <td class="${t.tipo === "receita" ? "green" : "red"}">
                    R$ ${Math.abs(t.valor).toLocaleString("pt-BR")}
                  </td>
                  <td>${t.tipo}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="footer">
            <p>Relatório gerado automaticamente pelo Meu Dinheiro</p>
          </div>
        </body>
        </html>
      `;

      // Abrir em nova janela para impressão/PDF
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();

        // Aguardar carregamento e abrir diálogo de impressão
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      toast({
        title: "Relatório PDF preparado!",
        description: "Use Ctrl+P para salvar como PDF na janela que abriu.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao tentar gerar o PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = () => {
    try {
      setIsExporting(true);

      // Criar dados em formato TSV (Tab Separated Values) para Excel
      const headers = ["Data", "Descrição", "Categoria", "Valor", "Tipo"].join(
        "\t"
      );
      const rows = data.filteredTransactions
        .map((t: any) =>
          [
            new Date(t.data).toLocaleDateString("pt-BR"),
            t.descricao,
            t.categoria,
            t.valor,
            t.tipo,
          ].join("\t")
        )
        .join("\n");

      const tsvContent = headers + "\n" + rows;

      // Criar e baixar arquivo
      const blob = new Blob([tsvContent], {
        type: "text/tab-separated-values;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `relatorio-financeiro-${period}-${
          new Date().toISOString().split("T")[0]
        }.xls`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Relatório Excel exportado!",
        description: "O arquivo foi baixado para seu computador.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar Excel",
        description: "Ocorreu um erro ao tentar exportar o relatório.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const shareByEmail = () => {
    const subject = `Relatório Financeiro - ${period}`;
    const body = `
Olá!

Segue resumo do meu relatório financeiro do período: ${period}

📊 RESUMO:
• Receitas: R$ ${data.currentPeriodData.receitas.toLocaleString("pt-BR")}
• Despesas: R$ ${data.currentPeriodData.despesas.toLocaleString("pt-BR")}
• Saldo: R$ ${data.currentPeriodData.saldo.toLocaleString("pt-BR")}

📈 PRINCIPAIS TRANSAÇÕES:
${data.filteredTransactions
  .slice(0, 5)
  .map(
    (t: any) =>
      `• ${new Date(t.data).toLocaleDateString("pt-BR")} - ${
        t.descricao
      }: R$ ${t.valor.toLocaleString("pt-BR")} (${t.tipo})`
  )
  .join("\n")}

Relatório gerado pelo Meu Dinheiro
    `.trim();

    const mailtoLink = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);

    toast({
      title: "Email preparado!",
      description: "Seu cliente de email foi aberto com o relatório.",
    });
  };

  return (
    <div className="flex gap-2">
      {/* Relatório Profissional - Destaque */}
      <ProfessionalExport data={data} period={period} />

      {/* Exportações Simples */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isExporting}>
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exportando..." : "Exportar Simples"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={exportToCSV}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToPDF}>
            <FileText className="w-4 h-4 mr-2" />
            Exportar PDF Básico
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar Excel
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={shareByEmail}>
            <Mail className="w-4 h-4 mr-2" />
            Compartilhar por Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
