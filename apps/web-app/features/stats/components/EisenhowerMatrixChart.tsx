import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Clock } from "lucide-react";
import { CustomTooltip } from "./CustomTooltip";
import { ChartHeader } from "./ChartHeader";
import { ChartLegend } from "./ChartLegend";
import { useTranslation } from "@/hooks/use-translation";

interface MatrixDataItem {
  name: string;
  value: number;
  color: string;
}

interface EisenhowerMatrixChartProps {
  matrixData: MatrixDataItem[];
}

export function EisenhowerMatrixChart({ matrixData }: EisenhowerMatrixChartProps) {
  const { t } = useTranslation();

  const translatedData = matrixData.map((item) => {
    let name = item.name;
    if (item.name.startsWith("Q1")) name = t.stats.q1Label;
    else if (item.name.startsWith("Q2")) name = t.stats.q2Label;
    else if (item.name.startsWith("Q3")) name = t.stats.q3Label;
    else if (item.name.startsWith("Q4")) name = t.stats.q4Label;
    return { ...item, name };
  });

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
      <ChartHeader
        title={t.stats.eisenhowerChart}
        icon={<Clock className="w-5 h-5 text-indigo-400" />}
      />
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={translatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              {translatedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <ChartLegend items={translatedData} />
    </div>
  );
}

