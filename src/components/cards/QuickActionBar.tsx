import { motion } from 'framer-motion';
import {
  Search,
  BarChart3,
  FileText,
  Calendar,
  Lightbulb,
  User,
  FileCheck,
  Users,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuickAction } from '@/types';

interface QuickActionBarProps {
  title: string;
  actions: QuickAction[];
  onActionClick?: (message: string) => void;
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  Search,
  BarChart3,
  FileText,
  Calendar,
  Lightbulb,
  User,
  FileCheck,
  Users,
  BarChart: BarChart3,
};

export function QuickActionBar({
  title,
  actions,
  onActionClick,
  className
}: QuickActionBarProps) {
  return (
    <div className={cn('', className)}>
      <h4 className="text-sm font-medium text-neutral-500 mb-3">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => {
          const Icon = iconMap[action.icon] || Lightbulb;

          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onActionClick?.(action.message)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full',
                'bg-neutral-900 border border-neutral-800 text-neutral-300',
                'hover:bg-neutral-800 hover:border-neutral-700 transition-colors',
                'text-sm font-medium'
              )}
            >
              <Icon className="w-4 h-4 text-neutral-500" />
              {action.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
