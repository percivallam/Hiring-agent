import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RiskAnalysisMessage } from '@/types';

interface RiskAnalysisCardProps {
  candidateName: string;
  risks: RiskAnalysisMessage['risks'];
  overallRisk: 'high' | 'medium' | 'low';
  summary: string;
  className?: string;
}

export function RiskAnalysisCard({
  candidateName,
  risks,
  overallRisk,
  summary,
  className
}: RiskAnalysisCardProps) {
  const riskConfig = {
    high: { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: '高风险' },
    medium: { icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: '中等风险' },
    low: { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: '低风险' },
  };

  const config = riskConfig[overallRisk];
  const Icon = config.icon;

  const levelConfig = {
    high: 'text-red-400 bg-red-500/10 border-red-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
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
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-neutral-100">{candidateName} - 风险评估</h3>
          <span className={cn('px-3 py-1 rounded-full text-xs font-medium border', config.bg, config.color, config.border)}>
            <Icon className="w-3 h-3 inline mr-1" />
            {config.label}
          </span>
        </div>
      </div>

      <div className="divide-y divide-neutral-800">
        {risks.map((risk, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="p-4"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn(
                'px-2 py-0.5 rounded text-xs font-medium border',
                levelConfig[risk.level]
              )}>
                {risk.level === 'high' ? '高风险' : risk.level === 'medium' ? '中风险' : '低风险'}
              </span>
              <span className="text-sm font-medium text-neutral-300">{risk.category}</span>
            </div>
            <p className="text-sm text-neutral-400 mb-1">{risk.description}</p>
            {risk.suggestion && (
              <p className="text-xs text-neutral-500">💡 建议：{risk.suggestion}</p>
            )}
          </motion.div>
        ))}
      </div>

      <div className="p-4 bg-neutral-800/30 border-t border-neutral-800">
        <p className="text-sm text-neutral-300">{summary}</p>
      </div>
    </motion.div>
  );
}
