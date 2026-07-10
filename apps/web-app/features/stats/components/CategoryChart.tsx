import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Clock } from "lucide-react";
import { CustomTooltip } from "./CustomTooltip";

interface CategoryDataItem {
  name: string;
  value: number;
}

interface CategoryChartProps {
  categoryData: CategoryDataItem[];
}

export function CategoryChart({ categoryData }: CategoryChartProps) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
      <div className="flex items-center gap-3 mb-8">
        <Clock className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold text-foreground">Thời gian theo Danh mục (Category)</h3>
      </div>

      <div className="h-80 w-full">
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent)', opacity: 0.15 }} />
              <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            Chưa có dữ liệu danh mục
          </div>
        )}
      </div>
    </div>
  );
}
