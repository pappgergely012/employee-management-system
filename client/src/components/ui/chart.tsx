import React, { useEffect, useRef } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

interface ChartProps {
  title: string;
  description?: string;
  data: Array<any>;
  isLoading?: boolean;
  error?: Error | null;
  height?: number;
}

interface BarChartProps extends ChartProps {
  xAxisKey: string;
  bars: Array<{
    dataKey: string;
    fill: string;
    name?: string;
  }>;
}

export function BarChart({
  title,
  description,
  data,
  xAxisKey,
  bars,
  isLoading,
  error,
  height = 350,
}: BarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="w-full" style={{ height: `${height}px` }} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[350px] text-error">
            <AlertTriangle className="h-10 w-10 mb-2" />
            <p>Failed to load chart data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <RechartsBarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {bars.map((bar, index) => (
                <Bar key={index} dataKey={bar.dataKey} fill={bar.fill} name={bar.name || bar.dataKey} />
              ))}
            </RechartsBarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

interface LineChartProps extends ChartProps {
  xAxisKey: string;
  lines: Array<{
    dataKey: string;
    stroke: string;
    name?: string;
  }>;
}

export function LineChart({
  title,
  description,
  data,
  xAxisKey,
  lines,
  isLoading,
  error,
  height = 350,
}: LineChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="w-full" style={{ height: `${height}px` }} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[350px] text-error">
            <AlertTriangle className="h-10 w-10 mb-2" />
            <p>Failed to load chart data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <RechartsLineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {lines.map((line, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.stroke}
                  name={line.name || line.dataKey}
                  activeDot={{ r: 8 }}
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

interface PieChartProps extends ChartProps {
  dataKey: string;
  nameKey: string;
  colors: string[];
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
}

export function PieChart({
  title,
  description,
  data,
  dataKey,
  nameKey,
  colors,
  isLoading,
  error,
  innerRadius = 0,
  outerRadius = 80,
  paddingAngle = 0,
  height = 350,
}: PieChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="w-full" style={{ height: `${height}px` }} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[350px] text-error">
            <AlertTriangle className="h-10 w-10 mb-2" />
            <p>Failed to load chart data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={paddingAngle}
                dataKey={dataKey}
                nameKey={nameKey}
                label={(entry) => entry[nameKey]}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function DonutChart(props: PieChartProps) {
  return <PieChart {...props} innerRadius={60} />;
}
