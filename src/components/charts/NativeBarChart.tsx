import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BarChartData {
  name: string;
  value: number;
  color?: string;
}

interface NativeBarChartProps {
  data: BarChartData[];
  title?: string;
  height?: number;
  showValues?: boolean;
  formatValue?: (value: number) => string;
}

export const NativeBarChart: React.FC<NativeBarChartProps> = ({
  data,
  title,
  height = 300,
  showValues = true,
  formatValue = (value) => value.toString()
}) => {
  const maxValue = Math.max(...data.map(item => item.value));
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="w-full" style={{ height: `${height}px` }}>
          <div className="flex items-end justify-between h-full gap-2 px-4 py-4">
            {data.map((item, index) => {
              const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 80) : 0;
              const color = item.color || colors[index % colors.length];
              
              return (
                <div key={item.name} className="flex flex-col items-center flex-1 max-w-20">
                  <div className="flex flex-col items-center justify-end h-full">
                    {showValues && (
                      <div className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                        {formatValue(item.value)}
                      </div>
                    )}
                    <div
                      className="w-full rounded-t-md transition-all duration-300 hover:opacity-80 min-h-1"
                      style={{
                        height: `${barHeight}px`,
                        backgroundColor: color,
                        minHeight: item.value > 0 ? '4px' : '0px'
                      }}
                      title={`${item.name}: ${formatValue(item.value)}`}
                    />
                  </div>
                  <div className="mt-2 text-xs text-center text-gray-700 dark:text-gray-300 break-words">
                    {item.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};