import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, BarChart3, TrendingUp, PieChart } from 'lucide-react';
import { NativeBarChart } from '@/components/charts/NativeBarChart';
import { NativeLineChart } from '@/components/charts/NativeLineChart';
import { NativePieChart } from '@/components/charts/NativePieChart';

interface ChartData {
  [key: string]: any;
}

interface IPhoneChartFallbackProps {
  data: ChartData[];
  type: 'bar' | 'line' | 'pie';
  title: string;
  dataKey?: string;
  xAxisKey?: string;
  children?: React.ReactNode;
  className?: string;
}

// Detectar se é iPhone físico
const isPhysicalIPhone = () => {
  const userAgent = navigator.userAgent;
  const isIPhone = /iPhone/.test(userAgent);
  const isPhysicalDevice = !window.navigator.standalone && 
                          !window.matchMedia('(display-mode: standalone)').matches &&
                          !/simulator|emulator/i.test(userAgent);
  return isIPhone && isPhysicalDevice;
};

// Componente de gráfico simplificado para iPhone
const SimpleChart: React.FC<{
  data: ChartData[];
  type: 'bar' | 'line' | 'pie';
  title: string;
  dataKey?: string;
  xAxisKey?: string;
}> = ({ data, type, title, dataKey = 'value', xAxisKey = 'name' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        <p>Sem dados para exibir</p>
      </div>
    );
  }

  // Encontrar valores máximo e mínimo para normalização
  const values = data.map(item => Number(item[dataKey]) || 0);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  if (type === 'bar') {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium mb-3">{title}</h4>
        <div className="space-y-2">
          {data.slice(0, 8).map((item, index) => {
            const value = Number(item[dataKey]) || 0;
            const percentage = ((value - minValue) / range) * 100;
            const displayValue = typeof value === 'number' ? 
              value.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }) : value;
            
            return (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-20 text-xs truncate">
                  {item[xAxisKey]}
                </div>
                <div className="flex-1 bg-muted rounded-full h-2 relative overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                  />
                </div>
                <div className="w-24 text-xs text-right font-medium">
                  {displayValue}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium mb-3">{title}</h4>
        <div className="grid grid-cols-2 gap-2">
          {data.slice(0, 6).map((item, index) => {
            const value = Number(item[dataKey]) || 0;
            const displayValue = typeof value === 'number' ? 
              value.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }) : value;
            
            return (
              <div key={index} className="p-2 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground truncate">
                  {item[xAxisKey]}
                </div>
                <div className="text-sm font-medium">
                  {displayValue}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'pie') {
    const total = values.reduce((sum, val) => sum + val, 0);
    
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium mb-3">{title}</h4>
        <div className="space-y-2">
          {data.slice(0, 6).map((item, index) => {
            const value = Number(item[dataKey]) || 0;
            const percentage = total > 0 ? (value / total) * 100 : 0;
            const displayValue = typeof value === 'number' ? 
              value.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }) : value;
            
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)` 
                    }}
                  />
                  <span className="text-xs truncate max-w-20">
                    {item[xAxisKey]}
                  </span>
                </div>
                <div className="text-xs font-medium">
                  {displayValue} ({percentage.toFixed(1)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

// Componente principal
export const IPhoneChartFallback: React.FC<IPhoneChartFallbackProps> = ({
  data,
  type,
  title,
  dataKey,
  xAxisKey,
  children,
  className
}) => {
  const [useSimpleChart, setUseSimpleChart] = useState(false);
  const [isIPhone, setIsIPhone] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const isPhysicalDevice = isPhysicalIPhone();
      setIsIPhone(isPhysicalDevice);
      
      // Usar gráfico simples automaticamente no iPhone físico
      if (isPhysicalDevice) {
        setUseSimpleChart(true);
        console.log('📱 iPhone físico detectado - usando gráficos otimizados');
      }
    };

    checkDevice();
  }, []);

  // Se não é iPhone ou usuário escolheu gráfico completo, renderizar children
  if (!isIPhone || (!useSimpleChart && children)) {
    return (
      <div className={className}>
        {isIPhone && (
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Smartphone className="w-3 h-3" />
              <span>iPhone detectado</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUseSimpleChart(!useSimpleChart)}
              className="h-6 px-2 text-xs"
            >
              {useSimpleChart ? 'Gráfico Completo' : 'Versão Simples'}
            </Button>
          </div>
        )}
        {useSimpleChart ? (
          <SimpleChart 
            data={data} 
            type={type} 
            title={title} 
            dataKey={dataKey} 
            xAxisKey={xAxisKey} 
          />
        ) : (
          children || (
            // Usar componentes nativos quando não há children
            type === 'bar' ? (
              <NativeBarChart
                data={data.map((item: any) => ({
                  name: item[xAxisKey || 'name'],
                  value: item[dataKey || 'value'],
                  color: '#3b82f6'
                }))}
                title={title}
                height={300}
                formatValue={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              />
            ) : type === 'line' ? (
              <NativeLineChart
                data={data.map((item: any) => ({
                  name: item[xAxisKey || 'name'],
                  value: item[dataKey || 'value']
                }))}
                title={title}
                height={300}
                color="#3b82f6"
                formatValue={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              />
            ) : type === 'pie' ? (
              <NativePieChart
                data={data.map((item: any, index: number) => ({
                  name: item[xAxisKey || 'name'],
                  value: item[dataKey || 'value'],
                  color: `hsl(${index * 45}, 70%, 50%)`
                }))}
                title={title}
                size={300}
                showLegend={true}
                showLabels={true}
                formatValue={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              />
            ) : null
          )
        )}
      </div>
    );
  }

  // Renderizar versão simplificada para iPhone
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Smartphone className="w-4 h-4" />
            <span>Versão iPhone</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUseSimpleChart(false)}
            className="h-6 px-2 text-xs"
          >
            Gráfico Completo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <SimpleChart 
          data={data} 
          type={type} 
          title={title} 
          dataKey={dataKey} 
          xAxisKey={xAxisKey} 
        />
      </CardContent>
    </Card>
  );
};

export default IPhoneChartFallback;