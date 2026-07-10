import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Clock } from "lucide-react";
import { CustomTooltip } from "./CustomTooltip";

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
      <div className="flex items-center gap-3 mb-8">
        <Clock className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-foreground">Thời gian theo Ma trận Eisenhower</h3>
      </div>
      
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
      
      {/* Custom Legend */}
      <div className="flex flex-wrap gap-4 mt-6 justify-center">
        {matrixData.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
            {entry.name}
          </div>
        ))}
      </div>
    </div>
  );
}
