import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LineChartData {
  name: string;
  value: number;
}

interface NativeLineChartProps {
  data: LineChartData[];
  title?: string;
  height?: number;
  width?: number;
  color?: string;
  showDots?: boolean;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
}

export const NativeLineChart: React.FC<NativeLineChartProps> = ({
  data,
  title,
  height = 300,
  width = 400,
  color = '#3b82f6',
  showDots = true,
  showGrid = true,
  formatValue = (value) => value.toString()
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        {title && (
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));
  const valueRange = maxValue - minValue || 1;
  
  const padding = 40;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);
  
  const stepX = chartWidth / (data.length - 1 || 1);
  
  // Generate path for the line
  const pathData = data.map((item, index) => {
    const x = padding + (index * stepX);
    const y = padding + chartHeight - ((item.value - minValue) / valueRange * chartHeight);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  // Generate grid lines
  const gridLines = [];
  if (showGrid) {
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      gridLines.push(
        <line
          key={`h-${i}`}
          x1={padding}
          y1={y}
          x2={padding + chartWidth}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth="1"
          opacity="0.5"
        />
      );
    }
    
    // Vertical grid lines
    for (let i = 0; i < data.length; i++) {
      const x = padding + (i * stepX);
      gridLines.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1={padding}
          x2={x}
          y2={padding + chartHeight}
          stroke="#e5e7eb"
          strokeWidth="1"
          opacity="0.3"
        />
      );
    }
  }

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg width={width} height={height} className="min-w-full">
            {/* Grid */}
            {gridLines}
            
            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Dots */}
            {showDots && data.map((item, index) => {
              const x = padding + (index * stepX);
              const y = padding + chartHeight - ((item.value - minValue) / valueRange * chartHeight);
              
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill={color}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:r-6 transition-all cursor-pointer"
                  />
                  {/* Tooltip on hover */}
                  <title>{`${item.name}: ${formatValue(item.value)}`}</title>
                </g>
              );
            })}
            
            {/* X-axis labels */}
            {data.map((item, index) => {
              const x = padding + (index * stepX);
              return (
                <text
                  key={`label-${index}`}
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6b7280"
                  className="select-none"
                >
                  {item.name.length > 8 ? `${item.name.substring(0, 8)}...` : item.name}
                </text>
              );
            })}
            
            {/* Y-axis labels */}
            {[0, 1, 2, 3, 4].map((i) => {
              const value = minValue + (valueRange / 4) * i;
              const y = padding + chartHeight - (chartHeight / 4) * i;
              return (
                <text
                  key={`y-label-${i}`}
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6b7280"
                  className="select-none"
                >
                  {formatValue(value)}
                </text>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};