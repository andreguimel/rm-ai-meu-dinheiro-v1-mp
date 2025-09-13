import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface NativePieChartProps {
  data: PieChartData[];
  title?: string;
  size?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  formatValue?: (value: number) => string;
}

export const NativePieChart: React.FC<NativePieChartProps> = ({
  data,
  title,
  size = 300,
  showLegend = true,
  showLabels = true,
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

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
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

  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2;
  
  let currentAngle = -90; // Start from top
  
  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const color = item.color || colors[index % colors.length];
    
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    // Calculate label position
    const labelAngle = startAngle + angle / 2;
    const labelAngleRad = (labelAngle * Math.PI) / 180;
    const labelRadius = radius * 0.7;
    const labelX = centerX + labelRadius * Math.cos(labelAngleRad);
    const labelY = centerY + labelRadius * Math.sin(labelAngleRad);
    
    currentAngle += angle;
    
    return {
      path: pathData,
      color,
      percentage,
      name: item.name,
      value: item.value,
      labelX,
      labelY,
      showLabel: percentage > 5 // Only show label if slice is bigger than 5%
    };
  });

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Pie Chart */}
          <div className="flex-shrink-0">
            <svg width={size} height={size} className="drop-shadow-sm">
              {slices.map((slice, index) => (
                <g key={index}>
                  <path
                    d={slice.path}
                    fill={slice.color}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    style={{
                      transformOrigin: `${centerX}px ${centerY}px`,
                      animation: `fadeIn 0.6s ease-out ${index * 0.1}s both`
                    }}
                  >
                    <title>{`${slice.name}: ${formatValue(slice.value)} (${slice.percentage.toFixed(1)}%)`}</title>
                  </path>
                  
                  {/* Labels on slices */}
                  {showLabels && slice.showLabel && (
                    <text
                      x={slice.labelX}
                      y={slice.labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="12"
                      fill="white"
                      fontWeight="bold"
                      className="select-none pointer-events-none drop-shadow-sm"
                    >
                      {slice.percentage.toFixed(0)}%
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>
          
          {/* Legend */}
          {showLegend && (
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              {slices.map((slice, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div
                    className="w-4 h-4 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {slice.name}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {formatValue(slice.value)} ({slice.percentage.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* CSS Animation */}
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </CardContent>
    </Card>
  );
};