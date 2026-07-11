import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Clock } from "lucide-react";
import { CustomTooltip } from "./CustomTooltip";
import { ChartHeader } from "./ChartHeader";
import { ChartLegend } from "./ChartLegend";

interface MatrixDataItem {
  name: string;
  value: number;
  color: string;
}

interface EisenhowerMatrixChartProps {
  matrixData: MatrixDataItem[];
}

export function EisenhowerMatrixChart({ matrixData }: EisenhowerMatrixChartProps) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
      <ChartHeader
        title="Thời gian theo Ma trận Eisenhower"
        icon={<Clock className="w-5 h-5 text-indigo-400" />}
      />
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={matrixData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="var(--muted-foreground)" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => value.split(':')[0]} // Just show Q1, Q2, etc. on X axis
            />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent)', opacity: 0.15 }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {matrixData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <ChartLegend items={matrixData} />
    </div>
  );
}

