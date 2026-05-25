import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Award, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OfferPackageMessage } from '@/types';

interface OfferPackageCardProps {
  candidateName: string;
  position: string;
  components: OfferPackageMessage['components'];
  totalValue: string;
  competitiveness: OfferPackageMessage['competitiveness'];
  sellPoints: string[];
  risks?: string[];
  className?: string;
}

export function OfferPackageCard({
  candidateName,
  position,
  components,
  totalValue,
  competitiveness,
  sellPoints,
  risks,
  className
}: OfferPackageCardProps) {
  const compConfig = {
    above_market: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: '高于市场' },
    market: { icon: Minus, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: '市场水平' },
    below_market: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: '低于市场' },
  };

  const config = compConfig[competitiveness];
  const Icon = config.icon;

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
          <div>
            <h3 className="font-semibold text-neutral-100">Offer方案</h3>
            <p className="text-xs text-neutral-500 mt-1">{candidateName} · {position}</p>
          </div>
          <span className={cn('px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1', config.bg, config.color, config.border)}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {components.map((comp, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center justify-between"
          >
            <span className="text-sm text-neutral-400">{comp.name}</span>
            <div className="text-right">
              <span className="text-sm font-medium text-neutral-200">{comp.value}</span>
              {comp.note && <p className="text-xs text-neutral-500">{comp.note}</p>}
            </div>
          </motion.div>
        ))}

        <div className="pt-3 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-300">首年总包</span>
            <span className="text-lg font-semibold text-emerald-400">{totalValue}</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-neutral-800/30 border-t border-neutral-800">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-neutral-300">核心卖点</span>
        </div>
        <ul className="space-y-1.5">
          {sellPoints.map((point, idx) => (
            <li key={idx} className="text-xs text-neutral-400">· {point}</li>
          ))}
        </ul>
      </div>

      {risks && risks.length > 0 && (
        <div className="p-4 bg-red-500/5 border-t border-red-500/10">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">风险提醒</span>
          </div>
          <ul className="space-y-1.5">
            {risks.map((risk, idx) => (
              <li key={idx} className="text-xs text-red-400/80">· {risk}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
