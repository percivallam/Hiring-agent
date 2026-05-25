import { motion } from 'framer-motion';
import { Users, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NetworkGraphMessage } from '@/types';
import { Avatar } from '@/components/shared/Avatar';

interface NetworkGraphCardProps {
  centerPerson: string;
  connections: NetworkGraphMessage['connections'];
  insights: string[];
  className?: string;
}

export function NetworkGraphCard({
  centerPerson,
  connections,
  insights,
  className
}: NetworkGraphCardProps) {
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
        <h3 className="font-semibold text-neutral-100">人脉关系图谱</h3>
        <p className="text-xs text-neutral-500 mt-1">以「{centerPerson}」为中心的人脉网络</p>
      </div>

      <div className="p-4">
        {/* Center */}
        <div className="flex justify-center mb-6">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-amber-600 flex items-center justify-center text-white font-semibold text-lg">
              {centerPerson.charAt(0)}
            </div>
            <span className="text-sm font-medium text-neutral-200 mt-2">{centerPerson}</span>
          </div>
        </div>

        {/* Connections */}
        <div className="grid grid-cols-2 gap-3">
          {connections.map((conn, idx) => (
            <motion.div
              key={conn.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-800"
            >
              <div className="flex items-center gap-2">
                <Avatar name={conn.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-200">{conn.name}</p>
                  <p className="text-xs text-neutral-500">{conn.company}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-neutral-500 flex items-center gap-1">
                  <Link2 className="w-3 h-3" />{conn.relation}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        conn.connectionStrength >= 7 ? 'bg-emerald-500' : conn.connectionStrength >= 4 ? 'bg-amber-500' : 'bg-neutral-500'
                      )}
                      style={{ width: `${conn.connectionStrength * 10}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-neutral-500">{conn.connectionStrength}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-neutral-800/30 border-t border-neutral-800">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-neutral-300">洞察</span>
        </div>
        <ul className="space-y-1.5">
          {insights.map((insight, idx) => (
            <li key={idx} className="text-xs text-neutral-400">· {insight}</li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
