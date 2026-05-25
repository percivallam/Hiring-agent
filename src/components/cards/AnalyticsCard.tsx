import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { cn } from '@/lib/utils';
import type { ChartType } from '@/types';
import { FunnelChart } from './FunnelChart';
import { MetricGrid } from './MetricGrid';

interface AnalyticsCardProps {
  chartType: ChartType;
  title: string;
  data: any;
  insights?: string;
  className?: string;
}

const COLORS = ['#d97706', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

export function AnalyticsCard({
  chartType,
  title,
  data,
  insights,
  className
}: AnalyticsCardProps) {
  const renderChart = () => {
    switch (chartType) {
      case 'metric_grid':
        return <MetricGrid data={data} />;

      case 'funnel':
        return <FunnelChart data={data} />;

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#737373' }} />
              <YAxis tick={{ fontSize: 12, fill: '#737373' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e5e5' }}
              />
              <Bar dataKey="value" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e5e5' }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'trend':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#737373' }} />
              <YAxis tick={{ fontSize: 12, fill: '#737373' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e5e5' }}
              />
              <Line type="monotone" dataKey="hires" stroke="#d97706" strokeWidth={2} />
              <Line type="monotone" dataKey="offers" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (chartType === 'metric_grid') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <MetricGrid data={data} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden',
        className
      )}
    >
      <div className="p-4 border-b border-neutral-800">
        <h3 className="font-semibold text-neutral-100">{title}</h3>
      </div>
      <div className="p-4">
        {renderChart()}
        {insights && (
          <p className="mt-4 text-sm text-neutral-400 bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
            {insights}
          </p>
        )}
      </div>
    </motion.div>
  );
}
