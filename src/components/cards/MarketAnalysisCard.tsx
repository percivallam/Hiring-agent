import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import type { MarketAnalysisMessage } from '@/types';

interface MarketAnalysisCardProps {
  title: string;
  analysisType: MarketAnalysisMessage['analysisType'];
  data: MarketAnalysisMessage['data'];
  insights: string[];
  chartType?: MarketAnalysisMessage['chartType'];
  className?: string;
}

const COLORS = ['#d97706', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1'];

export function MarketAnalysisCard({
  title,
  analysisType,
  data,
  insights,
  chartType = 'bar',
  className
}: MarketAnalysisCardProps) {
  const renderChart = () => {
    if (!Array.isArray(data)) return null;

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#737373' }} />
              <YAxis tick={{ fontSize: 11, fill: '#737373' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e5e5' }}
              />
              <Bar dataKey="value" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'trend':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#737373' }} />
              <YAxis tick={{ fontSize: 11, fill: '#737373' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e5e5' }}
              />
              <Line type="monotone" dataKey="value" stroke="#d97706" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
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
      default:
        return null;
    }
  };

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
        <span className="text-xs text-neutral-500">
          {analysisType === 'distribution' ? '人才分布' : analysisType === 'supply_demand' ? '供需分析' : analysisType === 'trend' ? '趋势分析' : '竞争分析'}
        </span>
      </div>

      <div className="p-4">
        {renderChart()}

        {insights.length > 0 && (
          <div className="mt-4 space-y-2">
            {insights.map((insight, idx) => (
              <p key={idx} className="text-sm text-neutral-400 bg-neutral-800/50 p-2.5 rounded-lg border border-neutral-800">
                💡 {insight}
              </p>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
