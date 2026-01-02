import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { format } from 'date-fns';

interface ViewsOverTimeProps {
  data: { date: string; views: number }[];
}

export function ViewsChart({ data }: ViewsOverTimeProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => format(new Date(value), 'MMM d')}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact" }).format(value)}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))'
            }}
            itemStyle={{ color: 'hsl(var(--primary))' }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '0.5rem' }}
            labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
          />
          <Line 
            type="monotone" 
            dataKey="views" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface FormatPerformanceProps {
  data: { format: string; crps: number }[];
}

export function FormatChart({ data }: FormatPerformanceProps) {
  // Sort data by CRPS descending
  const sortedData = [...data].sort((a, b) => b.crps - a.crps);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="format" 
            type="category" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={80}
            tick={{ fill: 'hsl(var(--foreground))', fontWeight: 500 }}
          />
          <Tooltip 
            cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))'
            }}
            formatter={(value: number) => [value.toFixed(2), 'CRPS Score']}
          />
          <Bar dataKey="crps" radius={[0, 4, 4, 0]} barSize={32}>
            {sortedData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
